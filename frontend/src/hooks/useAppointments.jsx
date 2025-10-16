
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

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

  const createAppointment = async (appointmentData) => {
    try {
      // Verificar se já existe agendamento no mesmo horário
      const conflictingAppointment = appointments.find(apt => 
        apt.appointmentDate === appointmentData.appointmentDate &&
        apt.appointmentTime === appointmentData.appointmentTime &&
        apt.status !== 'cancelado'
      )

      if (conflictingAppointment) {
        throw new Error('Já existe um agendamento neste horário')
      }

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

  const deleteAppointment = async (appointmentId) => {
    try {
      await lumi.entities.appointments.delete(appointmentId)
      setAppointments(prev => prev.filter(appointment => appointment._id !== appointmentId))
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error)
      throw error
    }
  }

  const getAvailableTimeSlots = (date, serviceId, serviceDuration) => {
    // Horários de funcionamento (9h às 18h)
    const workingHours = {
      start: 9,
      end: 18
    }

    // Gerar slots de 30 em 30 minutos
    const timeSlots = []
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        timeSlots.push(time)
      }
    }

    // Filtrar horários já ocupados
    const occupiedSlots = appointments
      .filter(apt => 
        apt.appointmentDate === date && 
        apt.status !== 'cancelado'
      )
      .map(apt => apt.appointmentTime)

    // Retornar apenas horários disponíveis
    return timeSlots.filter(slot => !occupiedSlots.includes(slot))
  }

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
    deleteAppointment,
    getAvailableTimeSlots,
    getAppointmentsByDate,
    getAppointmentsByStatus,
    refetch: fetchAppointments
  }
}
