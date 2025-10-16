
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { TenantProvider } from './hooks/useTenant'
import { AuthProvider } from './hooks/useAuth'
import TenantHeader from './components/TenantHeader'
import TenantHome from './pages/TenantHome'
import Admin from './pages/Admin'
import Home from './pages/Home'

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <TenantHeader />
            <Routes>
              <Route path="/" element={<TenantHome />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/home" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </TenantProvider>
    </Router>
  )
}

export default App
