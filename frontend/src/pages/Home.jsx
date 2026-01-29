import React, { useState } from 'react'
import { useServices } from '../hooks/useServices'
import { useAppointments } from '../hooks/useAppointments'
import { Check, ArrowLeft, Calendar, Clock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Home = () => {
  const { services, loading } = useServices()
  const { createAppointment } = useAppointments()
  
  // Estados do Wizard
  const [step, setStep] = useState(1) 
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- PASSO 1: LISTA DE SERVIÇOS PREMIUM ---
  const renderServices = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">NOSSOS SERVIÇOS</h2>
        <div className="h-1 w-20 bg-yellow-500 mx-auto"></div>
      </div>
      
      {loading ? (
        <div className="text-center text-yellow-500">A carregar serviços...</div>
      ) : (
        <div className="grid gap-4">
          {services.map(service => (
            <div 
              key={service._id}
              onClick={() => { setSelectedService(service); setStep(2) }}
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-600/50 p-5 rounded-lg cursor-pointer transition-all duration-300 flex justify-between items-center"
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white uppercase tracking-wide group-hover:text-yellow-500 transition-colors">
                  {service.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">{service.duration} MIN</span>
                  {service.description && <span className="text-xs text-zinc-600">• {service.description}</span>}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-yellow-500">
                  {service.price.toFixed(2)} €
                </div>
                <ChevronRight className="text-zinc-600 group-hover:text-yellow-500 transition-colors" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // --- PASSO 2: DATA E HORA (DARK MODE) ---
  const renderDateTime = () => {
    // Gerar próximos 7 dias
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    
    // Horas fixas (depois ligamos ao backend real)
    const timeSlots = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30']

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Escolha o Horário</h2>
          <p className="text-zinc-500 mt-2">Para: <span className="text-yellow-500">{selectedService.name}</span></p>
        </div>

        {/* DIAS */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar justify-center">
          {dates.map(date => {
            const d = new Date(date)
            const isSelected = selectedDate === date
            const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
            const dayNum = d.getDate()
            
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-16 h-20 rounded-lg flex flex-col items-center justify-center border transition-all duration-300 ${
                  isSelected 
                    ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-bold tracking-widest">{weekDay}</span>
                <span className="text-xl font-bold">{dayNum}</span>
              </button>
            )
          })}
        </div>

        {/* HORAS */}
        <div className={`grid grid-cols-4 sm:grid-cols-5 gap-3 transition-opacity duration-500 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          {timeSlots.map(time => (
            <button
              key={time}
              onClick={() => { setSelectedTime(time); setStep(3) }}
              className={`py-3 rounded-md text-sm font-bold border transition-all duration-200 ${
                selectedTime === time 
                  ? 'bg-white text-black border-white' 
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-yellow-500 hover:text-yellow-500'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- PASSO 3: FORMULÁRIO FINAL ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createAppointment({
        tenantId: 'barbeariajc',
        serviceId: selectedService._id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientPhone: clientData.phone
      })
      setStep(4)
      toast.success('Marcação confirmada!', {
        style: { background: '#333', color: '#fbbf24' }
      })
    } catch (error) {
      toast.error('Erro ao marcar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6 uppercase tracking-wider">Finalizar</h2>
        
        <div className="bg-black/50 p-4 rounded mb-6 border-l-2 border-yellow-500">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Serviço</p>
          <p className="text-white font-bold mb-3">{selectedService.name}</p>
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Horário</p>
          <p className="text-white font-bold">{new Date(selectedDate).toLocaleDateString()} às {selectedTime}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-yellow-500 font-bold uppercase ml-1">Nome</label>
            <input required type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
              value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-yellow-500 font-bold uppercase ml-1">Telemóvel</label>
            <input required type="tel" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
              value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-yellow-500 font-bold uppercase ml-1">Email</label>
            <input required type="email" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
              value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
          </div>

          <button disabled={isSubmitting} type="submit" 
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider py-4 rounded mt-6 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            {isSubmitting ? 'A Processar...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center max-w-md mx-auto py-20 animate-fade-in">
      <div className="w-24 h-24 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
        <Check size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-wider">Confirmado</h2>
      <p className="text-zinc-400 mb-10">A sua marcação está registada.<br/>Enviámos um email de confirmação.</p>
      <button onClick={() => { setStep(1); setSelectedService(null); setSelectedDate(''); setSelectedTime(''); }} 
        className="text-white border-b border-yellow-500 pb-1 hover:text-yellow-500 transition-colors uppercase text-sm tracking-widest">
        Voltar ao Início
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-yellow-500 selection:text-black">
      {/* Header Falso para Branding */}
      <div className="py-8 border-b border-zinc-900 mb-10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(step - 1)} className="absolute left-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
              <ArrowLeft size={24} />
            </button>
          )}
          
          {/* LOGO SIMULADO */}
          <div className="mx-auto flex flex-col items-center justify-center">
             <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 tracking-widest uppercase" style={{fontFamily: 'serif'}}>
               BARBEARIA J
             </h1>
             <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-yellow-800 to-transparent mt-1"></div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        {step === 1 && renderServices()}
        {step === 2 && renderDateTime()}
        {step === 3 && renderForm()}
        {step === 4 && renderSuccess()}
      </div>
    </div>
  )
}

export default Home