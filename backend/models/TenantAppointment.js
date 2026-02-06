import mongoose from 'mongoose'

const tenantAppointmentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
  },
  
  // =========================================================
  // DADOS DO SERVIÇO (SNAPSHOT)
  // =========================================================
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TenantService',
    required: true
  },
  // Guardamos estes dados aqui para histórico. 
  // Se o preço do serviço mudar no futuro, este agendamento mantém o preço antigo.
  serviceName: { type: String, required: true },
  servicePrice: { type: Number, required: true },
  serviceDuration: { type: Number, required: true }, // em minutos
  
  // =========================================================
  // TEMPO E DATA (O CORAÇÃO DO SISTEMA)
  // =========================================================
  // Strings para facilitar a leitura no Frontend/JSON
  appointmentDate: { type: String, required: true }, // "2023-10-25"
  appointmentTime: { type: String, required: true }, // "14:30"
  
  // ⚠️ CRÍTICO: Objetos Date reais para cálculos de conflito no Backend
  startDateTime: { 
    type: Date, 
    required: true,
    index: true 
  }, 
  endDateTime: { 
    type: Date, 
    required: true,
    index: true 
  },

  // =========================================================
  // DADOS DO CLIENTE
  // =========================================================
  clientName: { type: String, required: true },
  clientEmail: { type: String, trim: true, lowercase: true },
  clientPhone: { type: String, trim: true },
  
  // =========================================================
  // ESTADO E CONTROLO
  // =========================================================
  status: {
    type: String,
    enum: ['scheduled', 'pending_email', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'scheduled'
  },
  
  confirmationToken: {
    type: String,
    unique: true, // Garante que não há tokens duplicados
    sparse: true  // Permite que documentos sem token existam sem dar erro
  },
  
  notes: String
}, {
  timestamps: true
})

// =========================================================
// ÍNDICES DE PERFORMANCE
// =========================================================
// 1. Busca rápida de agenda por Tenant + Dia (ex: Dashboard do dia)
tenantAppointmentSchema.index({ tenantId: 1, appointmentDate: 1 })

// 2. Busca de conflitos (Tenant + Range de Data)
tenantAppointmentSchema.index({ tenantId: 1, startDateTime: 1, endDateTime: 1 })

// 3. Busca por Token (para confirmar email)
tenantAppointmentSchema.index({ confirmationToken: 1 })

export const TenantAppointment = mongoose.model('TenantAppointment', tenantAppointmentSchema)