import { DEMO_USER_IDS } from '@/lib/demo-users'
import { TENANTS } from '@/lib/types'
import type { MockUser } from '../types'
import { mockUuid } from './ids'

const CREATED_AT = '2026-11-10T15:00:00Z'

const STUDENT_NAMES = [
  { givenName: 'Luis', familyName: 'Quispe' },
  { givenName: 'María', familyName: 'Rojas' },
  { givenName: 'Carlos', familyName: 'Mendoza' },
  { givenName: 'Elena', familyName: 'Castillo' },
]

export const USERS: MockUser[] = TENANTS.flatMap((tenant, tenantIndex) => {
  const tenantCode = tenant.id.toUpperCase()
  const demoStudentCode = String(202310457 + tenantIndex * 1000)
  const teacherId = DEMO_USER_IDS[tenant.id].TEACHER
  const studentId = DEMO_USER_IDS[tenant.id].STUDENT
  const adminId = DEMO_USER_IDS[tenant.id].ADMIN

  const demoUsers: MockUser[] = [
    {
      tenantId: tenant.id,
      userId: teacherId,
      role: 'TEACHER',
      institutionalCode: `DOC-${tenantCode}-001`,
      givenName: 'Docente',
      familyName: tenant.label,
      email: `docente.demo@${tenant.id}.edu.pe`,
      locale: 'es-PE',
      timeZone: 'America/Lima',
      createdAt: CREATED_AT,
    },
    {
      tenantId: tenant.id,
      userId: studentId,
      role: 'STUDENT',
      institutionalCode: demoStudentCode,
      givenName: 'Ana',
      familyName: 'Torres',
      email: `alumno.demo@${tenant.id}.edu.pe`,
      locale: 'es-PE',
      timeZone: 'America/Lima',
      createdAt: CREATED_AT,
    },
    {
      tenantId: tenant.id,
      userId: adminId,
      role: 'ADMIN',
      institutionalCode: null,
      givenName: 'Admin',
      familyName: tenant.label,
      email: `admin@${tenant.id}.edu.pe`,
      locale: 'es-PE',
      timeZone: 'America/Lima',
      createdAt: CREATED_AT,
    },
  ]

  const extraStudents: MockUser[] = STUDENT_NAMES.map((name, index) => ({
    tenantId: tenant.id,
    userId: mockUuid(tenantIndex * 100 + index + 1),
    role: 'STUDENT',
    institutionalCode: String(Number(demoStudentCode) + index + 1),
    givenName: name.givenName,
    familyName: name.familyName,
    email: `estudiante${index + 1}@${tenant.id}.edu.pe`,
    locale: 'es-PE',
    timeZone: 'America/Lima',
    createdAt: CREATED_AT,
  }))

  return [...demoUsers, ...extraStudents]
})
