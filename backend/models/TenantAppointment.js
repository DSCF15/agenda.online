
import mongoose from 'mongoose'

const tenantAppointmentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'ID do tenant é obrigatório'],
    index: true
  },
  clientName: {
    type: String,
    required: [true, 'Nome do cliente é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  clientEmail: {
    type: String,
    required: [true, 'Email do cliente é obrigatório'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido'],
    lowercase: true
  },
  clientPhone: {
    type: String,
    required: [true, 'Telefone do cliente é obrigatório'],
   minlength: [9, 'Telefone deve ter pelo menos 9 dígitos']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantService',
    required: [true, 'Serviço é obrigatório']
  },
  serviceName: {
    type: String,
    required: [true, 'Nome do serviço é obrigatório']
  },
  servicePrice: {
    type: Number,
    required: [true, 'Preço do serviço é obrigatório'],
    min: [0, 'Preço deve ser positivo']
  },
  serviceDuration: {
    type: Number,
    required: [true, 'Duração do serviço é obrigatória'],
    min: [15, 'Duração mínima é 15 minutos']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Data do agendamento é obrigatória'],
    validate: {
      validator: function(date) {
        return date > new Date()
      },
      message: 'Data do agendamento deve ser futura'
    }
  },
  appointmentTime: {
    type: String,
    required: [true, 'Horário do agendamento é obrigatório'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)']
  },
  appointmentEndTime: {
    type: String,
    required: [true, 'Horário de término é obrigatório']
  },
  status: {
    type: String,
    enum: ['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu'],
    default: 'agendado'
  },
  staffAssigned: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxLength: [500, 'Observações devem ter no máximo 500 caracteres']
  },
  internalNotes: {
    type: String,
    maxLength: [500, 'Notas internas devem ter no máximo 500 caracteres']
  },
  paymentStatus: {
    type: String,
    enum: ['pendente', 'pago', 'cancelado'],
    default: 'pendente'
  },
  paymentMethod: {
    type: String,
    enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia'],
    required: function() {
      return this.paymentStatus === 'pago'
    }
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    maxLength: [200, 'Motivo do cancelamento deve ter no máximo 200 caracteres']
  },
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['client', 'salon', 'system']
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'whatsapp', 'admin'],
    default: 'website'
  }
}, {
  timestamps: true
})

// Índices compostos para performance
tenantAppointmentSchema.index({ tenantId: 1, appointmentDate: 1 })
tenantAppointmentSchema.index({ tenantId: 1, status: 1 })
tenantAppointmentSchema.index({ tenantId: 1, clientEmail: 1 })
tenantAppointmentSchema.index({ tenantId: 1, appointmentDate: 1, appointmentTime: 1 })
tenantAppointmentSchema.index({ tenantId: 1, staffAssigned: 1, appointmentDate: 1 })

// Middleware pre-save para calcular horário de término
tenantAppointmentSchema.pre('save', function(next) {
  if (this.isModified('appointmentTime') || this.isModified('serviceDuration')) {
    const [hours, minutes] = this.appointmentTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + this.serviceDuration
    
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    
    this.appointmentEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }
  
  next()
})

// Métodos de instância
tenantAppointmentSchema.methods.canBeCancelled = function() {
  const now = new Date()
  const appointmentDateTime = new Date(this.appointmentDate)
  const [hours, minutes] = this.appointmentTime.split(':').map(Number)
  appointmentDateTime.setHours(hours, minutes, 0, 0)
  
  // Pode cancelar até 2 horas antes
  const cancelDeadline = new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000))
  
  return now < cancelDeadline && ['agendado', 'confirmado'].includes(this.status)
}

tenantAppointmentSchema.methods.getFormattedDateTime = function() {
  const date = new Date(this.appointmentDate)
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: this.appointmentTime,
    dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' })
  }
}

tenantAppointmentSchema.methods.cancel = function(reason, cancelledBy = 'client') {
  this.status = 'cancelado'
  this.cancellationReason = reason
  this.cancelledAt = new Date()
  this.cancelledBy = cancelledBy
  this.paymentStatus = 'cancelado'
  
  return this.save()
}

// Métodos estáticos
tenantAppointmentSchema.statics.getByTenant = function(tenantId, filters = {}) {
  return this.find({ tenantId, ...filters })
    .populate('serviceId', 'name category')
    .sort({ appointmentDate: -1, appointmentTime: -1 })
}

tenantAppointmentSchema.statics.getByDateRange = function(tenantId, startDate, endDate) {
  return this.find({
    tenantId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ appointmentDate: 1, appointmentTime: 1 })
}

tenantAppointmentSchema.statics.checkTimeConflict = function(tenantId, date, startTime, endTime, excludeId = null) {
  const query = {
    tenantId,
    appointmentDate: date,
    status: { $in: ['agendado', 'confirmado', 'em_andamento'] },
    $or: [
      // Novo agendamento começa durante um existente
      {
        appointmentTime: { $lte: startTime },
        appointmentEndTime: { $gt: startTime }
      },
      // Novo agendamento termina durante um existente
      {
        appointmentTime: { $lt: endTime },
        appointmentEndTime: { $gte: endTime }
      },
      // Novo agendamento engloba um existente
      {
        appointmentTime: { $gte: startTime },
        appointmentEndTime: { $lte: endTime }
      }
    ]
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  
  return this.findOne(query)
}

tenantAppointmentSchema.statics.getAvailableSlots = function(tenantId, date, serviceDuration, workingHours) {
  // DEBUG: Para veres no terminal se o dia está a ser bem calculado
  console.log('--- DEBUG ---')
  console.log('Data recebida:', date)
  console.log('Dia da semana (UTC):', date.getUTCDay())

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  // CORREÇÃO: Usar getUTCDay() para garantir o dia correto
  const dayOfWeek = days[date.getUTCDay()] 
  const dayConfig = workingHours[dayOfWeek]
  
  console.log('A verificar dia:', dayOfWeek)

  if (!dayConfig || !dayConfig.isOpen) {
    console.log('Fechado neste dia.')
    return []
  }
  
  // Lógica de busca mantém-se, mas garantimos as datas UTC
  return this.find({
    tenantId,
    appointmentDate: {
      $gte: new Date(date.setUTCHours(0,0,0,0)),
      $lt: new Date(date.setUTCHours(23,59,59,999))
    },
    status: { $in: ['agendado', 'confirmado', 'em_andamento'] }
  }).then(appointments => {
    const slots = []
    const openTime = dayConfig.open.split(':').map(Number)
    const closeTime = dayConfig.close.split(':').map(Number)
    
    let currentHour = openTime[0]
    let currentMinute = openTime[1]
    
    const closingTimeInMinutes = closeTime[0] * 60 + closeTime[1]
    
    while (true) {
      const currentTotalMinutes = currentHour * 60 + currentMinute
      if (currentTotalMinutes + serviceDuration > closingTimeInMinutes) break;

      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      
      const hasConflict = appointments.some(apt => timeString === apt.appointmentTime)
      
      if (!hasConflict) {
        slots.push(timeString)
      }
      
      // Incremento
      const slotDuration = Math.max(30, serviceDuration)
      currentMinute += slotDuration
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }
    return slots
  })
}

// Virtual para status formatado
tenantAppointmentSchema.virtual('statusFormatted').get(function() {
  const statusMap = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    nao_compareceu: 'Não Compareceu'
  }
  
  return statusMap[this.status] || this.status
})

// Configurar virtuals no JSON
tenantAppointmentSchema.set('toJSON', { virtuals: true })
tenantAppointmentSchema.set('toObject', { virtuals: true })

export const TenantAppointment = mongoose.model('TenantAppointment', tenantAppointmentSchema)
