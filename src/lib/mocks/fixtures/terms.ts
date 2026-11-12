import { TENANTS } from '@/lib/types'
import type { MockTerm } from '../types'
import { mockId } from './ids'

export const TERMS: MockTerm[] = TENANTS.flatMap((tenant, tenantIndex) => [
  {
    tenantId: tenant.id,
    termId: mockId('trm', 2000 + tenantIndex * 2),
    name: '2026-2',
    startsOn: '2026-08-17',
    endsOn: '2026-12-20',
    status: 'ACTIVE',
  },
  {
    tenantId: tenant.id,
    termId: mockId('trm', 2000 + tenantIndex * 2 + 1),
    name: '2027-1',
    startsOn: '2027-03-01',
    endsOn: '2027-07-15',
    status: 'PLANNED',
  },
])
