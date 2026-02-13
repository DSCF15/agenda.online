import { useState, useCallback } from 'react'

export const useStaff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStaff = useCallback(async (tenantId) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/staff`, {
        headers: { 'x-tenant': tenantId }
      })
      const data = await response.json()
      if (data.success) {
        setStaff(data.data)
      } else {
        console.error('Erro ao carregar staff:', data.error)
      }
    } catch (error) {
      console.error('Erro fetch staff:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { staff, loading, fetchStaff }
}