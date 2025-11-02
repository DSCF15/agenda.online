
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.services.list({
        where: { active: true },
        orderBy: { createdAt: 'desc' }
      })
      setServices(list || [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (serviceData) => {
    try {
      const newService = await lumi.entities.services.create({
        ...serviceData,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setServices(prev => [newService, ...prev])
      return newService
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      throw error
    }
  }

  const updateService = async (serviceId, updates) => {
    try {
      const updatedService = await lumi.entities.services.update(serviceId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setServices(prev => prev.map(service => 
        service._id === serviceId ? updatedService : service
      ))
      return updatedService
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error)
      throw error
    }
  }

  const deleteService = async (serviceId) => {
    try {
      await lumi.entities.services.delete(serviceId)
      setServices(prev => prev.filter(service => service._id !== serviceId))
    } catch (error) {
      console.error('Erro ao deletar serviço:', error)
      throw error
    }
  }

  const getServicesByCategory = (category) => {
    if (category === 'all') return services
    return services.filter(service => service.category === category)
  }

  const getCategories = () => {
    const categories = [...new Set(services.map(service => service.category))]
    return [
      { value: 'all', label: 'Todos os Serviços' },
      ...categories.map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1)
      }))
    ]
  }

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    getServicesByCategory,
    getCategories,
    refetch: fetchServices
  }
}
