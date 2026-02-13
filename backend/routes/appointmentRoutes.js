import express from 'express'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { TenantService } from '../models/TenantService.js'
import { TenantStaff } from '../models/TenantStaff.js' // 👈 Importar Staff
import { tenantDetectionMiddleware, checkPlanLimits } from '../middleware/tenantDetection.js'
import { v4 as uuidv4 } from 'uuid' 
import { sendConfirmationEmail } from '../utils/emailService.js'

const router = express.Router()

// CONFIRMAÇÃO (PÚBLICA) - Mantém-se igual
router.post('/confirm', async (req, res) => {
  /* ... (Copia o código da confirmação que já tinhas, mantém-se igual) ... */
   try {
    const { token } = req.body
    const appointment = await TenantAppointment.findOne({ confirmationToken: token })
    if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado.' })

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    if (new Date(appointment.createdAt) < tenMinutesAgo && appointment.status !== 'confirmed') {
      appointment.status = 'cancelled'
      await appointment.save()
      return res.status(400).json({ success: false, message: 'Expirou.' })
    }
    
    appointment.status = 'confirmed'
    await appointment.save()
    res.json({ success: true, data: appointment })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.use(tenantDetectionMiddleware)

// 1. CRIAR AGENDAMENTO (AGORA COM STAFF)
router.post('/', checkPlanLimits('appointments'), async (req, res) => {
  try {
    // 👇 Recebemos staffId agora
    const { serviceId, staffId, appointmentDate, appointmentTime, clientName, clientEmail, clientPhone, notes } = req.body
    const tenantId = req.tenantId

    // Validar Serviço
    const service = await TenantService.findOne({ _id: serviceId, tenantId })
    if (!service) return res.status(404).json({ success: false, message: 'Serviço não encontrado.' })

    // Validar Barbeiro
    const staff = await TenantStaff.findOne({ _id: staffId, tenantId })
    if (!staff) return res.status(404).json({ success: false, message: 'Barbeiro não encontrado.' })

    // Calcular Datas
    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000)
    if (isNaN(startDateTime.getTime())) return res.status(400).json({ success: false, message: 'Data inválida.' })

    // 🛡️ VERIFICAR CONFLITOS (POR BARBEIRO)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    
    const hasConflict = await TenantAppointment.findOne({
      tenantId,
      staffId: staffId, // 👈 SÓ VERIFICA A AGENDA DESTE BARBEIRO
      status: { $ne: 'cancelled' },
      startDateTime: { $lt: endDateTime },
      endDateTime: { $gt: startDateTime },
      $or: [
        { status: 'confirmed' },
        { status: 'scheduled' },
        { status: 'pending_email', createdAt: { $gt: tenMinutesAgo } }
      ]
    })

    if (hasConflict) return res.status(409).json({ success: false, message: 'Este barbeiro já está ocupado a essa hora.' })

    // Criar
    const newAppointment = await TenantAppointment.create({
      tenantId,
      staffId: staff._id,      // 👈
      staffName: staff.name,   // 👈
      serviceId: service._id,
      serviceName: service.name,      
      servicePrice: service.price,    
      serviceDuration: service.duration,
      appointmentDate,
      appointmentTime,
      startDateTime,
      endDateTime,
      clientName,
      clientEmail,
      clientPhone,
      notes,
      confirmationToken: uuidv4(),
      status: 'pending_email'
    })

    sendConfirmationEmail(newAppointment, req.tenant)
    res.status(201).json({ success: true, data: newAppointment })

  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 2. LISTAR (FILTRAR POR STAFF SE NECESSÁRIO)
router.get('/', async (req, res) => {
  try {
    const { date, staffId } = req.query 
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    let query = { 
      tenantId: req.tenantId,
      $or: [
        { status: 'confirmed' },
        { status: 'scheduled' },
        { status: 'pending_email', createdAt: { $gt: tenMinutesAgo } }
      ]
    }

    if (date) query.appointmentDate = date
    if (staffId) query.staffId = staffId // 👈 Se o frontend pedir, filtramos pelo barbeiro

    const appointments = await TenantAppointment.find(query).sort({ startDateTime: 1 })
    res.json({ success: true, data: appointments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router