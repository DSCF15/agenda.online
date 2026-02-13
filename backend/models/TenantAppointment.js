import mongoose from 'mongoose'

const tenantAppointmentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  
  // 👇 ADICIONADO: O Profissional
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantStaff', required: true },
  staffName: String, // Guardamos o nome para facilitar o email/frontend

  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantService', required: true },
  // ... (mantém o resto: serviceName, price, dates, client info, etc.)
  serviceName: String,
  servicePrice: Number,
  serviceDuration: Number,
  appointmentDate: String,
  appointmentTime: String,
  startDateTime: Date,
  endDateTime: Date,
  clientName: String,
  clientEmail: String,
  clientPhone: String,
  notes: String,
  confirmationToken: String,
  status: { 
    type: String, 
    enum: ['pending_email', 'scheduled', 'confirmed', 'cancelled', 'completed'],
    default: 'scheduled' 
  }
}, { timestamps: true })

export const TenantAppointment = mongoose.model('TenantAppointment', tenantAppointmentSchema)