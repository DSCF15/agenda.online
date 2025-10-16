
import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { TenantService } from '../models/TenantService.js'
import { checkPlanLimits } from '../middleware/tenantDetection.js'

const router = express.Router()

// Middleware para validar erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }
  next()
}

// GET /api/services - Listar serviços
router.get('/', [
  query('category').optional().isIn([
    'corte_cabelo', 'coloracao', 'tratamento_capilar', 'manicure_pedicure',
    'sobrancelha', 'depilacao', 'limpeza_pele', 'massagem', 'maquiagem', 'outros'
  ]).withMessage('Categoria inválida'),
  query('active').optional().isBoolean().withMessage('Active deve ser boolean'),
  query('popular').optional().isBoolean().withMessage('Popular deve ser boolean'),
  query('search').optional().isLength({ min: 1 }).withMessage('Termo de busca deve ter pelo menos 1 caractere')
], handleValidationErrors, async (req, res) => {
  try {
    const tenantId = req.tenant.subdomain
    const { category, active = true, popular, search, page = 1, limit = 20 } = req.query
    
    let query = { tenantId, active: active === 'true' }
    
    if (category) query.category = category
    if (popular === 'true') query.isPopular = true
    
    if (search) {
      const regex = new RegExp(search, 'i')
      query.$or = [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } }
      ]
    }
    
    const services = await TenantService.find(query)
      .sort({ isPopular: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    const total = await TenantService.countDocuments(query)
    
    res.json({
      success: true,
      data: services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/services/categories - Listar categorias com contadores
router.get('/categories', async (req, res) => {
  try {
    const tenantId = req.tenant.subdomain
    
    const categories = await TenantService.aggregate([
      { $match: { tenantId, active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
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
    
    const formattedCategories = categories.map(cat => ({
      value: cat._id,
      label: categoryMap[cat._id] || cat._id,
      count: cat.count
    }))
    
    res.json({
      success: true,
      data: formattedCategories
    })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/services/:id - Buscar serviço por ID
router.get('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const service = await TenantService.findOne({
      _id: req.params.id,
      tenantId: req.tenant.subdomain
    })
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: service
    })
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// POST /api/services - Criar serviço
router.post('/', checkPlanLimits('services'), [
  body('name').notEmpty().isLength({ max: 100 }).withMessage('Nome é obrigatório e deve ter no máximo 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duração deve ser entre 15 e 480 minutos'),
  body('price').isFloat({ min: 0 }).withMessage('Preço deve ser positivo'),
  body('category').isIn([
    'corte_cabelo', 'coloracao', 'tratamento_capilar', 'manicure_pedicure',
    'sobrancelha', 'depilacao', 'limpeza_pele', 'massagem', 'maquiagem', 'outros'
  ]).withMessage('Categoria inválida'),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('staffRequired').optional().isArray().withMessage('Staff deve ser um array'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Tempo de preparação deve ser positivo'),
  body('cleanupTime').optional().isInt({ min: 0 }).withMessage('Tempo de limpeza deve ser positivo'),
  body('tags').optional().isArray().withMessage('Tags devem ser um array'),
  body('requirements').optional().isArray().withMessage('Requisitos devem ser um array'),
  body('restrictions').optional().isArray().withMessage('Restrições devem ser um array')
], handleValidationErrors, async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      tenantId: req.tenant.subdomain
    }
    
    const service = new TenantService(serviceData)
    await service.save()
    
    res.status(201).json({
      success: true,
      data: service,
      message: 'Serviço criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar serviço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/services/:id - Atualizar serviço
router.put('/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Nome deve ter entre 1 e 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duração deve ser entre 15 e 480 minutos'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Preço deve ser positivo'),
  body('category').optional().isIn([
    'corte_cabelo', 'coloracao', 'tratamento_capilar', 'manicure_pedicure',
    'sobrancelha', 'depilacao', 'limpeza_pele', 'massagem', 'maquiagem', 'outros'
  ]).withMessage('Categoria inválida'),
  body('imageUrl').optional().isURL().withMessage('URL da imagem inválida'),
  body('active').optional().isBoolean().withMessage('Active deve ser boolean'),
  body('isPopular').optional().isBoolean().withMessage('IsPopular deve ser boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const service = await TenantService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant.subdomain },
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: service,
      message: 'Serviço atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// DELETE /api/services/:id - Deletar serviço
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const service = await TenantService.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenant.subdomain
    })
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      })
    }
    
    res.json({
      success: true,
      message: 'Serviço removido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao remover serviço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/services/popular/list - Serviços populares
router.get('/popular/list', async (req, res) => {
  try {
    const { limit = 6 } = req.query
    
    const services = await TenantService.getPopular(req.tenant.subdomain, parseInt(limit))
    
    res.json({
      success: true,
      data: services
    })
  } catch (error) {
    console.error('Erro ao buscar serviços populares:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

export default router
