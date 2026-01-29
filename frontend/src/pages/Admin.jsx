import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import { useServices } from '../hooks/useServices'
import { Calendar as CalIcon, Users, Settings, Plus, LogOut } from 'lucide-react'
import AdminCalendar from '../components/AdminCalendar' // <--- O novo componente
import toast from 'react-hot-toast'

const Admin = () => {
  const { user, signOut } = useAuth()
  const { appointments, updateAppointment, cancelAppointment } = useAppointments()
  const { services, deleteService, createService } = useServices() // Precisas do createService aqui

  const [activeTab, setActiveTab] = useState('calendar') // Tab padrão agora é Calendário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // (Mantém a lógica de Login e Verificação de Admin que já tínhamos...)
  // ... (Se quiseres, copia a parte do "if (!isAuthenticated)" do teu ficheiro anterior para aqui)
  
  // Função auxiliar para quando clicam num evento no calendário
  const handleEventClick = (event) => {
    const action = window.prompt(
      `Cliente: ${event.resource.clientName}\nServiço: ${event.resource.serviceName}\n\nEscreve 'cancelar' para cancelar ou 'concluir' para fechar conta.`
    )

    if (action?.toLowerCase() === 'cancelar') {
      cancelAppointment(event.id)
      toast.success('Marcação cancelada')
    } else if (action?.toLowerCase() === 'concluir') {
      updateAppointment(event.id, { status: 'concluido' })
      toast.success('Corte concluído!')
    }
  }

  // Se não estiver logado, mostra login (Copia o teu form de login anterior aqui ou usa este simplificado)
  const { isAuthenticated, signIn } = useAuth()
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={(e) => { e.preventDefault(); signIn(email, password).catch(() => toast.error('Erro login')) }} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
          <h2 className="text-xl font-bold text-center">Login Barbearia</h2>
          <input type="email" placeholder="Email" className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded">Entrar</button>
          <div className="text-xs text-center text-gray-500">Tenta: j@barbeariaj.pt / password123</div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Simples */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel {user?.name}</h1>
            <p className="text-sm text-gray-500">Barbearia J (Tenant: {user?.tenantId})</p>
          </div>
          <button onClick={signOut} className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded">
            <LogOut size={18} /> <span>Sair</span>
          </button>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex space-x-4 mb-6 border-b">
          <button onClick={() => setActiveTab('calendar')} className={`pb-2 px-4 ${activeTab === 'calendar' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500'}`}>
            <div className="flex items-center gap-2"><CalIcon size={18}/> Agenda Semanal</div>
          </button>
          <button onClick={() => setActiveTab('services')} className={`pb-2 px-4 ${activeTab === 'services' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500'}`}>
             <div className="flex items-center gap-2"><Settings size={18}/> Serviços</div>
          </button>
        </div>

        {/* --- CONTEÚDO --- */}
        
        {/* VISÃO DE CALENDÁRIO */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in">
             <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
               <p className="text-sm text-blue-700">💡 Dica: Clica numa marcação para Cancelar ou Concluir.</p>
             </div>
             <AdminCalendar 
                appointments={appointments} 
                onSelectEvent={handleEventClick} 
             />
          </div>
        )}

        {/* VISÃO DE SERVIÇOS (Lista) */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Cartão para criar novo serviço rápido (para teste) */}
             <div 
               onClick={() => createService({ name: "Novo Corte", price: 15, duration: 30, category: "Geral", active: true })}
               className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 h-40"
             >
               <div className="text-center text-gray-500">
                 <Plus className="mx-auto mb-2" />
                 Criar Serviço Rápido
               </div>
             </div>

             {services.map(service => (
               <div key={service._id} className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
                 <div>
                   <h3 className="font-bold text-lg">{service.name}</h3>
                   <p className="text-gray-500 text-sm">{service.duration} min • {service.category}</p>
                   <p className="text-purple-600 font-bold mt-2">€ {service.price}</p>
                 </div>
                 <button onClick={() => deleteService(service._id)} className="text-red-400 hover:text-red-600">Apagar</button>
               </div>
             ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Admin