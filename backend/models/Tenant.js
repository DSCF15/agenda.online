
import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema({
  subdomain: {
    type: String,
    required: [true, 'Subdomínio é obrigatório'],
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens']
  },
  businessName: {
    type: String,
    required: [true, 'Nome do negócio é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome do negócio deve ter no máximo 100 caracteres']
  },
  businessEmail: {
    type: String,
    required: [true, 'Email do negócio é obrigatório'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  businessPhone: {
      type: String,
      required: [true, 'Telefone é obrigatório'],
      // Removemos o 'match' complicado do Brasil
      // Aceitamos qualquer coisa com pelo menos 8 digitos
      minlength: [8, 'Telefone deve ter pelo menos 8 dígitos']
    },
  businessAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Brasil' }
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'expired'],
    default: 'trial'
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 dias
  },
  branding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#8B5CF6',
      match: [/^#[0-9A-F]{6}$/i, 'Cor primária deve ser um código hexadecimal válido']
    },
    secondaryColor: {
      type: String,
      default: '#EC4899',
      match: [/^#[0-9A-F]{6}$/i, 'Cor secundária deve ser um código hexadecimal válido']
    },
    customCSS: String
  },
  features: {
    maxServices: {
      type: Number,
      default: function() {
        switch(this.plan) {
          case 'basic': return 10
          case 'premium': return 50
          case 'enterprise': return 200
          default: return 5
        }
      }
    },
    maxAppointments: {
      type: Number,
      default: function() {
        switch(this.plan) {
          case 'basic': return 100
          case 'premium': return 500
          case 'enterprise': return 2000
          default: return 50
        }
      }
    },
    emailNotifications: {
      type: Boolean,
      default: function() {
        return this.plan !== 'basic'
      }
    },
    smsNotifications: {
      type: Boolean,
      default: function() {
        return this.plan === 'enterprise'
      }
    },
    customDomain: {
      type: Boolean,
      default: function() {
        return this.plan === 'enterprise'
      }
    },
    analytics: {
      type: Boolean,
      default: function() {
        return this.plan !== 'basic'
      }
    },
    multipleStaff: {
      type: Boolean,
      default: function() {
        return this.plan !== 'basic'
      }
    }
  },
  workingHours: {
    monday: { isOpen: Boolean, open: String, close: String },
    tuesday: { isOpen: Boolean, open: String, close: String },
    wednesday: { isOpen: Boolean, open: String, close: String },
    thursday: { isOpen: Boolean, open: String, close: String },
    friday: { isOpen: Boolean, open: String, close: String },
    saturday: { isOpen: Boolean, open: String, close: String },
    sunday: { isOpen: Boolean, open: String, close: String }
  },
  settings: {
    timezone: { type: String, default: 'America/Sao_Paulo' },
    language: { type: String, default: 'pt-BR' },
    currency: { type: String, default: 'BRL' },
    appointmentDuration: { type: Number, default: 60 }, // em minutos
    bufferTime: { type: Number, default: 15 }, // tempo entre agendamentos
    advanceBookingLimit: { type: Number, default: 30 }, // dias de antecedência
    cancellationPolicy: { type: String, default: '2 horas de antecedência' }
  }
}, {
  timestamps: true
})

// Índices
tenantSchema.index({ subdomain: 1 })
tenantSchema.index({ status: 1 })
tenantSchema.index({ plan: 1 })

// Métodos de instância
tenantSchema.methods.hasFeature = function(feature) {
  return this.features[feature] === true
}

tenantSchema.methods.isWithinLimit = function(resource, currentCount) {
  const limits = {
    services: this.features.maxServices,
    appointments: this.features.maxAppointments
  }
  
  return currentCount < limits[resource]
}

tenantSchema.methods.getDaysUntilTrialEnd = function() {
  if (this.status !== 'trial' || !this.trialEndsAt) return null
  
  const now = new Date()
  const trialEnd = new Date(this.trialEndsAt)
  const diffTime = trialEnd - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

// Middleware pre-save para atualizar features baseadas no plano
tenantSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    const planFeatures = {
      basic: {
        maxServices: 10,
        maxAppointments: 100,
        emailNotifications: false,
        smsNotifications: false,
        customDomain: false,
        analytics: false,
        multipleStaff: false
      },
      premium: {
        maxServices: 50,
        maxAppointments: 500,
        emailNotifications: true,
        smsNotifications: false,
        customDomain: false,
        analytics: true,
        multipleStaff: true
      },
      enterprise: {
        maxServices: 200,
        maxAppointments: 2000,
        emailNotifications: true,
        smsNotifications: true,
        customDomain: true,
        analytics: true,
        multipleStaff: true
      }
    }
    
    this.features = { ...this.features, ...planFeatures[this.plan] }
  }
  
  next()
})

export const Tenant = mongoose.model('Tenant', tenantSchema)
