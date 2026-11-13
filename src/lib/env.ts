export const API_SERVICES = [
  'usuarios',
  'cursos',
  'contenidos',
  'evaluaciones',
  'calificaciones',
  'notificaciones',
] as const

export type ApiService = (typeof API_SERVICES)[number]

const env = import.meta.env

export const IS_MOCK_MODE = env.VITE_USE_MOCKS === 'true'

export const MOCK_API_PREFIX = '/mock-api'

function mockBase(service: ApiService): string {
  return `${MOCK_API_PREFIX}/${service}`
}

const REAL_URLS: Record<ApiService, string | undefined> = {
  usuarios: env.VITE_API_USUARIOS,
  cursos: env.VITE_API_CURSOS,
  contenidos: env.VITE_API_CONTENIDOS,
  evaluaciones: env.VITE_API_EVALUACIONES,
  calificaciones: env.VITE_API_CALIFICACIONES,
  notificaciones: env.VITE_API_NOTIFICACIONES,
}

function hasUrl(url: string | undefined): url is string {
  return Boolean(url?.trim())
}

/**
 * Modo mixto: con mocks activos, el servicio que ya tiene `VITE_API_*` usa su
 * API real y el resto sigue en MSW. Sin mocks, todos van a su URL real.
 */
export const REAL_SERVICES: ApiService[] = API_SERVICES.filter((service) =>
  hasUrl(REAL_URLS[service]),
)

export const API_BASE_URLS = Object.fromEntries(
  API_SERVICES.map((service) => {
    const url = REAL_URLS[service]
    if (!IS_MOCK_MODE) {
      return [service, url]
    }
    return [service, hasUrl(url) ? url.trim() : mockBase(service)]
  }),
) as Record<ApiService, string | undefined>

export type AuthMode = 'mock' | 'cognito'

export const AUTH_MODE: AuthMode = env.VITE_AUTH_MODE === 'cognito' ? 'cognito' : 'mock'

export const IS_COGNITO_AUTH = AUTH_MODE === 'cognito'

export const COGNITO_CONFIG = {
  userPoolId: env.VITE_COGNITO_USER_POOL_ID ?? '',
  userPoolClientId: env.VITE_COGNITO_CLIENT_ID ?? '',
}

export const IS_COGNITO_CONFIGURED = Boolean(
  COGNITO_CONFIG.userPoolId && COGNITO_CONFIG.userPoolClientId,
)
