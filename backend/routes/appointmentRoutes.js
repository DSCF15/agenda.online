import express from 'express'
import { TenantAppointment } from '../models/TenantAppointment.js'
import { tenantDetectionMiddleware } from '../middleware/tenantDetection.js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

// --- FUNÇÃO DE EMAIL ---
const sendConfirmationEmail = async (email, link, clientName, date, time, serviceName) => {
  try {
    const formattedDate = new Date(date).toLocaleDateString('pt-PT');
    await transporter.sendMail({
      from: `"Barbearia J" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Ação necessária: Confirme o seu agendamento ✂️",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #EAB308; margin: 0; font-size: 24px; text-transform: uppercase;">Barbearia J</h1>
          </div>
          <div style="padding: 30px; background-color: #fff;">
            <h2 style="margin-top: 0;">Olá ${clientName},</h2>
            <p>Recebemos o seu pedido de marcação. Por favor, confirme os detalhes abaixo:</p>
            
            <div style="background-color: #f4f4f5; padding: 15px; border-left: 4px solid #EAB308; margin: 20px 0;">
              <p style="margin: 5px 0;">📅 <b>Data:</b> ${formattedDate}</p>
              <p style="margin: 5px 0;">⏰ <b>Hora:</b> ${time}</p>
              <p style="margin: 5px 0;">✂️ <b>Serviço:</b> ${serviceName}</p>
            </div>

            <p style="font-size: 14px; color: #666;">O horário fica reservado por <b>10 minutos</b>.</p>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${link}" style="background-color: #EAB308; color: #000; padding: 15px 35px; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px; display: inline-block;">CONFIRMAR AGENDAMENTO</a>
            </div>
          </div>
        </div>
      `
    })
    console.log('✅ Email enviado com detalhes!')
  } catch (error) { console.error('Erro email:', error) }
}

// ==================================================================
// 🚨 ZONA PÚBLICA (ANTES DO MIDDLEWARE)
// ==================================================================

// --- ROTA DE CONFIRMAÇÃO (Agora funciona sem header de tenant) ---
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body
    console.log('🔍 A verificar token:', token)

    // 1. Procurar o agendamento pelo Token (Globalmente)
    const appointment = await TenantAppointment.findOne({ confirmationToken: token })

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Link inválido ou não encontrado.' })
    }

    // 2. Verificar Validade (10 minutos)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    
    // Se foi criado há mais de 10 min E ainda não está confirmado, cancela
    if (new Date(appointment.createdAt) < tenMinutesAgo && appointment.status !== 'confirmed') {
      appointment.status = 'cancelled'
      await appointment.save()
      return res.status(400).json({ success: false, error: 'O tempo limite (10 min) expirou.' })
    }

    // 3. Confirmar
    appointment.status = 'confirmed'
    appointment.confirmationToken = null 
    await appointment.save()

    console.log('✅ Sucesso! Agendamento confirmado na BD.')
    res.json({ success: true, message: 'Confirmado!', data: appointment })

  } catch (error) { 
    console.error('Erro verify:', error)
    res.status(500).json({ success: false, error: error.message }) 
  }
})

// ==================================================================
// 🔒 ZONA PROTEGIDA (O "PORTEIRO" ATUA DAQUI PARA BAIXO)
// ==================================================================
router.use(tenantDetectionMiddleware)

// --- GET ---
router.get('/', async (req, res) => {
  try {
    const appointments = await TenantAppointment.find({ tenantId: req.tenantId })
    res.json({ success: true, data: appointments })
  } catch (error) { res.status(500).json({ success: false, error: error.message }) }
})

// --- POST (Criar) ---
router.post('/', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, serviceDuration, clientEmail, clientName, serviceName } = req.body
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const conflict = await TenantAppointment.findOne({
      tenantId: req.tenantId,
      appointmentDate,
      appointmentTime,
      $or: [
        { status: 'confirmed' },
        { status: 'pending_email', createdAt: { $gt: tenMinutesAgo } }
      ]
    })

    if (conflict) return res.status(409).json({ success: false, error: 'Horário indisponível.' })

    let appointmentEndTime = null
    if (appointmentTime && serviceDuration) {
      const [h, m] = appointmentTime.split(':').map(Number)
      const d = new Date(); d.setHours(h); d.setMinutes(m + parseInt(serviceDuration))
      appointmentEndTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const token = crypto.randomBytes(20).toString('hex')
    const newAppointment = await TenantAppointment.create({
      tenantId: req.tenantId,
      ...req.body,
      appointmentEndTime,
      status: 'pending_email',
      confirmationToken: token
    })

    const verificationLink = `http://localhost:5173/confirm/${token}`
    
    // ENVIA EMAIL
    sendConfirmationEmail(clientEmail, verificationLink, clientName, appointmentDate, appointmentTime, serviceName)

    res.status(201).json({ success: true, data: newAppointment })
  } catch (error) { res.status(400).json({ success: false, error: error.message }) }
})

// --- PUT & CANCEL ---
router.put('/:id', async (req, res) => {
    try {
      const updated = await TenantAppointment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, req.body, { new: true })
      res.json({ success: true, data: updated })
    } catch (error) { res.status(400).json({ success: false, error: error.message }) }
  })

router.put('/:id/cancel', async (req, res) => {
    try {
        const cancelled = await TenantAppointment.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, { status: 'cancelled' }, { new: true })
        res.json({ success: true, data: cancelled })
    } catch (error) { res.status(400).json({ success: false, error: error.message }) }
})

export default router