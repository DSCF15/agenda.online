import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import { useServices } from '../hooks/useServices'
import { Calendar as CalIcon, Settings, LogOut, RefreshCw, Scissors, TrendingUp, DollarSign, Users, Plus, Edit, Trash2, X } from 'lucide-react'
import AdminCalendar from '../components/AdminCalendar'
import toast from 'react-hot-toast'
import '../CalendarDark.css'

const Admin = () => {
  const { user, signOut, isAuthenticated, signIn } = useAuth()
  const { appointments, fetchAppointments } = useAppointments()
  const { services, deleteService, createService, updateService, fetchServices } = useServices()
  
  // Estado das Métricas
  const [metrics, setMetrics] = useState(null)
  const [activeTab, setActiveTab] = useState('calendar')

  // Estados do Modal de Serviço (Só para Admin)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '', duration: 30, description: '' })

  // Estados de Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // --- 1. CARREGAR DADOS ---
  useEffect(() => {
    if (user && user.tenantId) {
      console.log("📥 Admin a carregar dados para:", user.tenantId)
      fetchAppointments(user.tenantId)
      
      // Se for Gerente (Admin), carrega métricas e serviços
      if (user.role === 'admin') {
        fetchServices(user.tenantId)
        fetchMetrics()
      }
    }
  }, [user, fetchAppointments, fetchServices])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: { 'x-tenant': user.tenantId }
      })
      const data = await res.json()
      if (data.success) setMetrics(data.data)
    } catch (e) { console.error(e) }
  }

  // --- 2. FILTRAR AGENDA ---
  const getFilteredAppointments = () => {
    if (!user) return []
    if (user.role === 'admin') {
      return appointments // Gerente vê tudo
    }
    // Barbeiro vê apenas os seus
    // Filtra pelo ID do staff ou pelo nome (fallback)
    return appointments.filter(apt => apt.staffId === user._id || apt.staffName === user.name) 
  }

  // --- FUNÇÕES DE SERVIÇOS ---
  const handleOpenCreate = () => {
    setEditingService(null)
    setFormData({ name: '', price: '', duration: 30, description: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service) => {
    setEditingService(service)
    setFormData({ 
      name: service.name, 
      price: service.price, 
      duration: service.duration, 
      description: service.description || '' 
    })
    setIsModalOpen(true)
  }

  const handleSaveService = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: 'Geral', 
        active: true,
        tenantId: user.tenantId 
      }

      if (editingService) {
        await updateService(editingService._id, payload)
        toast.success('Serviço atualizado!')
      } else {
        await createService(payload)
        toast.success('Serviço criado!')
      }
      setIsModalOpen(false)
      fetchServices(user.tenantId)
    } catch (error) {
      toast.error('Erro ao guardar')
    }
  }

  // --- RENDER MÉTRICAS (SÓ ADMIN) ---
  const renderMetrics = () => {
    if (!metrics) return <div className="text-zinc-500 mb-8">A carregar métricas...</div>
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
        {/* HOJE */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Hoje</p>
               <h3 className="text-2xl font-bold text-white">{metrics.today?.revenue || 0} €</h3>
             </div>
             <div className="bg-green-500/10 p-2 rounded text-green-500"><TrendingUp size={20}/></div>
           </div>
           <p className="text-zinc-400 text-sm mt-2">{metrics.today?.count || 0} cortes</p>
        </div>

        {/* SEMANA */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Esta Semana</p>
               <h3 className="text-2xl font-bold text-white">{metrics.week?.revenue || 0} €</h3>
             </div>
             <div className="bg-blue-500/10 p-2 rounded text-blue-500"><DollarSign size={20}/></div>
           </div>
           <p className="text-zinc-400 text-sm mt-2">{metrics.week?.count || 0} cortes</p>
        </div>

        {/* TOP SERVIÇO */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Top Serviço</p>
               <h3 className="text-xl font-bold text-white truncate max-w-[150px]">{metrics.topServices?.[0]?.name || '-'}</h3>
             </div>
             <div className="bg-yellow-500/10 p-2 rounded text-yellow-500"><Scissors size={20}/></div>
           </div>
           <p className="text-zinc-400 text-sm mt-2">
             {metrics.topServices?.[0]?.count || 0} realizados
           </p>
        </div>
      </div>
    )
  }

  // --- TELA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <form onSubmit={(e) => { e.preventDefault(); signIn(email, password) }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500 mb-4 border border-yellow-500/20">
            <Scissors size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Barbearia J</h2>
          <div className="space-y-4 text-left">
            <input type="email" placeholder="Email" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-white focus:border-yellow-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-white focus:border-yellow-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-yellow-500 text-black font-bold p-3 rounded-lg hover:bg-yellow-400 transition-transform active:scale-95 uppercase tracking-wider">Entrar</button>
        </form>
      </div>
    )
  }

  // --- TELA ADMIN ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800/50 shadow-xl">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
              <Scissors size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                {user.role === 'admin' ? 'Painel de Gerência' : `Agenda: ${user.name}`}
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">{user.tenantId}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { fetchAppointments(user.tenantId); if(user.role==='admin') fetchMetrics(); toast.success('Atualizado!') }} 
              className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg hover:text-white hover:bg-zinc-700 transition-all border border-zinc-700 font-medium text-sm">
              <RefreshCw size={18} /> <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button onClick={signOut} className="flex items-center gap-2 text-red-400 hover:bg-red-950/30 px-4 py-2 rounded-lg border border-transparent hover:border-red-900/30 transition-all font-medium text-sm">
              <LogOut size={18} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* DASHBOARD (SÓ ADMIN) */}
        {user.role === 'admin' && renderMetrics()}

        {/* TABS DE NAVEGAÇÃO */}
        <div className="flex gap-8 mb-6 border-b border-zinc-800 overflow-x-auto">
          <button onClick={() => setActiveTab('calendar')} 
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'calendar' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <div className="flex items-center gap-2"><CalIcon size={18}/> Agenda {user.role === 'admin' ? 'Geral' : 'Pessoal'}</div>
            {activeTab === 'calendar' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>}
          </button>
          
          {user.role === 'admin' && (
            <button onClick={() => setActiveTab('services')} 
              className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'services' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <div className="flex items-center gap-2"><Settings size={18}/> Configurar Serviços</div>
              {activeTab === 'services' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>}
            </button>
          )}
        </div>

        {/* CONTEÚDO: CALENDÁRIO */}
        {activeTab === 'calendar' && (
           <div className="animate-fade-in bg-zinc-900 p-4 md:p-6 rounded-2xl border border-zinc-800 shadow-2xl min-h-[600px]">
             {/* Passamos apenas os agendamentos filtrados para o calendário */}
             <AdminCalendar appointments={getFilteredAppointments()} />
           </div>
        )}

        {/* CONTEÚDO: SERVIÇOS (SÓ ADMIN) */}
        {activeTab === 'services' && user.role === 'admin' && (
           <div className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <button onClick={handleOpenCreate} className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-zinc-900 transition-all h-60 group">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-yellow-500 group-hover:text-black transition-colors shadow-lg">
                    <Plus size={24} />
                  </div>
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest group-hover:text-white">Novo Serviço</span>
                </button>

                {services.map(service => (
                  <div key={service._id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg hover:border-zinc-600 hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-60">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center text-yellow-500 font-bold border border-zinc-800">
                          {service.name.charAt(0)}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(service)} className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 transition-colors"><Edit size={16}/></button>
                          <button onClick={() => deleteService(service._id)} className="p-2 hover:bg-zinc-800 rounded-lg text-red-400 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2">{service.name}</h3>
                      <p className="text-zinc-500 text-xs line-clamp-2">{service.description || 'Sem descrição'}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2 py-1 rounded">{service.duration} min</span>
                      <span className="text-xl font-bold text-yellow-500">{service.price} €</span>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* MODAL DE SERVIÇOS */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveService} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome do Serviço</label>
                  <input required type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Preço (€)</label>
                    <input required type="number" step="0.01" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                      value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Duração (min)</label>
                    <input required type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
                      value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Descrição (Opcional)</label>
                  <textarea rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-yellow-500 outline-none resize-none"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 mt-2 uppercase tracking-wide">
                  {editingService ? 'Guardar Alterações' : 'Criar Serviço'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin