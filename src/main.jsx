import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import KalakarLanding from './KalakarLanding.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KalakarLanding />
  </StrictMode>,
)
