import { useState, useEffect } from 'react' // Não te esqueças de importar useEffect

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  const getTenantId = () => {
    if (window.location.hostname.includes('localhost')) return 'barbeariajc'
    return window.location.hostname.split('.')[0]
  }

  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': getTenantId(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    console.log(`🔄 A carregar agenda para: ${getTenantId()}`) // Log para confirmares
    try {
      const response = await fetch(`${API_URL}/appointments`, { headers: getHeaders() })
      const data = await response.json()
      
      console.log('📦 Dados recebidos:', data) // Log para veres os dados

      if (data.success) setAppointments(data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 👇👇👇 AQUI ESTÁ O QUE FALTAVA 👇👇👇
  // Isto obriga o React a carregar os dados assim que a página abre
  useEffect(() => {
    fetchAppointments()
  }, [])
  // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆

  const createAppointment = async (appointmentData) => {
    const payload = {
      ...appointmentData,
      tenantId: getTenantId()
    }

    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error || 'Erro ao criar')
    
    // Opcional: Adiciona logo à lista para não precisar de refresh
    // setAppointments(prev => [...prev, data.data]) 
    return data.data
  }

  const updateAppointment = async (id, updates) => {
    await fetch(`${API_URL}/appointments/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) })
    fetchAppointments()
  }

  const cancelAppointment = async (id) => {
    await fetch(`${API_URL}/appointments/${id}/cancel`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ reason: 'Admin' }) })
    fetchAppointments()
  }

  return { 
    appointments, loading, 
    createAppointment, fetchAppointments, updateAppointment, cancelAppointment,
    getAppointmentsByDate: (date) => appointments.filter(a => a.appointmentDate.startsWith(date))
  }
}