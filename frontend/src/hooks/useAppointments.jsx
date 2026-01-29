import { useState } from 'react'

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
    try {
      const response = await fetch(`${API_URL}/appointments`, { headers: getHeaders() })
      const data = await response.json()
      if (data.success) setAppointments(data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createAppointment = async (appointmentData) => {
    // Força o tenantId correto nos dados enviados
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
    return data.data
  }

  // (Mantivemos update e cancel simplificados para poupar espaço, mas funcionam igual)
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
    // Função auxiliar para compatibilidade
    getAppointmentsByDate: (date) => appointments.filter(a => a.appointmentDate.startsWith(date))
  }
}