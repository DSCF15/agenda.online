
import mongoose from 'mongoose'

const tenantServiceSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'ID do tenant é obrigatório'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Nome do serviço é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome do serviço deve ter no máximo 100 caracteres']
  },
  description: {
    type: String,
    maxLength: [500, 'Descrição deve ter no máximo 500 caracteres']
  },
  duration: {
    type: Number,
    required: [true, 'Duração é obrigatória'],
    min: [15, 'Duração mínima é 15 minutos'],
    max: [480, 'Duração máxima é 8 horas']
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço deve ser positivo']
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: [
      'corte_cabelo',
      'coloracao',
      'tratamento_capilar',
      'manicure_pedicure',
      'sobrancelha',
      'depilacao',
      'limpeza_pele',
      'massagem',
      'maquiagem',
      'outros'
    ]
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v)
      },
      message: 'URL da imagem inválida'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  staffRequired: [{
    type: String,
    trim: true
  }],
  preparationTime: {
    type: Number,
    default: 0,
    min: [0, 'Tempo de preparação deve ser positivo']
  },
  cleanupTime: {
    type: Number,
    default: 0,
    min: [0, 'Tempo de limpeza deve ser positivo']
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  restrictions: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
})

// Índices compostos para performance
tenantServiceSchema.index({ tenantId: 1, active: 1 })
tenantServiceSchema.index({ tenantId: 1, category: 1 })
tenantServiceSchema.index({ tenantId: 1, isPopular: -1 })
tenantServiceSchema.index({ tenantId: 1, price: 1 })

// Métodos de instância
tenantServiceSchema.methods.getTotalDuration = function() {
  return this.preparationTime + this.duration + this.cleanupTime
}

tenantServiceSchema.methods.getFormattedPrice = function(currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(this.price)
}

// Métodos estáticos
tenantServiceSchema.statics.getByTenant = function(tenantId, filters = {}) {
  return this.find({ tenantId, active: true, ...filters })
    .sort({ isPopular: -1, createdAt: -1 })
}

tenantServiceSchema.statics.getByCategory = function(tenantId, category) {
  return this.find({ tenantId, category, active: true })
    .sort({ isPopular: -1, price: 1 })
}

tenantServiceSchema.statics.getPopular = function(tenantId, limit = 6) {
  return this.find({ tenantId, active: true, isPopular: true })
    .sort({ createdAt: -1 })
    .limit(limit)
}

tenantServiceSchema.statics.searchServices = function(tenantId, searchTerm) {
  const regex = new RegExp(searchTerm, 'i')
  return this.find({
    tenantId,
    active: true,
    $or: [
      { name: regex },
      { description: regex },
      { tags: { $in: [regex] } }
    ]
  }).sort({ isPopular: -1, createdAt: -1 })
}

// Middleware pre-save
tenantServiceSchema.pre('save', function(next) {
  // Garantir que tags sejam sempre lowercase
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase())
  }
  
  next()
})

// Virtual para categoria formatada
tenantServiceSchema.virtual('categoryFormatted').get(function() {
  const categoryMap = {
    corte_cabelo: 'Corte de Cabelo',
    coloracao: 'Coloração',
    tratamento_capilar: 'Tratamento Capilar',
    manicure_pedicure: 'Manicure & Pedicure',
    sobrancelha: 'Sobrancelha',
    depilacao: 'Depilação',
    limpeza_pele: 'Limpeza de Pele',
    massagem: 'Massagem',
    maquiagem: 'Maquiagem',
    outros: 'Outros'
  }
  
  return categoryMap[this.category] || this.category
})

// Configurar virtuals no JSON
tenantServiceSchema.set('toJSON', { virtuals: true })
tenantServiceSchema.set('toObject', { virtuals: true })

export const TenantService = mongoose.model('TenantService', tenantServiceSchema)
