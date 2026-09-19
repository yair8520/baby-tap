import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy'

const root = createRoot(document.getElementById('root'))

function renderRoute() {
  const isPrivacyPage =
    window.location.hash.includes('privacy-policy') ||
    window.location.pathname.includes('privacy-policy')

  root.render(
    <StrictMode>
      {isPrivacyPage ? <PrivacyPolicy /> : <App />}
    </StrictMode>,
  )
}

window.addEventListener('hashchange', renderRoute)
window.addEventListener('popstate', renderRoute)
renderRoute()
