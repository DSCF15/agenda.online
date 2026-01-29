import { useState, useEffect } from 'react'

// URL da tua API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Headers com autenticação e identificação da barbearia
  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': 'bella-vista',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/services?active=true`, {
        headers: getHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        setServices(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (serviceData) => {
    try {
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(serviceData)
      })
      
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      setServices(prev => [data.data, ...prev])
      return data.data
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      throw error
    }
  }

  // --- AQUI ESTÁ A FUNÇÃO QUE APAGA ---
  const deleteService = async (serviceId) => {
    try {
      const response = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      
      if (!response.ok) throw new Error('Falha ao remover serviço')
      
      // Remove da lista localmente para o ecrã atualizar logo
      setServices(prev => prev.filter(service => service._id !== serviceId))
    } catch (error) {
      console.error('Erro ao deletar serviço:', error)
      throw error
    }
  }

  const updateService = async (serviceId, updates) => {
    try {
      const response = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setServices(prev => prev.map(service => 
        service._id === serviceId ? data.data : service
      ))
      return data.data
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error)
      throw error
    }
  }

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices
  }
}