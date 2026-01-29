import mongoose from 'mongoose'

const tenantAppointmentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantService',
    required: true
  },
  serviceName: String,
  servicePrice: Number,
  serviceDuration: Number,
  
  appointmentDate: {
    type: String, // Formato YYYY-MM-DD
    required: true
  },
  appointmentTime: {
    type: String, // Formato HH:mm
    required: true
  },
  appointmentEndTime: {
    type: String, // Tornámos opcional para evitar erros de validação
    required: false 
  },
  
  clientName: {
    type: String,
    required: true
  },
  clientEmail: String,
  clientPhone: String,
  
  status: {
    type: String,
    default: 'scheduled' 
    // REMOVEMOS O 'enum' PARA ACEITAR QUALQUER COISA ('pendente', 'confirmado', etc.)
  },
  
  notes: String
}, {
  timestamps: true
})

export const TenantAppointment = mongoose.model('TenantAppointment', tenantAppointmentSchema)