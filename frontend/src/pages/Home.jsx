import React, { useState } from 'react'
import { useServices } from '../hooks/useServices'
import { useAppointments } from '../hooks/useAppointments'
import { Check, ArrowLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Home = () => {
  const { services, loading } = useServices()
  const { createAppointment } = useAppointments()
  
  const [step, setStep] = useState(1) 
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // --- PASSO 2: CALENDÁRIO INTELIGENTE ---
  const renderDateTime = () => {
    // LÓGICA: Gerar os próximos 30 dias válidos
    const dates = []
    let daysCount = 0
    let currentDate = new Date()
    
    // Lista de Feriados fixos (Exemplo: Ano Novo, 25 Abril, 1 Maio, Natal)
    // Formato: "Mês-Dia"
    const holidays = ['0-1', '3-25', '4-1', '11-25'] 

    while (daysCount < 30) { // Queremos mostrar 30 opções válidas
      // Verifica se é Domingo (0)
      if (currentDate.getDay() !== 0) {
        // Verifica se é feriado
        const holidayKey = `${currentDate.getMonth()}-${currentDate.getDate()}`
        if (!holidays.includes(holidayKey)) {
          dates.push(new Date(currentDate))
        }
      }
      
      // Avança para o dia seguinte
      currentDate.setDate(currentDate.getDate() + 1)
      
      // Limite de segurança para o loop não ser infinito (max 60 dias de procura)
      daysCount++ 
    }

    const timeSlots = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30']

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Escolha o Dia</h2>
          <p className="text-zinc-500 mt-2">Para: <span className="text-yellow-500">{selectedService.name}</span></p>
        </div>

        {/* DIAS (Carrossel) */}
        <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar">
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
                    ? 'bg-yellow-500 border-yellow-500 text-black font-bold transform scale-105' 
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
          {timeSlots.map(time => (
            <button key={time} onClick={() => { setSelectedTime(time); setStep(3) }}
              className={`py-3 rounded-md text-sm font-bold border transition-all duration-200 ${
                selectedTime === time 
                  ? 'bg-white text-black border-white' 
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-yellow-500 hover:text-yellow-500'
              }`}>
              {time}
            </button>
          ))}
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
      // Aqui apanhamos o erro de duplicado
      toast.error(error.message || 'Horário já ocupado!', { duration: 5000 })
      // Se deu erro de ocupado, volta ao passo 2 para escolher outra hora
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
          <input required placeholder="Teu Nome" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
          <input required placeholder="Telemóvel" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} />
          <input required placeholder="Email" type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
          <button disabled={isSubmitting} type="submit" className="w-full bg-yellow-500 text-black font-bold py-4 rounded mt-4 hover:bg-yellow-400 disabled:opacity-50">
            {isSubmitting ? 'A Confirmar...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-24 h-24 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
        <Check size={48} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Confirmado!</h2>
      <button onClick={() => window.location.reload()} className="text-yellow-500 border-b border-yellow-500 pb-1">Voltar ao Início</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <div className="py-8 border-b border-zinc-900 mb-10 bg-black/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
          {step > 1 && step < 4 && <button onClick={() => setStep(step - 1)} className="absolute left-4 p-2"><ArrowLeft size={24} /></button>}
          <h1 className="text-2xl font-bold text-yellow-500 mx-auto tracking-widest uppercase" style={{fontFamily: 'serif'}}>BARBEARIA J</h1>
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