import { Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">404</p>
        <h1 className="text-3xl font-semibold text-slate-900">Esta página no existe</h1>
        <p className="text-sm text-slate-500">
          Revisa la ruta o vuelve al inicio de Nubeduca.
        </p>
        <Button
          leftIcon={<Home className="size-4" aria-hidden />}
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </Button>
        <p className="text-xs text-slate-400">
          También puedes ir a{' '}
          <Link to="/login" className="text-brand-600">
            login
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
