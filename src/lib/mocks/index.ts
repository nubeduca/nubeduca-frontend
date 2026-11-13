import { IS_MOCK_MODE } from '@/lib/env'

export async function enableMocks(): Promise<void> {
  if (!IS_MOCK_MODE || typeof window === 'undefined') {
    return
  }

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}
