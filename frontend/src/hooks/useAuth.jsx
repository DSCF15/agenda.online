import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Função inteligente para ler a loja a partir do endereço (URL)
  const getCurrentTenant = () => {
    const pathParts = window.location.pathname.split('/')
    // Se o URL for "http://localhost:5173/barbeariajc/admin", ele extrai "barbeariajc"
    if (pathParts.length > 1 && pathParts[1]) {
      return pathParts[1]
    }
    return 'barbeariajc' // Fallback de segurança
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Verificar se já existe token guardado ao recarregar a página
  const checkAuth = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant': getCurrentTenant() // <-- CORREÇÃO 1: Adicionado o x-tenant dinâmico
        }
      })
      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
      } else {
        localStorage.removeItem('authToken') // Token inválido
      }
    } catch (error) {
      console.error('Erro ao verificar auth:', error)
      localStorage.removeItem('authToken')
    } finally {
      setLoading(false)
    }
  }

  // Função de Login Real
  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant': getCurrentTenant() // <-- CORREÇÃO 2: Substituído o 'bella-vista' fixo
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('authToken', data.data.token)
        setUser(data.data.user)
        return true
      } else {
        alert(data.error || 'Login falhou. Verifique as suas credenciais.') // Feedback visual de erro
        throw new Error(data.error || 'Login falhou')
      }
    } catch (error) {
      throw error
    }
  }

  const signOut = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    // CORREÇÃO 3: Fazer reload em vez de redirecionar para a raiz (/)
    // Assim o utilizador volta a ver o ecrã de login da loja onde estava
    window.location.reload() 
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)