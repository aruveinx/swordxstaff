import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('A new version of Sword X Staff is available. Reload now? Save any loadout edits before reloading.')) {
      void updateSW(true).catch((error: unknown) => {
        console.error('Failed to update Sword X Staff for offline use:', error)
      })
    }
  },
  onRegisterError(error: unknown) {
    console.error('Failed to register Sword X Staff for offline use:', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)