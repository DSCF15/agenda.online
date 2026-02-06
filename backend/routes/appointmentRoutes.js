import express from 'express'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { TenantService } from '../models/TenantService.js'
import { tenantDetectionMiddleware, checkPlanLimits } from '../middleware/tenantDetection.js'
import { v4 as uuidv4 } from 'uuid' // Instala isto: npm install uuid

const router = express.Router()

// 1. Proteção: Só entra quem tem subdomínio válido
router.use(tenantDetectionMiddleware)

// =========================================================
// CRIAR AGENDAMENTO (O tal "POST")
// =========================================================
router.post('/', checkPlanLimits('appointments'), async (req, res) => {
  try {
    const { serviceId, appointmentDate, appointmentTime, clientName, clientEmail, clientPhone, notes } = req.body
    const tenantId = req.tenantId

    // 1. Validar se o serviço existe
    const service = await TenantService.findOne({ _id: serviceId, tenantId })
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Serviço não encontrado.' })
    }

    // 2. Calcular Data e Hora de Início e Fim (Para guardar como Date real)
    // Entra: date="2023-10-25", time="14:30" -> Sai: Objeto Date Javascript
    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)
    
    // Adiciona a duração do serviço (em minutos) para achar o fim
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000)

    // Validar se a data é válida
    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Data ou hora inválida.' })
    }

    // 3. 🛡️ VERIFICAR CONFLITOS (A parte mais importante)
    // Procura se já existe algum agendamento que se sobreponha a este horário
    const conflict = await TenantAppointment.findOne({
      tenantId,
      status: { $ne: 'cancelled' }, // Ignora os cancelados
      $or: [
        // Caso 1: O novo começa durante um existente
        { startDateTime: { $lt: endDateTime, $gte: startDateTime } },
        // Caso 2: O novo termina durante um existente
        { endDateTime: { $gt: startDateTime, $lte: endDateTime } },
        // Caso 3: O novo engloba totalmente um existente (é maior que o existente)
        { startDateTime: { $lte: startDateTime }, endDateTime: { $gte: endDateTime } } 
      ]
      // Nota: A lógica acima precisa ser ajustada ligeiramente na query real do Mongo:
    })
    
    // CORREÇÃO DA QUERY DE CONFLITO PARA MONGODB:
    // "Existe algum agendamento onde o INÍCIO seja ANTES do meu FIM 
    //  E o FIM seja DEPOIS do meu INÍCIO?"
    const hasConflict = await TenantAppointment.findOne({
      tenantId,
      status: { $ne: 'cancelled' },
      startDateTime: { $lt: endDateTime },
      endDateTime: { $gt: startDateTime }
    })

    if (hasConflict) {
      return res.status(409).json({ 
        success: false, 
        message: 'Horário indisponível. Já existe um agendamento nesse intervalo.' 
      })
    }

    // 4. Criar o Agendamento
    const newAppointment = await TenantAppointment.create({
      tenantId,
      serviceId: service._id,
      serviceName: service.name,      // Snapshot do nome
      servicePrice: service.price,    // Snapshot do preço
      serviceDuration: service.duration,
      
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      startDateTime,
      endDateTime,
      
      clientName,
      clientEmail,
      clientPhone,
      notes,
      
      confirmationToken: uuidv4(), // Gera um token único
      status: 'scheduled'
    })

    res.status(201).json({ 
      success: true, 
      message: 'Agendamento criado com sucesso!',
      data: newAppointment 
    })

  } catch (error) {
    console.error('Erro ao agendar:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// =========================================================
// LISTAR AGENDAMENTOS (GET)
// =========================================================
router.get('/', async (req, res) => {
  try {
    const { date } = req.query // ex: /appointments?date=2023-10-25
    
    let query = { tenantId: req.tenantId }
    
    if (date) {
      query.appointmentDate = date
    }

    const appointments = await TenantAppointment.find(query)
      .sort({ startDateTime: 1 }) // Ordena por horário

    res.json({ success: true, data: appointments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router