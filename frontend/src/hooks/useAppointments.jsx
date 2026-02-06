import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  // Função para carregar agenda (aceita tenantId)
  const fetchAppointments = useCallback(async (tenantId = 'barbeariajc') => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          'x-tenant': tenantId
        }
      })
      const data = await response.json()
      if (data.success) {
        setAppointments(data.data)
      }
    } catch (error) {
      console.error('Erro appointments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Função para criar marcação
  const createAppointment = async (appointmentData) => {
    const response = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-tenant': appointmentData.tenantId // Envia o ID correto
      },
      body: JSON.stringify(appointmentData)
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
    return data
  }

  // 👇👇👇 CERTIFICA-TE QUE "fetchAppointments" ESTÁ AQUI 👇👇👇
  return { 
    appointments, 
    loading, 
    fetchAppointments, // <--- OBRIGATÓRIO
    createAppointment 
  }
}