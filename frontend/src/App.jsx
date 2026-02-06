import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./hooks/useAuth"
import { SalonSettingsProvider } from './hooks/useSalonSettings'
import { Toaster } from 'react-hot-toast'

import Admin from './pages/Admin'
import Home from './pages/Home'
import ConfirmAppointment from './pages/ConfirmAppointment'

function App() {
  return (
    <AuthProvider>
      <SalonSettingsProvider>
        <Router>
          <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fbbf24' }}} />
          <div className="min-h-screen bg-zinc-950">
            <Routes>
              {/* ROTA DINÂMICA: O ":tenantId" apanha qualquer coisa que escrevas no link */}
              {/* Ex: /barbeariajc ou /zonavelhabarbershop */}
              <Route path="/:tenantId" element={<Home />} />

              {/* Rota de Confirmação (Global) */}
              <Route path="/confirm/:token" element={<ConfirmAppointment />} />

              {/* Rota de Admin (Podes proteger ou fazer /:tenantId/admin depois) */}
              <Route path="/admin" element={<Admin />} />
              
              {/* Redirecionamento da raiz: Se alguém entrar só em agenda.online.com,
                  mandamos para uma loja padrão ou uma landing page. 
                  Por agora, mando para a barbeariajc */}
              <Route path="/" element={<Navigate to="/barbeariajc" replace />} />
              
              {/* Qualquer outra coisa vai para a raiz */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SalonSettingsProvider>
    </AuthProvider>
  )
}

export default App