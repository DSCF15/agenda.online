import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react'
import { useAppointments } from '../hooks/useAppointments'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// URL da API (Backend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const BookingModal = ({ service, isOpen, onClose }) => {
  const { createAppointment } = useAppointments()
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setSelectedDate('')
      setAvailableTimeSlots([])
      setFormData({
        clientName: '', clientEmail: '', clientPhone: '',
        appointmentDate: '', appointmentTime: '', notes: ''
      })
    }
  }, [isOpen])

  if (!isOpen || !service) return null

  const getAvailableDates = () => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i)
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, "dd 'de' MMMM", { locale: ptBR }),
        dayName: format(date, 'EEEE', { locale: ptBR })
      })
    }
    return dates
  }

  const availableDates = getAvailableDates()

  // --- MUDANÇA PRINCIPAL AQUI ---
  const handleDateChange = async (date) => {
    setSelectedDate(date)
    setFormData(prev => ({ ...prev, appointmentDate: date, appointmentTime: '' }))
    setLoadingSlots(true)
    setAvailableTimeSlots([])
    setError('')

    try {
      // Pedido ao TEU backend em vez da Lumi
      const response = await fetch(`${API_URL}/appointments/available-slots?date=${date}&serviceId=${service._id}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': 'bella-vista' // Identifica a barbearia
        }
      })
      
      const data = await response.json()

      if (data.success && data.data && data.data.availableSlots) {
        setAvailableTimeSlots(data.data.availableSlots)
      } else {
         // Se não houver slots ou der erro silencioso, assumimos array vazio
         setAvailableTimeSlots([]) 
      }

    } catch (err) {
      console.error("Erro ao buscar horários:", err)
      setError("Não foi possível carregar os horários. Tente novamente.")
    } finally {
      setLoadingSlots(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await createAppointment({
        ...formData,
        serviceId: service._id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration, // Importante enviar a duração
        status: 'agendado'
      })
      alert("✅ Agendamento realizado com sucesso!")
      onClose()
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      setError(error.message || 'Erro ao realizar agendamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agendar Serviço</h2>
            <p className="text-purple-600 font-medium">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Service Info */}
        <div className="bg-purple-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="text-purple-600" size={20} />
              <span className="text-gray-700">{service.duration} minutos</span>
            </div>
            <div className="text-2xl font-bold text-pink-600">
              € {service.price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User size={20} className="text-purple-600" />
              <span>Informações do Cliente</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input type="text" required value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors" placeholder="Seu nome completo"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                <input type="tel" required value={formData.clientPhone} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors" placeholder="(11) 99999-9999"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" required value={formData.clientEmail} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors" placeholder="seu@email.com"/>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar size={20} className="text-purple-600" />
              <span>Escolha a Data</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableDates.map((date) => (
                <button key={date.value} type="button" onClick={() => handleDateChange(date.value)} className={`p-3 rounded-lg border text-center transition-all ${selectedDate === date.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'}`}>
                  <div className="text-sm font-medium">{date.dayName}</div>
                  <div className="text-xs">{date.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock size={20} className="text-purple-600" />
                <span>Escolha o Horário</span>
              </h3>
              
              {loadingSlots ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2">A verificar horários...</p>
                </div>
              ) : availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {availableTimeSlots.map((time) => (
                    <button key={time} type="button" onClick={() => setFormData(prev => ({ ...prev, appointmentTime: time }))} className={`p-3 rounded-lg border text-center transition-all ${formData.appointmentTime === time ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-700">Não há horários disponíveis.</p>
                  <p className="text-sm">A barbearia pode estar fechada neste dia ou todos os horários já estão ocupados.</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageSquare size={20} className="text-purple-600" />
              <span>Observações (Opcional)</span>
            </h3>
            <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors" rows={3} placeholder="Alguma observação especial..."/>
          </div>

          {error && (
            <div className="text-center text-red-600 text-sm font-medium bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingSlots || !formData.clientName || !formData.appointmentTime}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A processar...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingModal