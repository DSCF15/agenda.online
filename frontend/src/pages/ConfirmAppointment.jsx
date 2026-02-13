import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const ConfirmAppointment = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') 
  const [appointment, setAppointment] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // CORREÇÃO: Mudámos de /verify para /confirm
        const response = await fetch(`http://localhost:5000/api/appointments/confirm`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
            // Não enviamos x-tenant porque a rota agora é pública!
          },
          body: JSON.stringify({ token })
        })

        // O erro de Sintaxe "<" acontecia porque a resposta não era JSON (era erro 404 HTML)
        // Agora verificamos se é JSON antes de fazer parse
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Resposta inválida do servidor (não é JSON)");
        }

        const data = await response.json()
        
        if (data.success) {
          setAppointment(data.data)
          setStatus('success')
        } else {
          console.error('Erro backend:', data.message)
          setErrorMsg(data.message || 'Erro desconhecido')
          setStatus('error')
        }
      } catch (error) {
        console.error('Erro fetch:', error)
        setErrorMsg('Falha de ligação ou link inválido.')
        setStatus('error')
      }
    }

    if (token) verifyToken()
  }, [token])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md">
        
        {status === 'loading' && (
          <div className="text-center">
            <Loader className="animate-spin text-yellow-500 mx-auto mb-4" size={40} />
            <p className="text-zinc-400">A validar o seu agendamento...</p>
          </div>
        )}

        {status === 'success' && appointment && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-8 text-center animate-fade-in">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={50} />
            <h2 className="text-2xl font-bold text-green-500 mb-2">Confirmado!</h2>
            <p className="text-zinc-300 mb-6">
              Obrigado <b>{appointment.clientName}</b>. <br/>
              A sua marcação para <b>{appointment.appointmentDate}</b> às <b>{appointment.appointmentTime}</b> está segura.
            </p>
            <button onClick={() => navigate(`/${appointment.tenantId}`)} className="text-yellow-500 hover:underline">
              Voltar à loja
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-8 text-center">
            <XCircle className="text-red-500 mx-auto mb-4" size={50} />
            <h2 className="text-xl font-bold text-white mb-2">Ups! Algo correu mal.</h2>
            <p className="text-red-400 mb-6 text-sm bg-black/30 p-2 rounded">{errorMsg}</p>
            <button onClick={() => navigate('/')} className="bg-zinc-800 px-4 py-2 rounded hover:bg-zinc-700">
              Voltar ao início
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default ConfirmAppointment