import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './app-style.css'
import './modern.css'
import './components/login-presentation.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
