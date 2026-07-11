import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import './i18n' // Initialize i18next
import './index.css'
import App from './App.jsx'
import Dashboard from './Dashboard.jsx'
import DroneProfileEditor from './DroneProfileEditor.jsx'
import ControlSettings from './ControlSettings.jsx'

function DashboardRoute() {
  const [params] = useSearchParams()
  return params.get('slave') ? <App /> : <Dashboard />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drone/:droneId" element={<App />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/settings" element={<DroneProfileEditor />} />
        <Route path="/control-settings" element={<ControlSettings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
