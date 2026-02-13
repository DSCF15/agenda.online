import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendConfirmationEmail = async (appointment, tenant) => {
  try {
    const { clientName, clientEmail, serviceName, appointmentDate, appointmentTime, confirmationToken, tenantId } = appointment
    
    // Nome da Loja (Caniço ou Camacha)
    const storeName = tenant.businessName || 'Barbearia J'
    
    // Link para a API validar (Backend) ou para o Frontend validar
    // Vamos apontar para o Frontend, que depois chama o Backend
    const confirmLink = `http://localhost:5173/confirm/${confirmationToken}?tenant=${tenantId}`

    await resend.emails.send({
      from: 'Barbearia Agenda <onboarding@resend.dev>', // Usa o teu domínio verificado quando fores para produção
      to: clientEmail,
      subject: `🕒 Confirme o seu agendamento em ${storeName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Olá ${clientName}, falta pouco!</h2>
          <p>Para garantir o seu horário na <strong>${storeName}</strong>, clique no botão abaixo nos próximos <strong>10 minutos</strong>.</p>
          
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Serviço:</strong> ${serviceName}</p>
            <p><strong>Data:</strong> ${appointmentDate} às ${appointmentTime}</p>
          </div>

          <a href="${confirmLink}" style="background-color: #EAB308; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            CONFIRMAR AGENDAMENTO
          </a>
          
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Se não confirmar em 10 minutos, o horário será libertado para outros clientes.
          </p>
        </div>
      `
    })

    console.log(`📨 Email Resend enviado para ${clientEmail}`)
    return true
  } catch (error) {
    console.error('❌ Erro Resend:', error)
    return false
  }
}