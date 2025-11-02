
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { TenantProvider } from "./hooks/useTenant"
import { AuthProvider } from "./hooks/useAuth"
import TenantHeader from "./components/TenantHeader"
import TenantHome from './pages/TenantHome'
import Admin from './pages/Admin'
import Home from './pages/Home'

function App() {
  return (
    <TenantProvider>
        <AuthProvider>
          <Router>
      
          <div className="min-h-screen bg-gray-50">
            <TenantHeader />
            <Routes>
  <Route path="/home" element={<Home />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/tenant" element={<TenantHome />} />
  <Route path="/" element={<Navigate to="/home" replace />} />
  <Route path="*" element={<Navigate to="/home" replace />} />
</Routes>

          </div>
        
    </Router>
    </AuthProvider>
      </TenantProvider>
  )
}

export default App
