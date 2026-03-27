import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'

// Hash-based routing so GitHub Pages (SPA) doesn't 404
const isPrivacyPage =
  window.location.hash.includes('privacy-policy') ||
  window.location.pathname.includes('privacy-policy')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPrivacyPage ? <PrivacyPolicy /> : <App />}
  </StrictMode>,
)
