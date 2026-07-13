import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initCapacitorBackButton } from '@/native/initCapacitorBackButton'
import './index.css'

initCapacitorBackButton()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
