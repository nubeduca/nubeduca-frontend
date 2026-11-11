export const TENANTS = [
  { id: 'utec', label: 'UTEC' },
  { id: 'upc', label: 'UPC' },
  { id: 'pucp', label: 'PUCP' },
] as const

export type TenantId = (typeof TENANTS)[number]['id']

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const

export type Role = (typeof ROLES)[number]

export const TENANT_LABELS: Record<TenantId, string> = {
  utec: 'UTEC',
  upc: 'UPC',
  pucp: 'PUCP',
}

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TEACHER: 'Docente',
  ADMIN: 'Administrador',
}

export interface Session {
  tenantId: TenantId
  role: Role
  email: string
  name: string
  token: string
}
