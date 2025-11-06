import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppointments } from '../hooks/useAppointments'
import { useServices } from '../hooks/useServices'
import {Calendar, Users, Settings, Plus, Edit, Trash2, Eye} from 'lucide-react'

const Admin = () => {
  const { user, isAuthenticated } = useAuth()
  // Usa o 'cancelAppointment' do hook
  const { appointments, loading: appointmentsLoading, updateAppointment, cancelAppointment } = useAppointments()
  const { services, loading: servicesLoading, createService, updateService, deleteService } = useServices()
  const [activeTab, setActiveTab] = useState('appointments')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ... (verificação de admin está igual) ...
  if (!isAuthenticated || user?.userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa ser um administrador para acessar esta página.</p>
        </div>
      </div>
    )
  }


  const handleAppointmentStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Atualizado para usar a nova função
  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await cancelAppointment(appointmentId) // <-- MUDANÇA AQUI
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
      }
    }
  }
  
  // ... (getStatusColor e tabs estão iguais) ...
    const getStatusColor = (status) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800'
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'concluido': return 'bg-purple-100 text-purple-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'appointments', name: 'Agendamentos', icon: Calendar },
    { id: 'services', name: 'Serviços', icon: Settings },
    { id: 'customers', name: 'Clientes', icon: Users }
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (sem mudanças) ... */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie agendamentos, serviços e clientes</p>
        </div>

        {/* Tabs (sem mudanças) ... */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Agendamentos</h2>
            </div>

            {appointmentsLoading ? (
              // ... (loading spinner) ...
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <li key={appointment._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        {/* ... (detalhes do agendamento) ... */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium text-gray-900">
                              {appointment.clientName}
                            </p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <strong>Serviço:</strong> {appointment.serviceName}
                            </div>
                            <div>
                              <strong>Data:</strong> {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <strong>Horário:</strong> {appointment.appointmentTime}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <strong>Telefone:</strong> {appointment.clientPhone}
                            </div>
                            <div>
                              <strong>Email:</strong> {appointment.clientEmail}
                            </div>
                          </div>
                          {appointment.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Observações:</strong> {appointment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {/* ... (botões de status) ... */}
                          {appointment.status === 'agendado' && (
                            <button
                              onClick={() => handleAppointmentStatusChange(appointment._id, 'confirmado')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Confirmar
                            </button>
                          )}
                          {appointment.status === 'confirmado' && (
                            <button
                              onClick={() => handleAppointmentStatusChange(appointment._id, 'concluido')}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                            >
                              Concluir
                            </button>
                          )}

                          {/* Botão de Cancelar atualizado */}
                          {appointment.status !== 'cancelado' && appointment.status !== 'concluido' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment._id)} // <-- MUDANÇA AQUI
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {appointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum agendamento encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Services Tab (sem mudanças) ... */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Serviços</h2>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                <Plus size={20} />
                <span>Novo Serviço</span>
              </button>
            </div>

            {servicesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-purple-600">
                          <Edit size={16} />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Categoria:</span>
                        <span className="font-medium">{service.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duração:</span>
                        <span className="font-medium">{service.duration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Preço:</span>
                        <span className="font-medium text-purple-600">R$ {service.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${service.active ? 'text-green-600' : 'text-red-600'}`}>
                          {service.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Customers Tab (sem mudanças) ... */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Clientes</h2>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestão de Clientes
              </h3>
              <p className="text-gray-600">
                Esta funcionalidade estará disponível em breve.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin