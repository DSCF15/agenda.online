import React, { useState, useEffect } from 'react'
import { useServices } from '../hooks/useServices'
import { useAppointments } from '../hooks/useAppointments'
import { Check, ArrowLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Home = () => {
  const { services, loading } = useServices()
  const { createAppointment, fetchAppointments, appointments } = useAppointments()
  
  const [step, setStep] = useState(1) 
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Atualizar a agenda assim que abre para saber o que esconder
  useEffect(() => {
    fetchAppointments()
  }, [])

  // --- PASSO 1: SERVIÇOS ---
  const renderServices = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">NOSSOS SERVIÇOS</h2>
        <div className="h-1 w-20 bg-yellow-500 mx-auto"></div>
      </div>
      
      {loading ? <div className="text-center text-yellow-500">A carregar...</div> : (
        <div className="grid gap-4">
          {services.map(service => (
            <div key={service._id} onClick={() => { setSelectedService(service); setStep(2) }}
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-600/50 p-5 rounded-lg cursor-pointer transition-all duration-300 flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white uppercase tracking-wide group-hover:text-yellow-500">{service.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">{service.duration} MIN</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-yellow-500">{service.price.toFixed(2)} €</div>
                <ChevronRight className="text-zinc-600 group-hover:text-yellow-500" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // --- PASSO 2: CALENDÁRIO (FILTRADO) ---
  const renderDateTime = () => {
    const dates = []
    
    // 1. Garante que começamos "Hoje" sem horas a atrapalhar
    let currentDate = new Date()
    
    // Lista de Feriados (Mês-Dia). Nota: Janeiro é 0, Fevereiro é 1, etc.
    const holidays = ['0-1', '3-25', '4-1', '11-25', '12-25'] 

    // 2. Loop para gerar 30 dias VÁLIDOS (saltando Domingos e Feriados)
    while (dates.length < 30) {
      // Se não for Domingo (0)
      if (currentDate.getDay() !== 0) { 
        const holidayKey = `${currentDate.getMonth()}-${currentDate.getDate()}`
        
        // Se não for Feriado
        if (!holidays.includes(holidayKey)) {
          dates.push(new Date(currentDate))
        }
      }
      // Avançar para o dia seguinte
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const timeSlots = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30']

    // Lógica de esconder horários ocupados/em hold
    const bookedTimes = appointments
      .filter(apt => {
        if (apt.status === 'cancelled') return false
        if (apt.status === 'confirmed') return true
        if (apt.status === 'pending_email') {
          const createdAt = new Date(apt.createdAt)
          const now = new Date()
          const diffInMinutes = (now - createdAt) / 1000 / 60
          return diffInMinutes < 10 // Esconde se criado há menos de 10 min
        }
        return true
      })
      .filter(apt => apt.appointmentDate === selectedDate)
      .map(apt => apt.appointmentTime)

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Escolha o Dia</h2>
          <p className="text-zinc-500 mt-2">Para: <span className="text-yellow-500">{selectedService.name}</span></p>
        </div>

        {/* CORREÇÃO CRÍTICA AQUI:
            Usei apenas 'justify-start'. Removi qualquer referência a center.
            Isto obriga a lista a começar na esquerda (Hoje).
        */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar justify-start px-2">
          {dates.map(dateObj => {
            const dateStr = dateObj.toISOString().split('T')[0]
            const isSelected = selectedDate === dateStr
            const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
            const dayNum = dateObj.getDate()
            const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
            
            return (
              <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 w-20 h-24 rounded-lg flex flex-col items-center justify-center border transition-all duration-300 ${
                  isSelected 
                    ? 'bg-yellow-500 border-yellow-500 text-black font-bold transform scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}>
                <span className="text-[10px] tracking-widest opacity-80">{monthName}</span>
                <span className="text-2xl font-bold my-1">{dayNum}</span>
                <span className="text-[10px] tracking-widest opacity-80">{weekDay}</span>
              </button>
            )
          })}
        </div>

        {/* HORAS */}
        <div className={`grid grid-cols-4 sm:grid-cols-6 gap-3 transition-opacity duration-500 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          {timeSlots.map(time => {
            const isTaken = bookedTimes.includes(time)
            if (isTaken) return null 

            return (
              <button 
                key={time} 
                onClick={() => { setSelectedTime(time); setStep(3) }}
                className={`py-3 rounded-md text-sm font-bold border transition-all duration-200 ${
                  selectedTime === time 
                    ? 'bg-white text-black border-white' 
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-yellow-500 hover:text-yellow-500'
                }`}>
                {time}
              </button>
            )
          })}
          
          {selectedDate && timeSlots.every(t => bookedTimes.includes(t)) && (
            <div className="col-span-full text-center text-zinc-500 py-4 italic border border-zinc-800 rounded bg-zinc-900/50">
              Dia completo. Por favor escolha outro.
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- PASSO 3: FORMULÁRIO ---
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
      toast.success('Marcação confirmada!')
    } catch (error) {
      toast.error('Horário ocupado entretanto. Tenta outro.')
      fetchAppointments() 
      setStep(2)
      setSelectedTime('') 
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6 uppercase">Finalizar</h2>
        <div className="bg-black/50 p-4 rounded mb-6 border-l-2 border-yellow-500">
          <p className="text-white font-bold">{selectedService.name}</p>
          <p className="text-zinc-400 text-sm">{new Date(selectedDate).toLocaleDateString()} às {selectedTime}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs text-zinc-500 uppercase font-bold ml-1">Nome</label>
             <input required className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors" 
              value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-xs text-zinc-500 uppercase font-bold ml-1">Telemóvel</label>
             <input required className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors" 
              value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-xs text-zinc-500 uppercase font-bold ml-1">Email</label>
             <input required type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors" 
              value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-yellow-500 text-black font-bold py-4 rounded mt-6 hover:bg-yellow-400 disabled:opacity-50 uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            {isSubmitting ? 'A Confirmar...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  )

 const renderSuccess = () => (
    <div className="text-center py-20 animate-fade-in max-w-md mx-auto">
      <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
        {/* Ícone de Email/Carta */}
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-widest">Verifique o Email</h2>
      <p className="text-zinc-400 mb-8 text-lg">Enviámos um link de confirmação para <b>{clientData.email}</b>.<br/>Clique no botão do email para garantir o seu lugar.</p>
      
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-500">
        ⚠️ O horário fica reservado por apenas <b>10 minutos</b>.
      </div>
      
      <button onClick={() => window.location.reload()} className="mt-10 text-zinc-500 hover:text-white border-b border-transparent hover:border-white transition-all pb-1">
        Voltar ao início
      </button>
    </div>
  )
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-yellow-500 selection:text-black">
      <div className="py-8 border-b border-zinc-900 mb-10 bg-black/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
          {step > 1 && step < 4 && <button onClick={() => setStep(step - 1)} className="absolute left-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"><ArrowLeft size={24} /></button>}
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 mx-auto tracking-widest uppercase" style={{fontFamily: 'serif'}}>BARBEARIA J</h1>
        </div>
      </div>
      <div className="px-4">
        {step === 1 && renderServices()}
        {step === 2 && renderDateTime()}
        {step === 3 && renderForm()}
        {step === 4 && renderSuccess()}
      </div>
    </div>
  )
}

export default Home