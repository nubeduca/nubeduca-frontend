/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS?: string
  readonly VITE_API_USUARIOS?: string
  readonly VITE_API_CURSOS?: string
  readonly VITE_API_CONTENIDOS?: string
  readonly VITE_API_EVALUACIONES?: string
  readonly VITE_API_CALIFICACIONES?: string
  readonly VITE_API_NOTIFICACIONES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
