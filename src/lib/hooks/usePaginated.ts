import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api/client'

export interface PageResult<T> {
  items: T[]
  nextToken: string | null
}

export interface UsePaginatedResult<T> {
  items: T[]
  nextToken: string | null
  loading: boolean
  loadingMore: boolean
  error: string | null
  reload: () => void
  loadMore: () => void
}

function depsKey(deps: readonly unknown[], revision: number): string {
  return `${revision}:${deps.map((dependency) => String(dependency)).join('|')}`
}

export function usePaginated<T>(
  loadPage: (nextToken: string | null, signal: AbortSignal) => Promise<PageResult<T>>,
  deps: readonly unknown[],
): UsePaginatedResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [nextToken, setNextToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const loadPageRef = useRef(loadPage)
  const requestKey = depsKey(deps, revision)
  const loading = loadedKey !== requestKey

  useEffect(() => {
    loadPageRef.current = loadPage
  }, [loadPage])

  const reload = useCallback(() => {
    setItems([])
    setNextToken(null)
    setError(null)
    setRevision((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    loadPageRef
      .current(null, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) {
          return
        }
        setItems(page.items)
        setNextToken(page.nextToken)
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setError(
          cause instanceof ApiError ? cause.message : 'No se pudo cargar la información.',
        )
        setLoadedKey(requestKey)
      })

    return () => controller.abort()
  }, [requestKey])

  const loadMore = useCallback(() => {
    if (!nextToken || loadingMore) {
      return
    }

    const controller = new AbortController()
    setLoadingMore(true)
    setError(null)

    loadPageRef
      .current(nextToken, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) {
          return
        }
        setItems((current) => [...current, ...page.items])
        setNextToken(page.nextToken)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setError(
          cause instanceof ApiError ? cause.message : 'No se pudo cargar la información.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingMore(false)
        }
      })
  }, [nextToken, loadingMore])

  return {
    items,
    nextToken,
    loading,
    loadingMore,
    error: loading ? null : error,
    reload,
    loadMore,
  }
}
