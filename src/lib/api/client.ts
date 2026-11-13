import { cognitoIdToken } from '@/features/auth/cognito'
import { API_BASE_URLS, IS_COGNITO_AUTH, type ApiService } from '@/lib/env'
import { readSession, writeSession } from '@/lib/session'

/** Se dispara cuando la sesión ya no es válida (401); AuthProvider cierra sesión. */
export const SESSION_EXPIRED_EVENT = 'nubeduca:session-expired'

export interface ApiErrorBody {
  code?: string
  message?: string
  requestId?: string
}

export class ApiError extends Error {
  status: number
  code: string
  requestId?: string

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  rawBody?: BodyInit
  contentType?: string
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function currentToken(): Promise<string | null> {
  const session = readSession()
  if (!session) {
    return null
  }
  if (!IS_COGNITO_AUTH) {
    return session.token
  }

  // Amplify renueva el ID token con el refresh token cuando está por vencer.
  const token = await cognitoIdToken()
  if (token && token !== session.token) {
    writeSession({ ...session, token })
  }
  return token
}

async function buildHeaders(options: ApiRequestOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (options.rawBody !== undefined) {
    headers['Content-Type'] = options.contentType ?? 'text/plain'
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const token = await currentToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function apiRequest<T>(
  service: ApiService,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = API_BASE_URLS[service]
  if (!baseUrl) {
    throw new ApiError(
      0,
      'SERVICIO_NO_CONFIGURADO',
      `Falta la URL base del servicio ${service}. Revisa las variables VITE_API_*.`,
    )
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method: options.method ?? 'GET',
    headers: await buildHeaders(options),
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json().catch(() => null)

  if (response.status === 401 && readSession()) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }

  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody
    throw new ApiError(
      response.status,
      body.code ?? 'ERROR_DESCONOCIDO',
      body.message ?? 'No se pudo completar la petición.',
      body.requestId,
    )
  }

  return data as T
}

export const api = {
  get: <T>(service: ApiService, path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(service, path, { ...options, method: 'GET' }),
  post: <T>(
    service: ApiService,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(service, path, { ...options, method: 'POST', body }),
  postRaw: <T>(
    service: ApiService,
    path: string,
    rawBody: BodyInit,
    contentType: string,
    options?: ApiRequestOptions,
  ) =>
    apiRequest<T>(service, path, {
      ...options,
      method: 'POST',
      rawBody,
      contentType,
    }),
  put: <T>(
    service: ApiService,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(service, path, { ...options, method: 'PUT', body }),
  patch: <T>(
    service: ApiService,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(service, path, { ...options, method: 'PATCH', body }),
  delete: <T>(service: ApiService, path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(service, path, { ...options, method: 'DELETE' }),
}
