
import { Tenant } from '../models/Tenant.js'

export const tenantDetectionMiddleware = async (req, res, next) => {
  try {
    let subdomain = null
    
    // Extrair subdomínio do hostname
    const hostname = req.get('host') || req.hostname
    
    // Para desenvolvimento local, verificar parâmetro tenant
    if (hostname === 'localhost:5000' || hostname === '127.0.0.1:5000') {
      subdomain = req.query.tenant || req.headers['x-tenant'] || 'bella-vista'
    } else {
      // Para produção, extrair subdomínio
      const parts = hostname.split('.')
      if (parts.length >= 3) {
        subdomain = parts[0]
      }
    }

    if (!subdomain) {
      return res.status(400).json({
        error: 'Tenant não identificado',
        message: 'Subdomínio necessário para acessar a aplicação'
      })
    }

    // Buscar dados do tenant
    const tenant = await Tenant.findOne({ 
      subdomain: subdomain,
      status: { $in: ['active', 'trial'] }
    })

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant não encontrado',
        message: 'Salão não encontrado ou inativo'
      })
    }

    // Verificar status do tenant
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Conta suspensa',
        message: 'Esta conta está suspensa. Entre em contato com o suporte.'
      })
    }

    if (tenant.status === 'expired') {
      return res.status(403).json({
        error: 'Conta expirada',
        message: 'Esta conta expirou. Renove sua assinatura para continuar.'
      })
    }

    // Verificar trial expirado
    if (tenant.status === 'trial' && tenant.trialEndsAt && new Date(tenant.trialEndsAt) < new Date()) {
      return res.status(403).json({
        error: 'Trial expirado',
        message: 'Período de teste expirado. Assine um plano para continuar.'
      })
    }

    // Adicionar tenant ao request
    req.tenant = tenant
    req.tenantId = tenant.subdomain

    next()
  } catch (error) {
    console.error('Erro no middleware de tenant:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Erro ao processar tenant'
    })
  }
}

// Middleware para verificar limites do plano
export const checkPlanLimits = (resource) => {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant
      
      if (!tenant) {
        return res.status(400).json({ error: 'Tenant não identificado' })
      }

      const limits = tenant.features
      let currentCount = 0

      switch (resource) {
        case 'services':
          const { TenantService } = await import('../models/TenantService.js')
          currentCount = await TenantService.countDocuments({ tenantId: tenant.subdomain })
          if (currentCount >= limits.maxServices) {
            return res.status(403).json({
              error: 'Limite atingido',
              message: `Limite de ${limits.maxServices} serviços atingido para seu plano`
            })
          }
          break

        case 'appointments':
          const { TenantAppointment } = await import('../models/TenantAppointment.js')
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          
          currentCount = await TenantAppointment.countDocuments({
            tenantId: tenant.subdomain,
            appointmentDate: {
              $gte: new Date(currentYear, currentMonth, 1),
              $lt: new Date(currentYear, currentMonth + 1, 1)
            }
          })
          
          if (currentCount >= limits.maxAppointments) {
            return res.status(403).json({
              error: 'Limite atingido',
              message: `Limite de ${limits.maxAppointments} agendamentos mensais atingido`
            })
          }
          break
      }

      next()
    } catch (error) {
      console.error('Erro ao verificar limites:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
}
