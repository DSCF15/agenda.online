import { Tenant } from '../models/Tenant.js'

export const tenantDetectionMiddleware = async (req, res, next) => {
  try {
    let subdomain = null
    
    // 1. Extrair Hostname
    const hostHeader = req.get('host') 
    const hostname = req.hostname      

    // 2. Deteção Inteligente (Local vs Produção)
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

    if (isLocal) {
      // Prioridade: Query String > Header > Default
      subdomain = req.query.tenant || req.headers['x-tenant'] || 'bella-vista'
      console.log(`🔧 [DEV] Modo Local detetado. Tenant: ${subdomain}`)
    } else {
      // Produção: Pega a primeira parte do domínio
      const parts = hostname.split('.')
      if (parts.length >= 2) { 
        subdomain = parts[0]
      }
    }

    // Fallback de segurança: se falhar o hostname, tenta ir buscar ao cabeçalho na mesma
    if (!subdomain) {
      subdomain = req.headers['x-tenant'] || req.query.tenant
    }

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Tenant Missing',
        message: 'Não foi possível identificar a loja.'
      })
    }

    // 3. Buscar dados da loja
    const tenant = await Tenant.findOne({ subdomain: subdomain })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant Not Found',
        message: 'Esta loja não existe ou o endereço está incorreto.'
      })
    }

    // ⛔ VERIFICAÇÕES DE TRIAL E LIMITES FORAM REMOVIDAS DAQUI! ⛔
    // Como o sistema é teu, todas as lojas estão sempre ativas e aprovadas.

    // 4. Injetar no request e deixar passar
    req.tenant = tenant
    req.tenantId = tenant.subdomain 
    
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
    // ⛔ TODOS OS LIMITES FORAM DESATIVADOS ⛔
    // Podes ter infinitos serviços e infinitos agendamentos. Deixa passar tudo.
    next()
  }
}