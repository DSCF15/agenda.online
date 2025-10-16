
import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { TenantService } from '../models/TenantService.js'
import { checkPlanLimits } from '../middleware/tenantDetection.js'
import { sendEmail } from '../utils/emailService.js'

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

// GET /api/appointments - Listar agendamentos
router.get('/', [
  query('status').optional().isIn(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu']).withMessage('Status inválido'),
  query('date').optional().isISO8601().withMessage('Data inválida'),
  query('startDate').optional().isISO8601().withMessage('Data inicial inválida'),
  query('endDate').optional().isISO8601().withMessage('Data final inválida'),
  query('clientEmail').optional().isEmail().withMessage('Email inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100')
], handleValidationErrors, async (req, res) => {
  try {
    const tenantId = req.tenant.subdomain
    const { 
      status, 
      date, 
      startDate, 
      endDate, 
      clientEmail, 
      page = 1, 
      limit = 20 
    } = req.query
    
    let query = { tenantId }
    
    if (status) query.status = status
    if (clientEmail) query.clientEmail = clientEmail.toLowerCase()
    
    if (date) {
      const targetDate = new Date(date)
      query.appointmentDate = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      }
    } else if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const appointments = await TenantAppointment.find(query)
      .populate('serviceId', 'name category duration')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    const total = await TenantAppointment.countDocuments(query)
    
    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/appointments/available-slots - Horários disponíveis
router.get('/available-slots', [
  query('date').notEmpty().isISO8601().withMessage('Data é obrigatória e deve ser válida'),
  query('serviceId').notEmpty().isMongoId().withMessage('ID do serviço é obrigatório e deve ser válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { date, serviceId } = req.query
    const tenantId = req.tenant.subdomain
    
    // Buscar serviço
    const service = await TenantService.findOne({
      _id: serviceId,
      tenantId,
      active: true
    })
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      })
    }
    
    const appointmentDate = new Date(date)
    const slots = await TenantAppointment.getAvailableSlots(
      tenantId, 
      appointmentDate, 
      service.duration,
      req.tenant.workingHours
    )
    
    res.json({
      success: true,
      data: {
        date,
        service: {
          id: service._id,
          name: service.name,
          duration: service.duration
        },
        availableSlots: slots
      }
    })
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// POST /api/appointments - Criar agendamento
router.post('/', checkPlanLimits('appointments'), [
  body('clientName').notEmpty().isLength({ max: 100 }).withMessage('Nome do cliente é obrigatório e deve ter no máximo 100 caracteres'),
  body('clientEmail').isEmail().normalizeEmail().withMessage('Email válido é obrigatório'),
  body('clientPhone').matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).withMessage('Formato de telefone inválido'),
  body('serviceId').isMongoId().withMessage('ID do serviço inválido'),
  body('appointmentDate').isISO8601().withMessage('Data do agendamento inválida'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário inválido'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Observações devem ter no máximo 500 caracteres')
], handleValidationErrors, async (req, res) => {
  try {
    const tenantId = req.tenant.subdomain
    const { serviceId, appointmentDate, appointmentTime } = req.body
    
    // Verificar se o serviço existe
    const service = await TenantService.findOne({
      _id: serviceId,
      tenantId,
      active: true
    })
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      })
    }
    
    // Verificar se a data é futura
    const appointmentDateTime = new Date(appointmentDate)
    const [hours, minutes] = appointmentTime.split(':').map(Number)
    appointmentDateTime.setHours(hours, minutes, 0, 0)
    
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Data e horário devem ser futuros'
      })
    }
    
    // Calcular horário de término
    const endMinutes = hours * 60 + minutes + service.duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const appointmentEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    
    // Verificar conflitos
    const conflict = await TenantAppointment.checkTimeConflict(
      tenantId,
      new Date(appointmentDate),
      appointmentTime,
      appointmentEndTime
    )
    
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'Horário não disponível',
        message: 'Já existe um agendamento neste horário'
      })
    }
    
    // Criar agendamento
    const appointmentData = {
      ...req.body,
      tenantId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
      appointmentEndTime,
      source: 'website'
    }
    
    const appointment = new TenantAppointment(appointmentData)
    await appointment.save()
    
    // Enviar email de confirmação se habilitado
    if (req.tenant.features.emailNotifications) {
      try {
        await sendConfirmationEmail(appointment, req.tenant)
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError)
        // Não falha o agendamento se o email não for enviado
      }
    }
    
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Agendamento criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// GET /api/appointments/:id - Buscar agendamento por ID
router.get('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const appointment = await TenantAppointment.findOne({
      _id: req.params.id,
      tenantId: req.tenant.subdomain
    }).populate('serviceId', 'name category duration')
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: appointment
    })
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/appointments/:id - Atualizar agendamento
router.put('/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  body('status').optional().isIn(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu']).withMessage('Status inválido'),
  body('staffAssigned').optional().isLength({ max: 100 }).withMessage('Staff deve ter no máximo 100 caracteres'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Observações devem ter no máximo 500 caracteres'),
  body('internalNotes').optional().isLength({ max: 500 }).withMessage('Notas internas devem ter no máximo 500 caracteres'),
  body('paymentStatus').optional().isIn(['pendente', 'pago', 'cancelado']).withMessage('Status de pagamento inválido'),
  body('paymentMethod').optional().isIn(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia']).withMessage('Método de pagamento inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const appointment = await TenantAppointment.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant.subdomain },
      req.body,
      { new: true, runValidators: true }
    ).populate('serviceId', 'name category duration')
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: appointment,
      message: 'Agendamento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// PUT /api/appointments/:id/cancel - Cancelar agendamento
router.put('/:id/cancel', [
  param('id').isMongoId().withMessage('ID inválido'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Motivo deve ter no máximo 200 caracteres'),
  body('cancelledBy').optional().isIn(['client', 'salon', 'system']).withMessage('Cancelado por inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const appointment = await TenantAppointment.findOne({
      _id: req.params.id,
      tenantId: req.tenant.subdomain
    })
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      })
    }
    
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        error: 'Agendamento não pode ser cancelado',
        message: 'Só é possível cancelar até 2 horas antes do horário agendado'
      })
    }
    
    await appointment.cancel(
      req.body.reason || 'Cancelado pelo cliente',
      req.body.cancelledBy || 'client'
    )
    
    res.json({
      success: true,
      data: appointment,
      message: 'Agendamento cancelado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// Função auxiliar para enviar email de confirmação
async function sendConfirmationEmail(appointment, tenant) {
  const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, ${tenant.branding.primaryColor || '#8B5CF6'} 0%, ${tenant.branding.secondaryColor || '#EC4899'} 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${tenant.businessName}</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: ${tenant.branding.primaryColor || '#8B5CF6'};">Confirmação de Agendamento</h2>
        
        <p>Olá <strong>${appointment.clientName}</strong>,</p>
        
        <p>Seu agendamento foi confirmado com sucesso!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: ${tenant.branding.primaryColor || '#8B5CF6'};">Detalhes do Agendamento</h3>
          <p><strong>Serviço:</strong> ${appointment.serviceName}</p>
          <p><strong>Data:</strong> ${appointmentDate}</p>
          <p><strong>Horário:</strong> ${appointment.appointmentTime}</p>
          <p><strong>Valor:</strong> R$ ${appointment.servicePrice.toFixed(2)}</p>
          ${appointment.staffAssigned ? `<p><strong>Profissional:</strong> ${appointment.staffAssigned}</p>` : ''}
          ${appointment.notes ? `<p><strong>Observações:</strong> ${appointment.notes}</p>` : ''}
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0066cc;">Informações do Salão</h4>
          <p><strong>${tenant.businessName}</strong></p>
          <p>📍 ${tenant.businessAddress?.street}, ${tenant.businessAddress?.city} - ${tenant.businessAddress?.state}</p>
          <p>📞 ${tenant.businessPhone}</p>
          <p>✉️ ${tenant.businessEmail}</p>
        </div>
        
        <p style="color: #666;">Por favor, chegue com 10 minutos de antecedência.</p>
        <p style="color: #666;">Em caso de cancelamento, entre em contato conosco com pelo menos 2 horas de antecedência.</p>
        
        <p>Aguardamos você!</p>
        <p><strong>Equipe ${tenant.businessName}</strong></p>
      </div>
    </div>
  `
  
  await sendEmail({
    to: appointment.clientEmail,
    subject: `Confirmação de Agendamento - ${tenant.businessName}`,
    html: emailContent,
    from: tenant.businessEmail,
    fromName: tenant.businessName
  })
}

export default router
