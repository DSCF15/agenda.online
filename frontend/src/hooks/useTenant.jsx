
import { useState, useEffect, createContext, useContext } from 'react'
import { lumi } from '../lib/lumi'

const TenantContext = createContext()

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const detectTenant = async () => {
      try {
        // Detectar subdomínio da URL
        const hostname = window.location.hostname
        let subdomain = null
        
        if (hostname.includes('.')) {
          const parts = hostname.split('.')
          if (parts.length > 2) {
            subdomain = parts[0]
          }
        }
        
        // Para desenvolvimento local, usar parâmetro de query ou localStorage
        if (!subdomain || hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
          const urlParams = new URLSearchParams(window.location.search)
          subdomain = urlParams.get('tenant') || localStorage.getItem('dev-tenant') || 'bella-vista'
          
          if (urlParams.get('tenant')) {
            localStorage.setItem('dev-tenant', subdomain)
          }
        }

        if (subdomain) {
          // Buscar dados do tenant
          const { list } = await lumi.entities.tenants.list({
            where: { subdomain },
            limit: 1
          })

          if (list && list.length > 0) {
            const tenantData = list[0]
            
            // Verificar se o tenant está ativo
            if (tenantData.status === 'suspended' || tenantData.status === 'cancelled') {
              setError('Este salão está temporariamente indisponível.')
              return
            }

            // Verificar se o trial/subscription expirou
            const now = new Date()
            const expirationDate = new Date(tenantData.subscriptionEndsAt)
            
            if (now > expirationDate) {
              setError('A assinatura deste salão expirou.')
              return
            }

            setTenant(tenantData)
            
            // Aplicar branding personalizado
            applyTenantBranding(tenantData.branding)
          } else {
            setError('Salão não encontrado.')
          }
        } else {
          setError('Subdomínio não detectado.')
        }
      } catch (err) {
        console.error('Erro ao detectar tenant:', err)
        setError('Erro ao carregar dados do salão.')
      } finally {
        setLoading(false)
      }
    }

    detectTenant()
  }, [])

  const applyTenantBranding = (branding) => {
    if (!branding) return

    // Aplicar cores personalizadas
    const root = document.documentElement
    if (branding.primaryColor) {
      root.style.setProperty('--primary-color', branding.primaryColor)
    }
    if (branding.secondaryColor) {
      root.style.setProperty('--secondary-color', branding.secondaryColor)
    }

    // Aplicar CSS personalizado
    if (branding.customCSS) {
      const existingStyle = document.getElementById('tenant-custom-css')
      if (existingStyle) {
        existingStyle.remove()
      }

      const style = document.createElement('style')
      style.id = 'tenant-custom-css'
      style.textContent = branding.customCSS
      document.head.appendChild(style)
    }

    // Atualizar título da página
    if (branding.businessName) {
      document.title = branding.businessName
    }
  }

  const updateTenant = async (updates) => {
    if (!tenant) return

    try {
      const updatedTenant = await lumi.entities.tenants.update(tenant._id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      setTenant(updatedTenant)
      applyTenantBranding(updatedTenant.branding)
      return updatedTenant
    } catch (error) {
      console.error('Erro ao atualizar tenant:', error)
      throw error
    }
  }

  return (
    <TenantContext.Provider value={{
      tenant,
      loading,
      error,
      updateTenant,
      subdomain: tenant?.subdomain
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de TenantProvider')
  }
  return context
}
