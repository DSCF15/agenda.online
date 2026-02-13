import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import { useAppointments } from '../hooks/useAppointments'
import { useStaff } from '../hooks/useStaff' // 👈 Importa o Hook de Staff
import { Check, ArrowLeft, ChevronRight, MapPin, User } from 'lucide-react' // 👈 Importa ícone User
import toast from 'react-hot-toast'

const Home = () => {
  const { tenantId } = useParams() 
  const currentTenant = tenantId || 'barbeariajc'

  // Hooks
  const { services, loading, fetchServices } = useServices()
  const { staff, fetchStaff } = useStaff() // 👈 Inicializa o Hook de Staff
  const { createAppointment, fetchAppointments, appointments } = useAppointments()
  
  // Estados
  const [step, setStep] = useState(1) 
  const [selectedService, setSelectedService] = useState(null)
  
  // 👇 ESTADO DO BARBEIRO (Faltava isto!)
  const [selectedStaff, setSelectedStaff] = useState(null) 

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    console.log("🌍 A carregar loja via URL:", currentTenant)
    fetchServices(currentTenant)
    fetchAppointments(currentTenant)
    
    if (fetchStaff) fetchStaff(currentTenant) // Carrega os barbeiros

    // Reset visual
    setStep(1)
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedDate('')
    setSelectedTime('')
  }, [currentTenant, fetchServices, fetchAppointments, fetchStaff]) 

  const getLocationName = () => {
    if (currentTenant === 'barbeariajc') return 'Caniço'
    if (currentTenant === 'barbeariajcamacha') return 'Camacha'
    return currentTenant
  }

  // --- PASSO 1: SERVIÇOS ---
  const renderServices = () => (
    <div className="max-w-4xl mx-auto animate-fade-in pt-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-1 rounded-full mb-4 shadow-lg">
          <MapPin size={14} className="text-yellow-500" />
          <span className="text-zinc-400 text-xs uppercase tracking-wider">Unidade:</span>
          <span className="text-white font-bold text-xs uppercase">{getLocationName()}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">NOSSOS SERVIÇOS</h2>
        <div className="h-1 w-20 bg-yellow-500 mx-auto"></div>
      </div>
      
      {loading ? (
        <div className="text-center text-yellow-500 animate-pulse mt-10">A carregar serviços...</div>
      ) : (
        <div className="grid gap-4 pb-20">
          {services.map(service => (
            <div key={service._id} onClick={() => { setSelectedService(service); setStep(2) }} // Vai para o passo 2 (Staff)
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-600/50 p-5 rounded-lg cursor-pointer transition-all duration-300 flex justify-between items-center shadow-lg">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white uppercase tracking-wide group-hover:text-yellow-500">{service.name}</h3>
                <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">{service.duration} MIN</span>
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

  // --- PASSO 2: ESCOLHER BARBEIRO (NOVO) ---
  const renderStaffSelection = () => (
    <div className="max-w-4xl mx-auto animate-fade-in pt-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Escolha o Profissional</h2>
        <p className="text-zinc-500 mt-2">Quem vai cuidar de si hoje?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Opção "Sem Preferência" */}
        <div onClick={() => { setSelectedStaff(null); setStep(3) }}
             className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-yellow-500 cursor-pointer flex flex-col items-center gap-3 transition-all hover:-translate-y-1">
           <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
             <User size={32} />
           </div>
           <span className="text-white font-bold text-center">Sem Preferência</span>
           <span className="text-xs text-zinc-500">Qualquer barbeiro livre</span>
        </div>
        
        {/* Lista de Barbeiros */}
        {staff.map(member => (
          <div key={member._id} onClick={() => { setSelectedStaff(member); setStep(3) }}
             className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-yellow-500 cursor-pointer flex flex-col items-center gap-3 transition-all hover:-translate-y-1">
             <div className="w-16 h-16 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-2xl shadow-lg shadow-yellow-500/20">
               {member.name.charAt(0)}
             </div>
             <span className="text-white font-bold text-center">{member.name}</span>
             <span className="text-xs text-green-500 font-mono uppercase">Disponível</span>
          </div>
        ))}
      </div>
    </div>
  )

  // --- PASSO 3: CALENDÁRIO ---
  const renderDateTime = () => {
    const dates = []
    let currentDate = new Date()
    const holidays = ['0-1', '3-25', '4-1', '11-25', '12-25'] 

    while (dates.length < 30) {
      if (currentDate.getDay() !== 0) { 
        const holidayKey = `${currentDate.getMonth()}-${currentDate.getDate()}`
        if (!holidays.includes(holidayKey)) dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const timeSlots = ['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30']

    // Lógica de Bloqueio por Barbeiro
    const bookedTimes = appointments
      .filter(apt => {
        if (apt.tenantId && apt.tenantId !== currentTenant) return false
        if (apt.status === 'cancelled') return false
        
        // 👇 SE escolher um staff específico, só bloqueia se for esse staff
        if (selectedStaff && apt.staffId && apt.staffId !== selectedStaff._id) return false
        
        // Regra dos 10 minutos
        if (apt.status === 'confirmed') return true
        if (apt.status === 'pending_email') {
          const createdAt = new Date(apt.createdAt)
          const now = new Date()
          return ((now - createdAt) / 1000 / 60) < 10
        }
        return true
      })
      .filter(apt => apt.appointmentDate === selectedDate)
      .map(apt => apt.appointmentTime)

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pt-4">
        <div className="text-center mb-8">
           <span className="text-xs font-bold text-black bg-yellow-500 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
             📍 {getLocationName()}
           </span>
           {selectedStaff && (
             <div className="mt-2 text-zinc-400 text-sm">
               Profissional: <span className="text-white font-bold">{selectedStaff.name}</span>
             </div>
           )}
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest mt-2">Escolha o Dia</h2>
        </div>

        <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar justify-start px-2">
          {dates.map(dateObj => {
            const dateStr = dateObj.toISOString().split('T')[0]
            const isSelected = selectedDate === dateStr
            const dayNum = dateObj.getDate()
            const weekDay = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
            
            return (
              <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 w-20 h-24 rounded-lg flex flex-col items-center justify-center border transition-all duration-300 ${
                  isSelected 
                    ? 'bg-yellow-500 border-yellow-500 text-black font-bold transform scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                }`}>
                <span className="text-2xl font-bold my-1">{dayNum}</span>
                <span className="text-[10px] tracking-widest opacity-80">{weekDay}</span>
              </button>
            )
          })}
        </div>

        <div className={`grid grid-cols-4 sm:grid-cols-6 gap-3 transition-opacity duration-500 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          {timeSlots.map(time => {
            if (bookedTimes.includes(time)) return null 
            return (
              <button key={time} onClick={() => { setSelectedTime(time); setStep(4) }} // Vai para Step 4 (Form)
                className={`py-3 rounded-md text-sm font-bold border transition-all duration-200 ${
                  selectedTime === time 
                    ? 'bg-white text-black border-white' 
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-yellow-500 hover:text-yellow-500'
                }`}>
                {time}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // --- PASSO 4: FORMULÁRIO ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createAppointment({
        tenantId: currentTenant,
        serviceId: selectedService._id,
        // 👇 Se não escolheu staff, mandamos null (o backend deve tratar ou rejeitar se for obrigatório)
        // No seed que fizemos, é obrigatório, por isso garantam que escolhem um staff ou implementem lógica de "aleatório" no backend.
        staffId: selectedStaff ? selectedStaff._id : staff[0]?._id, // Fallback para o 1º da lista se for "Sem preferência"
        
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientPhone: clientData.phone
      })
      setStep(5) // Vai para Step 5 (Sucesso)
      toast.success('Verifique o seu email!')
    } catch (error) {
      toast.error('Horário ocupado.')
      fetchAppointments(currentTenant)
      setStep(3); setSelectedTime('') 
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <div className="max-w-md mx-auto animate-fade-in pt-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6 uppercase">Finalizar</h2>
        <div className="bg-black/50 p-4 rounded mb-6 border-l-2 border-yellow-500 text-sm space-y-1">
          <p className="text-white font-bold text-lg">{selectedService.name}</p>
          <p className="text-zinc-400">📅 {new Date(selectedDate).toLocaleDateString()} às {selectedTime}</p>
          <p className="text-zinc-400">✂️ {selectedStaff ? selectedStaff.name : 'Barbeiro disponível'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Nome" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} />
          <input required placeholder="Telemóvel" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} />
          <input required placeholder="Email" type="email" className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-yellow-500 outline-none" 
            value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
          <button disabled={isSubmitting} type="submit" className="w-full bg-yellow-500 text-black font-bold py-4 rounded mt-4 hover:bg-yellow-400 disabled:opacity-50 uppercase tracking-widest">
            {isSubmitting ? 'A Processar...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-20 animate-fade-in max-w-md mx-auto px-4">
      <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
        <Check size={40} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-widest">Verifique o Email</h2>
      <p className="text-zinc-400 mb-8 text-lg">Enviámos um link de confirmação para <b>{clientData.email}</b>.</p>
      <button onClick={() => window.location.reload()} className="text-zinc-500 hover:text-white border-b border-transparent hover:border-white transition-all pb-1">Voltar ao início</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-yellow-500 selection:text-black">
      <div className="py-6 border-b border-zinc-900 mb-6 bg-black/50 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(step - 1)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
              <ArrowLeft size={24} />
            </button>
          ) : <div className="w-10"></div>}

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 tracking-widest uppercase text-center cursor-pointer" 
                onClick={() => setStep(1)} style={{fontFamily: 'serif'}}>
              BARBEARIA J
            </h1>
            <span className="text-[10px] text-zinc-500 font-sans tracking-widest mt-1 border border-zinc-800 px-2 py-0.5 rounded-full">
               {getLocationName().toUpperCase()}
            </span>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 pb-12">
        {step === 1 && renderServices()}
        {step === 2 && renderStaffSelection()} {/* Passo NOVO */}
        {step === 3 && renderDateTime()}
        {step === 4 && renderForm()}
        {step === 5 && renderSuccess()}
      </div>
    </div>
  )
}

export default Home