
import nodemailer from 'nodemailer'

// Configurar transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

export const sendEmail = async ({ to, subject, html, text, from, fromName }) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: fromName ? `"${fromName}" <${from || process.env.SMTP_USER}>` : from || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Remove HTML tags se text não fornecido
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log('✅ Email enviado:', info.messageId)
    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    throw new Error(`Falha ao enviar email: ${error.message}`)
  }
}

export const sendBulkEmail = async (emails) => {
  const results = []
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email)
      results.push({ ...email, success: true, messageId: result.messageId })
    } catch (error) {
      results.push({ ...email, success: false, error: error.message })
    }
  }
  
  return results
}

// Templates de email
export const emailTemplates = {
  appointmentConfirmation: (appointment, tenant) => {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')
    
    return {
      subject: `Confirmação de Agendamento - ${tenant.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${tenant.branding.primaryColor} 0%, ${tenant.branding.secondaryColor} 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">${tenant.businessName}</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: ${tenant.branding.primaryColor};">Confirmação de Agendamento</h2>
            
            <p>Olá <strong>${appointment.clientName}</strong>,</p>
            
            <p>Seu agendamento foi confirmado com sucesso!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: ${tenant.branding.primaryColor};">Detalhes do Agendamento</h3>
              <p><strong>Serviço:</strong> ${appointment.serviceName}</p>
              <p><strong>Data:</strong> ${appointmentDate}</p>
              <p><strong>Horário:</strong> ${appointment.appointmentTime}</p>
              <p><strong>Valor:</strong> R$ ${appointment.servicePrice.toFixed(2)}</p>
              ${appointment.staffAssigned ? `<p><strong>Profissional:</strong> ${appointment.staffAssigned}</p>` : ''}
              ${appointment.notes ? `<p><strong>Observações:</strong> ${appointment.notes}</p>` : ''}
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0066cc;">Informações do Salão</h4>
              <p><strong>${tenant.businessName}</strong></p>
              <p>📍 ${tenant.businessAddress?.street}, ${tenant.businessAddress?.city}</p>
              <p>📞 ${tenant.businessPhone}</p>
              <p>✉️ ${tenant.businessEmail}</p>
            </div>
            
            <p style="color: #666;">Por favor, chegue com 10 minutos de antecedência.</p>
            <p style="color: #666;">Em caso de cancelamento, entre em contato conosco com pelo menos 2 horas de antecedência.</p>
            
            <p>Aguardamos você!</p>
            <p><strong>Equipe ${tenant.businessName}</strong></p>
          </div>
        </div>
      `
    }
  },

  appointmentReminder: (appointment, tenant) => {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')
    
    return {
      subject: `Lembrete: Agendamento Amanhã - ${tenant.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${tenant.branding.primaryColor} 0%, ${tenant.branding.secondaryColor} 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">${tenant.businessName}</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: ${tenant.branding.primaryColor};">Lembrete de Agendamento</h2>
            
            <p>Olá <strong>${appointment.clientName}</strong>,</p>
            
            <p>Este é um lembrete do seu agendamento para amanhã:</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin-top: 0; color: #856404;">Detalhes do Agendamento</h3>
              <p><strong>Serviço:</strong> ${appointment.serviceName}</p>
              <p><strong>Data:</strong> ${appointmentDate}</p>
              <p><strong>Horário:</strong> ${appointment.appointmentTime}</p>
            </div>
            
            <p style="color: #666;">Não se esqueça! Aguardamos você.</p>
            
            <p><strong>Equipe ${tenant.businessName}</strong></p>
          </div>
        </div>
      `
    }
  }
}
