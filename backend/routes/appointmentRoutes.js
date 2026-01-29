import express from 'express'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { tenantDetectionMiddleware } from '../middleware/tenantDetection.js'

const router = express.Router()

router.use(tenantDetectionMiddleware)

// --- OBTER AGENDAMENTOS ---
router.get('/', async (req, res) => {
  try {
    const appointments = await TenantAppointment.find({ tenantId: req.tenantId }).sort({ appointmentDate: 1 })
    res.json({ success: true, count: appointments.length, data: appointments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// --- CRIAR AGENDAMENTO (COM PROTEÇÃO DE DUPLICADO) ---
router.post('/', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, serviceDuration } = req.body

    // 1. VERIFICAÇÃO DE SEGURANÇA (O "Bouncer")
    // Procura se JÁ EXISTE alguém agendado para este dia, hora e barbearia
    // E garante que não conta com os cancelados.
    const existingAppointment = await TenantAppointment.findOne({
      tenantId: req.tenantId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: { $ne: 'cancelled' } // Ignora os cancelados (esses libertam a vaga)
    })

    if (existingAppointment) {
      // Se encontrou, pára tudo e devolve erro 409 (Conflict)
      return res.status(409).json({ 
        success: false, 
        error: 'Este horário acabou de ser ocupado por outro cliente. Por favor escolha outro.' 
      })
    }

    // 2. CÁLCULO DA HORA DE FIM
    let appointmentEndTime = null
    if (appointmentTime && serviceDuration) {
      const [hours, minutes] = appointmentTime.split(':').map(Number)
      const date = new Date()
      date.setHours(hours)
      date.setMinutes(minutes + parseInt(serviceDuration))
      appointmentEndTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    // 3. GRAVAR (Só chega aqui se estiver livre)
    const newAppointment = await TenantAppointment.create({
      tenantId: req.tenantId,
      ...req.body,
      appointmentEndTime,
      status: 'scheduled'
    })

    res.status(201).json({ success: true, data: newAppointment })
  } catch (error) {
    console.error('Erro POST appointment:', error)
    res.status(400).json({ success: false, error: error.message })
  }
})

// --- ATUALIZAR ---
router.put('/:id', async (req, res) => {
  try {
    const updated = await TenantAppointment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, req.body, { new: true })
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// --- CANCELAR ---
router.put('/:id/cancel', async (req, res) => {
  try {
    const cancelled = await TenantAppointment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, { status: 'cancelled' }, { new: true })
    res.json({ success: true, data: cancelled })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router