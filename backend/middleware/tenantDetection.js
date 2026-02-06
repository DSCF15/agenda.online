import { Tenant } from '../models/Tenant.js'

export const tenantDetectionMiddleware = async (req, res, next) => {
  try {
    let subdomain = null
    
    // 1. Extrair Hostname (sem porta se possível, mas req.get('host') inclui porta)
    const hostHeader = req.get('host') // ex: localhost:5000 ou cliente.meusaas.com
    const hostname = req.hostname      // ex: localhost ou cliente.meusaas.com (Express trata disto)

    // 2. Deteção Inteligente (Local vs Produção)
    // Verifica se é localhost ou IP local (127.0.0.1) independentemente da porta
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

    if (isLocal) {
      // Prioridade: Query String > Header > Default
      subdomain = req.query.tenant || req.headers['x-tenant'] || 'bella-vista'
      console.log(`🔧 [DEV] Modo Local detetado. Tenant: ${subdomain}`)
    } else {
      // Produção: Pega a primeira parte do domínio
      const parts = hostname.split('.')
      // Ex: barbeariajc.app.com -> parts[0] = barbeariajc
      if (parts.length >= 2) { 
        subdomain = parts[0]
      }
    }

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Tenant Missing',
        message: 'Não foi possível identificar a loja.'
      })
    }

    // 3. Buscar dados (CORREÇÃO AQUI)
    // Buscamos o tenant INDEPENDENTE do status para poder dar o erro correto
    const tenant = await Tenant.findOne({ subdomain: subdomain })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant Not Found',
        message: 'Esta loja não existe ou o endereço está incorreto.'
      })
    }

    // 4. Verificações de Status e Segurança
    
    // Conta Suspensa
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account Suspended',
        message: 'Esta conta foi suspensa. Por favor contacte o suporte.'
      })
    }

    // Conta Expirada (Inativa)
    if (tenant.status === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'Subscription Expired',
        message: 'A subscrição expirou. Renove para continuar a aceder.'
      })
    }

    // Trial Expirado
    // Verifica se está em trial E se a data já passou
    if (tenant.status === 'trial' && tenant.trialEndsAt && new Date() > new Date(tenant.trialEndsAt)) {
      // Opcional: Podes atualizar automaticamente para 'expired' aqui se quiseres
      return res.status(403).json({
        success: false,
        error: 'Trial Ended',
        message: 'O período de teste terminou. Escolha um plano para continuar.'
      })
    }

    // Se passou tudo, injeta no request
    req.tenant = tenant
    req.tenantId = tenant.subdomain // Mantemos consistência com o teu Service Route
    
    next()

  } catch (error) {
    console.error('🔥 Erro Crítico no Middleware de Tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro ao processar o acesso à loja.'
    })
  }
}

// =========================================================
// MIDDLEWARE DE LIMITES (RATE LIMIT / PLAN LIMIT)
// =========================================================
export const checkPlanLimits = (resource) => {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant
      
      // Defesa extra caso o middleware anterior falhe
      if (!tenant) {
        return res.status(500).json({ success: false, error: 'Tenant context missing' })
      }

      // Se for admin ou plano ilimitado, passa direto (Opcional)
      if (tenant.plan === 'unlimited') return next()

      const limits = tenant.features || {} 
      let currentCount = 0

      switch (resource) {
        case 'services':
          // Import dinâmico é ok aqui para evitar dependências circulares
          const { TenantService } = await import('../models/TenantService.js')
          currentCount = await TenantService.countDocuments({ tenantId: tenant.subdomain })
          
          if (limits.maxServices && currentCount >= limits.maxServices) {
            return res.status(403).json({
              success: false,
              error: 'Limit Reached',
              message: `Atingiu o limite de ${limits.maxServices} serviços do seu plano.`
            })
          }
          break

        case 'appointments':
          const { TenantAppointment } = await import('../models/TenantAppointment.js')
          
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          
          currentCount = await TenantAppointment.countDocuments({
            tenantId: tenant.subdomain,
            appointmentDate: {
              $gte: startOfMonth,
              $lt: startOfNextMonth
            }
          })
          
          if (limits.maxAppointments && currentCount >= limits.maxAppointments) {
            return res.status(403).json({
              success: false,
              error: 'Limit Reached',
              message: `Atingiu o limite de ${limits.maxAppointments} agendamentos este mês.`
            })
          }
          break
      }

      next()
    } catch (error) {
      console.error('Erro ao verificar limites:', error)
      res.status(500).json({ success: false, error: 'Erro ao validar limites do plano.' })
    }
  }
}