import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext()

// URL do teu Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': 'bella-vista', // Nome da barbearia para teste
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data.user)
          setIsAuthenticated(true)
        }
      } else {
        // Se o token for inválido, limpa tudo
        localStorage.removeItem('authToken')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': 'bella-vista'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // Guarda o token e atualiza o estado
      localStorage.setItem('authToken', data.data.token)
      setUser(data.data.user)
      setIsAuthenticated(true)
      return data.data.user

    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const signOut = async () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    checkAuth,
    token: localStorage.getItem('authToken')
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}