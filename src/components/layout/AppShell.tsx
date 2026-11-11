import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Suspense
              fallback={
                <div className="flex min-h-64 items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
        <footer className="border-t border-slate-200 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          Nubeduca · Fase 0 · Shell del frontend. Cada módulo vive en{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5">src/modules</code>.
        </footer>
      </div>
    </div>
  )
}
