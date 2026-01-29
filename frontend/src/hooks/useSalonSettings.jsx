import { useState, useEffect, createContext, useContext } from 'react'

const SalonSettingsContext = createContext()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const SalonSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`${API_URL}/tenants/current`, {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant': 'bella-vista' // Identifica a barbearia
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Mapeia os dados do Backend para o formato que o Frontend espera
          const tenant = data.data
          setSettings({
            name: tenant.businessName,
            address: `${tenant.businessAddress.street}, ${tenant.businessAddress.city}`,
            phone: tenant.businessPhone,
            email: tenant.businessEmail,
            workingHours: tenant.workingHours,
            branding: tenant.branding,
            // Mantém o objeto completo caso precises de mais dados
            raw: tenant 
          })
        } else {
          // Fallback se der erro
          console.warn('Usando configurações fallback')
          setSettings({
            name: "Barbearia Demo",
            address: "Rua Exemplo, Porto",
            phone: "910000000",
            email: "demo@barbearia.com"
          })
        }
      } catch (err) {
        console.error('Erro ao buscar configurações do salão:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <SalonSettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SalonSettingsContext.Provider>
  )
}

export const useSalonSettings = () => {
  const context = useContext(SalonSettingsContext)
  if (!context) {
    throw new Error('useSalonSettings deve ser usado dentro de SalonSettingsProvider')
  }
  return context
}