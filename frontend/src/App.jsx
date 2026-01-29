import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./hooks/useAuth"
import { SalonSettingsProvider } from './hooks/useSalonSettings'
import { Toaster } from 'react-hot-toast'

import Admin from './pages/Admin'
import Home from './pages/Home'

function App() {
  return (
    // 1. O AuthProvider envolve tudo para sabermos quem está logado
    <AuthProvider>
      {/* 2. O SettingsProvider carrega os dados da barbearia (nome, logo, etc) */}
      <SalonSettingsProvider>
        <Router>
          {/* 3. O Toaster fica aqui, disponível para toda a app (não envolve os outros) */}
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />

          <div className="min-h-screen bg-zinc-950">
            
            <Routes>
              {/* Páginas Principais */}
              <Route path="/home" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              
              {/* Redirecionamentos de Segurança */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </Router>
      </SalonSettingsProvider>
    </AuthProvider>
  )
}

export default App