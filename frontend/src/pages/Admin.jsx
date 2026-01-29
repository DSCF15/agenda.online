import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import { useServices } from '../hooks/useServices'
import { Calendar as CalIcon, Settings, LogOut, RefreshCw } from 'lucide-react'
import AdminCalendar from '../components/AdminCalendar'
import toast from 'react-hot-toast'

const Admin = () => {
  const { user, signOut } = useAuth()
  const { appointments, fetchAppointments, loading } = useAppointments() // Precisamos do fetchAppointments
  const { services, deleteService, createService } = useServices()

  const [activeTab, setActiveTab] = useState('calendar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // --- LOGIN ---
  const { isAuthenticated, signIn } = useAuth()
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <form onSubmit={(e) => { e.preventDefault(); signIn(email, password).catch(() => toast.error('Erro login')) }} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
          <h2 className="text-xl font-bold text-center text-black">Login Barbearia</h2>
          <input type="email" placeholder="Email" className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-yellow-500 text-black font-bold p-2 rounded hover:bg-yellow-400">Entrar</button>
          <div className="text-xs text-center text-gray-500">jc@barbearia.pt / password123</div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel {user?.name}</h1>
            <p className="text-sm text-gray-500">Barbearia: {user?.tenantId}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAppointments} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100">
              <RefreshCw size={18} /> Atualizar
            </button>
            <button onClick={signOut} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button onClick={() => setActiveTab('calendar')} className={`pb-2 px-4 ${activeTab === 'calendar' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500'}`}>
            <div className="flex items-center gap-2"><CalIcon size={18}/> Agenda</div>
          </button>
          <button onClick={() => setActiveTab('services')} className={`pb-2 px-4 ${activeTab === 'services' ? 'border-b-2 border-purple-600 text-purple-600 font-bold' : 'text-gray-500'}`}>
             <div className="flex items-center gap-2"><Settings size={18}/> Serviços</div>
          </button>
        </div>

        {/* --- CALENDÁRIO --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-8">
             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
               <p className="text-sm text-yellow-800">
                 ⚠️ <b>Atenção:</b> Se marcaste para a próxima semana, clica em <b>"Próximo"</b> no calendário.
               </p>
             </div>
             
             {/* O Calendário */}
             <AdminCalendar appointments={appointments} />

             {/* --- LISTA DE DIAGNÓSTICO (DEBUG) --- */}
             <div className="mt-10 p-6 bg-black text-green-400 rounded-xl font-mono text-sm shadow-2xl overflow-hidden">
               <h3 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2">Diagnóstico de Dados (Raw Data)</h3>
               <p className="mb-2">Total de marcações encontradas na base de dados: <span className="text-white font-bold text-xl">{appointments.length}</span></p>
               
               {appointments.length === 0 ? (
                 <p className="text-red-400">Nenhuma marcação encontrada. Verifica se criaste a marcação depois de corrigir o código.</p>
               ) : (
                 <div className="grid gap-2 max-h-60 overflow-y-auto">
                   {appointments.map((apt, i) => (
                     <div key={apt._id} className="border border-green-900 p-2 rounded bg-green-900/10">
                       <span className="text-gray-400">#{i+1}</span> | 
                       <span className="text-yellow-300 ml-2">{apt.appointmentDate}</span> às 
                       <span className="text-yellow-300 ml-1">{apt.appointmentTime}</span> | 
                       Cli: <span className="text-white">{apt.clientName}</span> | 
                       Serv: {apt.serviceName} | 
                       Status: {apt.status}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {/* --- SERVIÇOS --- */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div onClick={() => createService({ name: "Serviço Teste", price: 10, duration: 30, category: "Geral", active: true })} className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 h-40">
               Criar Serviço Rápido
             </div>
             {services.map(service => (
               <div key={service._id} className="bg-white p-6 rounded-lg shadow">
                 <h3 className="font-bold">{service.name}</h3>
                 <p className="text-purple-600 font-bold mt-2">€ {service.price}</p>
                 <button onClick={() => deleteService(service._id)} className="text-red-400 text-sm mt-2">Apagar</button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin