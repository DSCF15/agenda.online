
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import { useTenant } from './useTenant'

export const useTenantServices = () => {
  const { tenant } = useTenant()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tenant) {
      fetchTenantServices()
    }
  }, [tenant])

  const fetchTenantServices = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.tenant_services.list({
        where: { 
          tenantId: tenant._id,
          active: true 
        },
        orderBy: { createdAt: 'desc' }
      })
      setServices(list || [])
    } catch (err) {
      console.error('Erro ao buscar serviços do tenant:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (serviceData) => {
    try {
      const newService = await lumi.entities.tenant_services.create({
        ...serviceData,
        tenantId: tenant._id,
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
      const updatedService = await lumi.entities.tenant_services.update(serviceId, {
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
      await lumi.entities.tenant_services.delete(serviceId)
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
    refetch: fetchTenantServices
  }
}
