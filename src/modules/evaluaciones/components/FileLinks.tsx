import { Download } from 'lucide-react'
import { useState } from 'react'
import { getDownloadLink } from '@/lib/api/contenidos'
import { errorMessage } from '@/lib/format'

/** Botones para descargar los archivos de una entrega (URL prefirmada de ms-contenidos). */
export function FileLinks({ fileIds }: { fileIds: string[] }) {
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function open(fileId: string) {
    setError(null)
    setLoadingId(fileId)
    try {
      const link = await getDownloadLink(fileId)
      window.open(link.downloadUrl, '_blank', 'noopener')
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {fileIds.map((fileId, index) => (
        <button
          key={fileId}
          type="button"
          onClick={() => void open(fileId)}
          disabled={loadingId === fileId}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-brand-200 hover:text-brand-700 disabled:opacity-50"
        >
          <Download className="size-3.5" aria-hidden />
          Archivo {index + 1}
        </button>
      ))}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  )
}
