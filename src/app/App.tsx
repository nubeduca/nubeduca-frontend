import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from './DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { GuestOnly, RequireAuth } from './guards'

const CursosPage = lazy(() =>
  import('@/modules/cursos').then((module) => ({ default: module.CursosPage })),
)
const CursoDetallePage = lazy(() =>
  import('@/modules/cursos').then((module) => ({
    default: module.CursoDetallePage,
  })),
)
const ContenidosPage = lazy(() =>
  import('@/modules/contenidos').then((module) => ({
    default: module.ContenidosPage,
  })),
)
const EvaluacionesPage = lazy(() =>
  import('@/modules/evaluaciones').then((module) => ({
    default: module.EvaluacionesPage,
  })),
)
const CalificacionesPage = lazy(() =>
  import('@/modules/calificaciones').then((module) => ({
    default: module.CalificacionesPage,
  })),
)
const NotificacionesPage = lazy(() =>
  import('@/modules/notificaciones').then((module) => ({
    default: module.NotificacionesPage,
  })),
)
const UsuariosPage = lazy(() =>
  import('@/modules/usuarios').then((module) => ({
    default: module.UsuariosPage,
  })),
)

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="cursos" element={<CursosPage />} />
            <Route path="cursos/:courseId" element={<CursoDetallePage />} />
            <Route path="contenidos" element={<ContenidosPage />} />
            <Route path="evaluaciones" element={<EvaluacionesPage />} />
            <Route path="calificaciones" element={<CalificacionesPage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
            <Route
              path="admin/usuarios"
              element={
                <RequireAuth roles={['ADMIN']}>
                  <UsuariosPage />
                </RequireAuth>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
