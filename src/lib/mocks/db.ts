import { seedDb } from './fixtures/seed'
import type { MockDb } from './types'

export const mockState: { db: MockDb } = {
  db: seedDb(),
}

export function resetDb(): void {
  mockState.db = seedDb()
}
