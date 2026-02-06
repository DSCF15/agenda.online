import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Função para carregar serviços (aceita tenantId opcional)
  const fetchServices = useCallback(async (tenantId = 'barbeariajc') => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/services', {
        headers: {
          'x-tenant': tenantId // Envia o ID da loja no header
        }
      })
      const data = await response.json()
      if (data.success) {
        setServices(data.data)
        console.log(`✅ Serviços carregados para ${tenantId}:`, data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Erro services:', err)
      setError(err.message)
      // toast.error('Erro ao carregar serviços') // Opcional
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregamento inicial automático
  useEffect(() => {
    // Não chamamos aqui para evitar chamadas duplas se a Home já o fizer
    // Mas para segurança, se ninguém chamar, podemos deixar um default
    // fetchServices() 
  }, [])

  // CRUD Operations (Mantém as que já tinhas)
  const createService = async (serviceData) => { /* ...teu código se tiveres... */ }
  const deleteService = async (id) => { /* ...teu código se tiveres... */ }
  const updateService = async (id, data) => { /* ...teu código se tiveres... */ }

  // 👇👇👇 AQUI ESTAVA O ERRO: FALTAVA "fetchServices" NESTA LISTA 👇👇👇
  return { 
    services, 
    loading, 
    error, 
    fetchServices, // <--- ISTO É OBRIGATÓRIO ESTAR AQUI
    createService, 
    deleteService, 
    updateService 
  }
}