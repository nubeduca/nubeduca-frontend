import { API_BASE_URLS, type ApiService } from '@/lib/env'
import { readSession } from '@/lib/session'

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
  headers?: Record<string, string>
  signal?: AbortSignal
}

function buildHeaders(options: ApiRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const session = readSession()
  if (session) {
    headers.Authorization = session.token
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
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json().catch(() => null)

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
