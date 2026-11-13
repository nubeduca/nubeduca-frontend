import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { enableMocks } from '@/lib/mocks'
import '@/styles/index.css'

async function bootstrap(): Promise<void> {
  try {
    await enableMocks()
  } finally {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}

void bootstrap()
