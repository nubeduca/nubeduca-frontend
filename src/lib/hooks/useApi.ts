import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api/client'

export interface UseApiResult<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
}

function depsKey(deps: readonly unknown[], revision: number): string {
  return `${revision}:${deps.map((dependency) => String(dependency)).join('|')}`
}

export function useApi<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const loaderRef = useRef(loader)
  const requestKey = depsKey(deps, revision)
  const loading = loadedKey !== requestKey

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const reload = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          setError(null)
          setLoadedKey(requestKey)
        }
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

  return {
    data,
    error: loading ? null : error,
    loading,
    reload,
  }
}
