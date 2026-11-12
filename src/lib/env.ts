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

export const API_BASE_URLS: Record<ApiService, string | undefined> = IS_MOCK_MODE
  ? {
      usuarios: mockBase('usuarios'),
      cursos: mockBase('cursos'),
      contenidos: mockBase('contenidos'),
      evaluaciones: mockBase('evaluaciones'),
      calificaciones: mockBase('calificaciones'),
      notificaciones: mockBase('notificaciones'),
    }
  : {
      usuarios: env.VITE_API_USUARIOS,
      cursos: env.VITE_API_CURSOS,
      contenidos: env.VITE_API_CONTENIDOS,
      evaluaciones: env.VITE_API_EVALUACIONES,
      calificaciones: env.VITE_API_CALIFICACIONES,
      notificaciones: env.VITE_API_NOTIFICACIONES,
    }
