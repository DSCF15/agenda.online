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
    type: String, // YYYY-MM-DD
    required: true
  },
  appointmentTime: {
    type: String, // HH:mm
    required: true
  },
  appointmentEndTime: String,
  
  clientName: {
    type: String,
    required: true
  },
  clientEmail: String,
  clientPhone: String,
  
  status: {
    type: String,
    default: 'scheduled' 
    // Aceita: 'scheduled', 'pending_email', 'confirmed', 'cancelled'
  },
  
  // 👇👇👇 CAMPO NOVO IMPORTANTE 👇👇👇
  confirmationToken: {
    type: String,
    index: true // Indexado para a busca ser rápida
  },
  
  notes: String
}, {
  timestamps: true
})

export const TenantAppointment = mongoose.model('TenantAppointment', tenantAppointmentSchema)