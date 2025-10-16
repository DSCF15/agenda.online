
import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { Tenant } from '../models/Tenant.js'
import { TenantService } from '../models/TenantService.js'
import { TenantAppointment } from '../models/TenantAppointment.js'

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

// GET /api/tenants/current - Obter dados do tenant atual
router.get('/current', async (req, res) => {
  try {
    const tenant = req.tenant
    
    // Estatísticas básicas
    const stats = await Promise.all([
      TenantService.countDocuments({ tenantId: tenant.subdomain, active: true }),
      TenantAppointment.countDocuments({ tenantId: tenant.subdomain }),
      TenantAppointment.countDocuments({ 
        tenantId: tenant.subdomain,
        appointmentDate: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ])

    res.json({
      success: true,
      data: {
        ...tenant.toJSON(),
        stats: {
          totalServices: stats[0],
          totalAppointments: stats[1],
          todayAppointments: stats[2],
          daysUntilTrialEnd: tenant.getDaysUntilTrialEnd()
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/tenants/current - Atualizar dados do tenant atual
router.put('/current', [
  body('businessName').optional().isLength({ min: 1, max: 100 }).withMessage('Nome deve ter entre 1 e 100 caracteres'),
  body('businessEmail').optional().isEmail().withMessage('Email inválido'),
  body('businessPhone').optional().matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).withMessage('Formato de telefone inválido'),
  body('businessAddress.street').optional().notEmpty().withMessage('Endereço é obrigatório'),
  body('businessAddress.city').optional().notEmpty().withMessage('Cidade é obrigatória'),
  body('businessAddress.state').optional().notEmpty().withMessage('Estado é obrigatório'),
  body('businessAddress.zipCode').optional().notEmpty().withMessage('CEP é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const tenant = req.tenant
    const updates = req.body
    
    // Atualizar apenas campos permitidos
    const allowedUpdates = [
      'businessName', 'businessEmail', 'businessPhone', 'businessAddress',
      'settings.timezone', 'settings.language', 'settings.currency',
      'settings.appointmentDuration', 'settings.bufferTime', 
      'settings.advanceBookingLimit', 'settings.cancellationPolicy'
    ]
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key.includes('.')) {
          const [parent, child] = key.split('.')
          if (!tenant[parent]) tenant[parent] = {}
          tenant[parent][child] = updates[key]
        } else {
          tenant[key] = updates[key]
        }
      }
    })
    
    await tenant.save()
    
    res.json({
      success: true,
      data: tenant,
      message: 'Configurações atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/tenants/branding - Atualizar branding
router.put('/branding', [
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Cor primária inválida'),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Cor secundária inválida'),
  body('logo').optional().isURL().withMessage('URL do logo inválida'),
  body('customCSS').optional().isLength({ max: 5000 }).withMessage('CSS customizado muito longo')
], handleValidationErrors, async (req, res) => {
  try {
    const tenant = req.tenant
    const { primaryColor, secondaryColor, logo, customCSS } = req.body
    
    if (primaryColor) tenant.branding.primaryColor = primaryColor
    if (secondaryColor) tenant.branding.secondaryColor = secondaryColor
    if (logo) tenant.branding.logo = logo
    if (customCSS !== undefined) tenant.branding.customCSS = customCSS
    
    await tenant.save()
    
    res.json({
      success: true,
      data: tenant.branding,
      message: 'Branding atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar branding:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/tenants/working-hours - Atualizar horários de funcionamento
router.put('/working-hours', [
  body('*.isOpen').optional().isBoolean().withMessage('isOpen deve ser boolean'),
  body('*.open').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de abertura inválido'),
  body('*.close').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de fechamento inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const tenant = req.tenant
    const workingHours = req.body
    
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    Object.keys(workingHours).forEach(day => {
      if (validDays.includes(day)) {
        if (!tenant.workingHours) tenant.workingHours = {}
        tenant.workingHours[day] = {
          ...tenant.workingHours[day],
          ...workingHours[day]
        }
      }
    })
    
    await tenant.save()
    
    res.json({
      success: true,
      data: tenant.workingHours,
      message: 'Horários atualizados com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar horários:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/tenants/dashboard-stats - Estatísticas do dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    const tenantId = req.tenant.subdomain
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    
    const [
      totalServices,
      totalAppointments,
      todayAppointments,
      thisMonthAppointments,
      pendingAppointments,
      completedAppointments,
      monthlyRevenue
    ] = await Promise.all([
      TenantService.countDocuments({ tenantId, active: true }),
      TenantAppointment.countDocuments({ tenantId }),
      TenantAppointment.countDocuments({
        tenantId,
        appointmentDate: { $gte: today, $lt: tomorrow }
      }),
      TenantAppointment.countDocuments({
        tenantId,
        appointmentDate: { $gte: thisMonth, $lt: nextMonth }
      }),
      TenantAppointment.countDocuments({
        tenantId,
        status: { $in: ['agendado', 'confirmado'] }
      }),
      TenantAppointment.countDocuments({
        tenantId,
        status: 'concluido'
      }),
      TenantAppointment.aggregate([
        {
          $match: {
            tenantId,
            status: 'concluido',
            paymentStatus: 'pago',
            appointmentDate: { $gte: thisMonth, $lt: nextMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$servicePrice' }
          }
        }
      ])
    ])
    
    res.json({
      success: true,
      data: {
        totalServices,
        totalAppointments,
        todayAppointments,
        thisMonthAppointments,
        pendingAppointments,
        completedAppointments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        planLimits: {
          maxServices: req.tenant.features.maxServices,
          maxAppointments: req.tenant.features.maxAppointments,
          servicesUsed: totalServices,
          appointmentsUsed: thisMonthAppointments
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

export default router
