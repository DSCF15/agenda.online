import { useState, useEffect } from 'react'

// Aponta para o teu servidor local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Função auxiliar para os cabeçalhos (Auth + Tenant)
  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'x-tenant': 'bella-vista', // Importante para identificar a barbearia
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  useEffect(() => {
    // Carrega agendamentos se estivermos na página de admin (ou se precisarmos de listar)
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
      } else {
        // Se não for sucesso mas não for erro crítico (ex: 404 vazio), não faz nada
        if (data.error) console.warn(data.error)
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
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Erro ao criar agendamento')
      }
      
      // Adiciona à lista local imediatamente para feedback visual
      setAppointments(prev => [data.data, ...prev])
      return data.data
    } catch (error) {
      console.error('Erro no createAppointment:', error)
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

  const cancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason: 'Cancelado pelo admin', cancelledBy: 'salon' })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setAppointments(prev => prev.map(appointment => 
        appointment._id === appointmentId ? data.data : appointment
      ))
      return data.data
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      throw error
    }
  }

  // Filtros locais (mantive a lógica que tinhas)
  const getAppointmentsByDate = (date) => {
    return appointments.filter(apt => apt.appointmentDate && apt.appointmentDate.startsWith(date))
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