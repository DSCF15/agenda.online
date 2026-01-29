import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // --- AQUI ESTÁ A CORREÇÃO ---
  // Estamos a simular que o site deteta que é a 'barbeariajc'
  // No futuro, isto vai ler o URL automaticamente.
  const getTenantId = () => {
    // Se estivermos no computador local, força 'barbeariajc'
    if (window.location.hostname.includes('localhost')) {
      return 'barbeariajc'
    }
    // Se estiver online (ex: barbeariajcamacha.agenda.online), lê o subdomínio
    return window.location.hostname.split('.')[0]
  }

  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': getTenantId(), // <--- Usa a função inteligente
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      // Adicionamos ?active=true para garantir que só vêm os ativos
      const response = await fetch(`${API_URL}/services?active=true`, {
        headers: getHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        setServices(data.data || [])
        // Log para veres no browser (F12) se vieram serviços
        console.log(`✅ Serviços carregados para ${getTenantId()}:`, data.data)
      } else {
        console.error('Erro backend:', data.error)
      }
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // (Mantivemos as outras funções iguais, mas com o header corrigido)
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
      console.error(error); throw error
    }
  }

  const deleteService = async (serviceId) => {
    try {
      await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      setServices(prev => prev.filter(s => s._id !== serviceId))
    } catch (error) {
      console.error(error); throw error
    }
  }

  return { services, loading, error, createService, deleteService, refetch: fetchServices }
}