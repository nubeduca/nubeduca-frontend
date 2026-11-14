import { useEffect, useMemo, useState } from 'react'
import { getUser } from '@/lib/api/usuarios'
import type { User } from '@/lib/api/types'

/**
 * Perfiles por id. Con ms-usuarios real hay miles de usuarios y `listUsers({ limit: 100 })`
 * no trae a todos: los ids que falten se piden con `GET /users/{userId}` y quedan en caché
 * mientras dure la página.
 */
const cache = new Map<string, User>()
const failed = new Set<string>()

export function fullName(user: User): string {
  return `${user.givenName} ${user.familyName}`.trim()
}

/** Guarda en la caché los usuarios que ya trajo una lista. */
export function rememberUsers(users: readonly User[]): void {
  for (const user of users) {
    cache.set(user.userId, user)
  }
}

export function useUsers(userIds: readonly string[]): Map<string, User> {
  const key = [...new Set(userIds)].sort().join(',')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const missing = key
      ? key.split(',').filter((id) => !cache.has(id) && !failed.has(id))
      : []
    if (missing.length === 0) {
      return
    }
    let cancelled = false
    void Promise.allSettled(
      missing.map((id) =>
        getUser(id).then(
          (user) => cache.set(id, user),
          () => failed.add(id),
        ),
      ),
    ).then(() => {
      if (!cancelled) {
        setVersion((value) => value + 1)
      }
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return useMemo(() => {
    const result = new Map<string, User>()
    if (version >= 0) {
      for (const id of key ? key.split(',') : []) {
        const user = cache.get(id)
        if (user) {
          result.set(id, user)
        }
      }
    }
    return result
  }, [key, version])
}

/** Nombre para mostrar: el del perfil o, si no se pudo leer, el inicio del id. */
export function useUserNames(userIds: readonly string[]): (userId: string) => string {
  const users = useUsers(userIds)
  return (userId: string) => {
    const user = users.get(userId)
    return user ? fullName(user) : userId.slice(0, 8)
  }
}
