import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Header from './components/Header'
import { AuthProvider } from "./hooks/useAuth"
import { SalonSettingsProvider } from './hooks/useSalonSettings' // <-- Importa o novo provider

import Admin from './pages/Admin'
import Home from './pages/Home'

function App() {
  return (
    <AuthProvider>
      <SalonSettingsProvider> {/* <-- Adiciona o provider aqui */}
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </Router>
      </SalonSettingsProvider> {/* <-- Fecha o provider */}
    </AuthProvider>
  )
}

export default App