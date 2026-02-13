import express from 'express'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { tenantDetectionMiddleware } from '../middleware/tenantDetection.js'
// 👇 Apenas UMA linha de importação para as datas:
import { startOfWeek, startOfMonth, endOfDay } from 'date-fns'

const router = express.Router()
router.use(tenantDetectionMiddleware)

router.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.tenantId
    const now = new Date()
    
    // Datas de corte
    const todayStr = now.toISOString().split('T')[0]
    const startWeek = startOfWeek(now, { weekStartsOn: 1 }) // Segunda-feira
    const startMonth = startOfMonth(now)

    // 1. Buscar todos os agendamentos confirmados/concluídos
    const allAppointments = await TenantAppointment.find({
      tenantId,
      status: { $in: ['confirmed', 'completed'] }
    })

    // --- CÁLCULOS ---

    // 1. Hoje
    const todayApts = allAppointments.filter(a => a.appointmentDate === todayStr)
    const todayRevenue = todayApts.reduce((sum, a) => sum + (a.servicePrice || 0), 0)

    // 2. Esta Semana
    const weekApts = allAppointments.filter(a => new Date(a.startDateTime) >= startWeek)
    const weekRevenue = weekApts.reduce((sum, a) => sum + (a.servicePrice || 0), 0)

    // 3. Este Mês
    const monthApts = allAppointments.filter(a => new Date(a.startDateTime) >= startMonth)
    const monthRevenue = monthApts.reduce((sum, a) => sum + (a.servicePrice || 0), 0)

    // 4. Top Serviços (Geral)
    const serviceCounts = {}
    allAppointments.forEach(a => {
      // Usa o nome do serviço ou "Outros" se não tiver nome
      const name = a.serviceName || 'Outros'
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })
    
    // Ordenar Top 5 Serviços
    const topServices = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    res.json({
      success: true,
      data: {
        today: { count: todayApts.length, revenue: todayRevenue },
        week: { count: weekApts.length, revenue: weekRevenue },
        month: { count: monthApts.length, revenue: monthRevenue },
        topServices
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router