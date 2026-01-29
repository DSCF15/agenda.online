import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': 'bella-vista',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  useEffect(() => {
    // Busca inicial (pode ser ajustada para só correr se for admin)
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/appointments`, {
        headers: getHeaders()
      })
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createAppointment = async (appointmentData) => {
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(appointmentData)
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error || data.message)
      
      // Adiciona à lista local apenas se tivermos sucesso
      setAppointments(prev => [data.data, ...prev])
      return data.data
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      throw error
    }
  }

  const updateAppointment = async (appointmentId, updates) => {
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setAppointments(prev => prev.map(appointment => 
        appointment._id === appointmentId ? data.data : appointment
      ))
      return data.data
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error)
      throw error
    }
  }

  const cancelAppointment = async (appointmentId, reason = 'Cancelado pelo utilizador') => {
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason, cancelledBy: 'client' })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      // Atualiza a lista local
      setAppointments(prev => prev.map(appointment => 
        appointment._id === appointmentId ? data.data : appointment
      ))
      
      return data.data
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      throw error
    }
  }

  const getAppointmentsByDate = (date) => {
    // Nota: O backend retorna datas completas ISO. A comparação aqui pode precisar de ajustes
    // dependendo de como 'date' vem do frontend (string YYYY-MM-DD vs Date object)
    return appointments.filter(apt => apt.appointmentDate.startsWith(date))
  }

  const getAppointmentsByStatus = (status) => {
    return appointments.filter(apt => apt.status === status)
  }

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getAppointmentsByDate,
    getAppointmentsByStatus,
    refetch: fetchAppointments
  }
}