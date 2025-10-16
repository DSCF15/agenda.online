
import React, { useState } from 'react'
import {X, Calendar, Clock, User, Phone, Mail, MessageSquare} from 'lucide-react'
import { useTenantAppointments } from '../hooks/useTenantAppointments'
import { useTenant } from '../hooks/useTenant'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TenantBookingModal = ({ service, isOpen, onClose }) => {
  const { createAppointment, getAvailableTimeSlots } = useTenantAppointments()
  const { tenant } = useTenant()
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  if (!isOpen || !service) return null

  const primaryColor = tenant?.branding?.primaryColor || '#8B5CF6'
  const secondaryColor = tenant?.branding?.secondaryColor || '#EC4899'

  // Gerar próximos 14 dias disponíveis
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
  const availableTimeSlots = selectedDate ? getAvailableTimeSlots(selectedDate, service._id, service.duration) : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createAppointment({
        ...formData,
        serviceId: service._id,
        serviceName: service.name,
        servicePrice: service.price,
        status: 'agendado'
      })
      
      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      })
      setSelectedDate('')
      onClose()
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setFormData(prev => ({ ...prev, appointmentDate: date, appointmentTime: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agendar Serviço</h2>
            <p 
              className="font-medium"
              style={{ color: primaryColor }}
            >
              {service.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Service Info */}
        <div 
          className="p-6 border-b border-gray-200"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock style={{ color: primaryColor }} size={20} />
              <span className="text-gray-700">{service.duration} minutos</span>
            </div>
            <div 
              className="text-2xl font-bold"
              style={{ color: secondaryColor }}
            >
              R$ {service.price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User size={20} style={{ color: primaryColor }} />
              <span>Informações do Cliente</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ 
                    focusRingColor: primaryColor,
                    '--tw-ring-color': primaryColor 
                  }}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ 
                    focusRingColor: primaryColor,
                    '--tw-ring-color': primaryColor 
                  }}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                style={{ 
                  focusRingColor: primaryColor,
                  '--tw-ring-color': primaryColor 
                }}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar size={20} style={{ color: primaryColor }} />
              <span>Escolha a Data</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  type="button"
                  onClick={() => handleDateChange(date.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedDate === date.value
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-opacity-50'
                  }`}
                  style={{
                    backgroundColor: selectedDate === date.value ? primaryColor : undefined,
                    borderColor: selectedDate === date.value ? primaryColor : undefined,
                    '--hover-border-color': `${primaryColor}50`
                  }}
                >
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
                <Clock size={20} style={{ color: primaryColor }} />
                <span>Escolha o Horário</span>
              </h3>
              
              {availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, appointmentTime: time }))}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.appointmentTime === time
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-opacity-50'
                      }`}
                      style={{
                        backgroundColor: formData.appointmentTime === time ? primaryColor : undefined,
                        borderColor: formData.appointmentTime === time ? primaryColor : undefined
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Não há horários disponíveis para esta data.</p>
                  <p className="text-sm">Tente selecionar outra data.</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageSquare size={20} style={{ color: primaryColor }} />
              <span>Observações (Opcional)</span>
            </h3>
            
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ 
                focusRingColor: primaryColor,
                '--tw-ring-color': primaryColor 
              }}
              rows={3}
              placeholder="Alguma observação especial para o seu atendimento..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.clientName || !formData.clientEmail || !formData.clientPhone || !formData.appointmentDate || !formData.appointmentTime}
              className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TenantBookingModal
