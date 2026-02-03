import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Calendar, Clock, Scissors } from 'lucide-react'

const ConfirmAppointment = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') 
  const [appointment, setAppointment] = useState(null)
  const [errorMsg, setErrorMsg] = useState('') // Para guardar o erro real

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Agora que corrigimos o server.js, não precisamos de headers extra!
        const response = await fetch(`http://localhost:5000/api/appointments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const data = await response.json()
        
        if (data.success) {
          setAppointment(data.data)
          setStatus('success')
        } else {
          console.error('Erro backend:', data.error)
          setErrorMsg(data.error || 'Erro desconhecido')
          setStatus('error')
        }
      } catch (error) {
        console.error('Erro fetch:', error)
        setErrorMsg('Falha de ligação ao servidor')
        setStatus('error')
      }
    }
    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">BARBEARIA J</h1>
        </div>

        {status === 'loading' && (
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl text-center">
            <Loader className="animate-spin text-yellow-500 mx-auto mb-4" size={40} />
            <p className="text-zinc-400">A validar confirmação...</p>
          </div>
        )}

        {status === 'success' && appointment && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-fade-in">
            <div className="bg-green-500/10 p-6 text-center border-b border-green-500/20">
              <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
              <h2 className="text-green-500 text-xl font-bold uppercase">Confirmado!</h2>
            </div>
            <div className="p-8 text-center space-y-4">
              <p className="text-white text-lg">Olá <b>{appointment.clientName}</b>,</p>
              <p className="text-zinc-400">O seu agendamento para <b>{new Date(appointment.appointmentDate).toLocaleDateString()}</b> às <b>{appointment.appointmentTime}</b> está garantido.</p>
              <button onClick={() => navigate('/home')} className="mt-4 text-yellow-500 hover:text-white text-sm underline">Voltar ao site</button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-zinc-900 border border-red-900/50 p-10 rounded-2xl text-center shadow-lg shadow-red-900/10">
            <XCircle className="text-red-500 mx-auto mb-4" size={50} />
            <h2 className="text-white text-xl font-bold mb-2">Erro na Confirmação</h2>
            
            {/* AQUI VAI APARECER O ERRO REAL */}
            <div className="bg-black/40 p-3 rounded border border-red-900/30 mb-6">
              <p className="text-red-400 font-mono text-sm">{errorMsg}</p>
            </div>

            <button onClick={() => navigate('/home')} className="bg-zinc-800 text-white px-6 py-3 rounded hover:bg-zinc-700 font-bold uppercase text-sm">
              Fazer nova marcação
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfirmAppointment