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

export const API_BASE_URLS: Record<ApiService, string | undefined> = {
  usuarios: env.VITE_API_USUARIOS,
  cursos: env.VITE_API_CURSOS,
  contenidos: env.VITE_API_CONTENIDOS,
  evaluaciones: env.VITE_API_EVALUACIONES,
  calificaciones: env.VITE_API_CALIFICACIONES,
  notificaciones: env.VITE_API_NOTIFICACIONES,
}
