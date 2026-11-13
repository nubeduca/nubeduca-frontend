import { COGNITO_CONFIG, IS_COGNITO_CONFIGURED } from '@/lib/env'
import { ROLES, TENANTS, type Role, type TenantId } from '@/lib/types'

export interface CognitoIdentity {
  userId: string
  tenantId: TenantId
  role: Role
  email: string
  name: string | null
  idToken: string
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

let configured: Promise<typeof import('aws-amplify/auth')> | null = null

function loadAuth(): Promise<typeof import('aws-amplify/auth')> {
  if (!IS_COGNITO_CONFIGURED) {
    return Promise.reject(
      new AuthError(
        'Falta configurar Cognito: define VITE_COGNITO_USER_POOL_ID y VITE_COGNITO_CLIENT_ID.',
      ),
    )
  }

  configured ??= Promise.all([import('aws-amplify'), import('aws-amplify/auth')]).then(
    ([{ Amplify }, auth]) => {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: COGNITO_CONFIG.userPoolId,
            userPoolClientId: COGNITO_CONFIG.userPoolClientId,
          },
        },
      })
      return auth
    },
  )

  return configured
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

async function readIdentity(forceRefresh = false): Promise<CognitoIdentity | null> {
  const auth = await loadAuth()
  const { tokens } = await auth.fetchAuthSession({ forceRefresh })
  const idToken = tokens?.idToken
  if (!idToken) {
    return null
  }

  const claims = idToken.payload
  const userId = asString(claims.sub)
  const email = asString(claims.email)
  const tenantId = asString(claims['custom:tenant_id'])
  const role = asString(claims['custom:role'])

  if (!userId || !email) {
    throw new AuthError('El token no trae el usuario o el correo.')
  }
  if (!tenantId || !TENANTS.some((tenant) => tenant.id === tenantId)) {
    throw new AuthError('El token no trae una institución válida (custom:tenant_id).')
  }
  if (!role || !ROLES.includes(role as Role)) {
    throw new AuthError('El token no trae un rol válido (custom:role).')
  }

  const givenName = asString(claims.given_name)
  const familyName = asString(claims.family_name)
  const name =
    asString(claims.name) ?? ([givenName, familyName].filter(Boolean).join(' ') || null)

  return {
    userId,
    tenantId: tenantId as TenantId,
    role: role as Role,
    email,
    name,
    idToken: idToken.toString(),
  }
}

export async function cognitoSignIn(
  email: string,
  password: string,
): Promise<CognitoIdentity> {
  const auth = await loadAuth()

  // Si quedó una sesión vieja (otro usuario), se cierra antes de entrar.
  await auth.signOut().catch(() => undefined)

  let result: Awaited<ReturnType<typeof auth.signIn>>
  try {
    result = await auth.signIn({ username: email, password })
  } catch (cause) {
    const name = cause instanceof Error ? cause.name : ''
    if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
      throw new AuthError('Correo o contraseña incorrectos.')
    }
    if (name === 'UserNotConfirmedException') {
      throw new AuthError('Tu cuenta todavía no está confirmada.')
    }
    throw new AuthError(
      cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.',
    )
  }

  if (!result.isSignedIn) {
    if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      throw new AuthError(
        'Tu cuenta necesita una contraseña nueva. Pide al administrador que la active.',
      )
    }
    throw new AuthError(`Falta un paso para entrar: ${result.nextStep.signInStep}.`)
  }

  const identity = await readIdentity()
  if (!identity) {
    throw new AuthError('Cognito no devolvió el ID token.')
  }
  return identity
}

/** ID token vigente; Amplify lo renueva solo con el refresh token. */
export async function cognitoIdToken(): Promise<string | null> {
  try {
    const identity = await readIdentity()
    return identity?.idToken ?? null
  } catch {
    return null
  }
}

export async function cognitoSignOut(): Promise<void> {
  if (!IS_COGNITO_CONFIGURED) {
    return
  }
  const auth = await loadAuth()
  await auth.signOut().catch(() => undefined)
}
