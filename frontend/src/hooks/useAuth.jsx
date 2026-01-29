import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
          'Authorization': `Bearer ${token}` 
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
          'x-tenant': 'bella-vista' // Identifica a barbearia
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('authToken', data.data.token)
        setUser(data.data.user)
        return true
      } else {
        throw new Error(data.error || 'Login falhou')
      }
    } catch (error) {
      throw error
    }
  }

  const signOut = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    // Redireciona para a home ou faz refresh
    window.location.href = '/' 
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)