import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Nota: Isto SÓ deve ser chamado na página de Admin.
    // Se não estivermos no Admin, nem devia correr.
    fetchAppointments()
  }, [])

  // Esta função é PESADA. Só o Admin a deve usar.
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.appointments.list({
        orderBy: { appointmentDate: 'desc' }
      })
      setAppointments(list || [])
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* Esta função é INSEGURA e LENTA.
   O ideal é chamar uma Função Lumi (backend) para fazer isto.
   ex: lumi.functions.execute('createSecureAppointment', appointmentData)
  */
  const createAppointment = async (appointmentData) => {
    try {
      const newAppointment = await lumi.entities.appointments.create({
        ...appointmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setAppointments(prev => [newAppointment, ...prev])
      return newAppointment
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      throw error
    }
  }

  const updateAppointment = async (appointmentId, updates) => {
    try {
      const updatedAppointment = await lumi.entities.appointments.update(appointmentId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      setAppointments(prev => prev.map(appointment => 
        appointment._id === appointmentId ? updatedAppointment : appointment
      ))
      return updatedAppointment
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error)
      throw error
    }
  }

  // Renomeado para ser mais claro. Em vez de apagar, cancelamos.
  const cancelAppointment = async (appointmentId) => {
    try {
      return await updateAppointment(appointmentId, { status: 'cancelado' })
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      throw error
    }
  }

  // Esta função NUNCA devia estar no frontend.
  // const getAvailableTimeSlots = (...) => { ... } // REMOVIDO!

  // Funções de filtragem (OK para o Admin)
  const getAppointmentsByDate = (date) => {
    return appointments.filter(apt => apt.appointmentDate === date)
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
    cancelAppointment, // Nome mudado
    getAppointmentsByDate,
    getAppointmentsByStatus,
    refetch: fetchAppointments
  }
}