import { useState, useEffect, createContext, useContext } from 'react'
import { lumi } from '../lib/lumi'

const SalonSettingsContext = createContext()

export const SalonSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        // Vamos assumir que só tens UMA configuração de salão
        const { list } = await lumi.entities.salon_settings.list({ limit: 1 })
        
        if (list && list.length > 0) {
          setSettings(list[0])
        } else {
          // Fallback se nada estiver configurado no admin
          setSettings({
            name: "Nail Art ByFran",
            address: "Rua Exemplo, 123, Cidade, País",
            phone: "929237136",
            email: "franciskov@gmail.com",
            workingHours: { /* ... */ }
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