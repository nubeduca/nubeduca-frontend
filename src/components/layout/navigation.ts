import {
  Bell,
  BookOpen,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/lib/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles?: Role[]
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Inicio',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/cursos',
    label: 'Cursos',
    icon: BookOpen,
  },
  {
    to: '/contenidos',
    label: 'Contenidos',
    icon: FolderOpen,
  },
  {
    to: '/evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardList,
  },
  {
    to: '/calificaciones',
    label: 'Calificaciones',
    icon: GraduationCap,
  },
  {
    to: '/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
  },
  {
    to: '/admin/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['ADMIN'],
  },
]

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}
