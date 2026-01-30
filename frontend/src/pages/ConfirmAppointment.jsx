import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Calendar, Clock, Scissors } from 'lucide-react'

const ConfirmAppointment = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') 
  const [appointment, setAppointment] = useState(null)

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // IMPORTANTE: 'x-tenant': 'barbeariajc' é essencial em localhost!
        const response = await fetch(`http://localhost:5000/api/appointments/verify`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-tenant': 'barbeariajc' // <--- GARANTE QUE ISTO ESTÁ AQUI
          },
          body: JSON.stringify({ token })
        })
        const data = await response.json()
        
        if (data.success) {
          setAppointment(data.data)
          setStatus('success')
        } else {
          console.error('Erro backend:', data.error)
          setStatus('error')
        }
      } catch (error) {
        console.error('Erro fetch:', error)
        setStatus('error')
      }
    }
    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* LOGO */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 uppercase tracking-widest" style={{fontFamily: 'serif'}}>
            BARBEARIA J
          </h1>
        </div>

        {/* LOADING */}
        {status === 'loading' && (
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl shadow-2xl text-center">
            <Loader className="animate-spin text-yellow-500 mx-auto mb-4" size={40} />
            <p className="text-zinc-400 animate-pulse">A confirmar disponibilidade...</p>
          </div>
        )}

        {/* SUCESSO - RECIBO DIGITAL */}
        {status === 'success' && appointment && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative">
            <div className="bg-green-500/10 p-6 text-center border-b border-green-500/20">
              <div className="w-16 h-16 bg-green-500 text-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
                <CheckCircle size={32} strokeWidth={3} />
              </div>
              <h2 className="text-green-500 text-xl font-bold uppercase tracking-wider">Marcação Confirmada</h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Cliente</p>
                <p className="text-white text-lg font-medium">{appointment.clientName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-black/30 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-center border-r border-zinc-800">
                  <Calendar className="text-yellow-500 mx-auto mb-2" size={20}/>
                  <p className="text-white font-bold">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                  <p className="text-zinc-500 text-xs uppercase">Data</p>
                </div>
                <div className="text-center">
                  <Clock className="text-yellow-500 mx-auto mb-2" size={20}/>
                  <p className="text-white font-bold">{appointment.appointmentTime}</p>
                  <p className="text-zinc-500 text-xs uppercase">Hora</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-xl">
                <div className="bg-zinc-700 p-2 rounded-lg text-zinc-300">
                  <Scissors size={20} />
                </div>
                <div>
                  <p className="text-zinc-400 text-xs uppercase">Serviço</p>
                  <p className="text-white font-bold">{appointment.serviceName}</p>
                </div>
              </div>
            </div>

            <div className="bg-black p-4 text-center">
              <button onClick={() => navigate('/home')} className="text-zinc-500 hover:text-white text-sm transition-colors">
                Voltar ao site
              </button>
            </div>
          </div>
        )}

        {/* ERRO */}
        {status === 'error' && (
          <div className="bg-zinc-900 border border-red-900/30 p-10 rounded-2xl shadow-2xl text-center">
            <XCircle className="text-red-500 mx-auto mb-4" size={50} />
            <h2 className="text-white text-xl font-bold mb-2">Erro na Confirmação</h2>
            <p className="text-zinc-400 mb-6">O link pode ter expirado (10 minutos) ou o horário foi ocupado.</p>
            <button onClick={() => navigate('/home')} className="bg-zinc-800 text-white px-6 py-3 rounded-lg hover:bg-zinc-700 font-bold uppercase text-sm">
              Fazer nova marcação
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfirmAppointment