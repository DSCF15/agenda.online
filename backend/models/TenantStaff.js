import mongoose from 'mongoose'

const tenantStaffSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true }, // Pertence à loja X
  name: { type: String, required: true },
  active: { type: Boolean, default: true },
  
  // Lista de IDs dos serviços que este barbeiro realiza
  // Se estiver vazio, assume-se que faz todos.
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TenantService' }]
}, { timestamps: true })

export const TenantStaff = mongoose.model('TenantStaff', tenantStaffSchema)