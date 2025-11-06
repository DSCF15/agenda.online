import React, { useState } from 'react'
import { useServices } from '../hooks/useServices'
import { useSalonSettings } from '../hooks/useSalonSettings' // <-- Importa o hook
import ServiceCard from '../components/ServiceCard'
import BookingModal from '../components/BookingModal'
import {Sparkles, Star, MapPin, Phone, Mail, Clock, Users, Award} from 'lucide-react'

const Home = () => {
  const { services, loading } = useServices()
  const { settings, loading: settingsLoading } = useSalonSettings() // <-- Usa o hook
  const [selectedService, setSelectedService] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setIsBookingModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsBookingModalOpen(false)
    setSelectedService(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {settings?.name || 'Salão de Beleza'} {/* <-- MUDANÇA */}
            </h1>
            <p className="text-xl md:text-2xl text-white opacity-90 mb-8 max-w-3xl mx-auto">
              Transforme o seu visual com os nossos serviços de beleza premium. 
              Agende online e garanta o seu horário!
            </p>
            {/* ... botões ... */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#services"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
              >
                Ver Serviços
              </a>
              <a
                href="#contact"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all transform hover:scale-105"
              >
                Entre em Contato
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section (sem mudanças) ... */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="bg-purple-100 p-4 rounded-full w-fit mx-auto">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">500+</h3>
              <p className="text-gray-600">Clientes Satisfeitos</p>
            </div>
            <div className="space-y-2">
              <div className="bg-pink-100 p-4 rounded-full w-fit mx-auto">
                <Award className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">5+</h3>
              <p className="text-gray-600">Anos de Experiência</p>
            </div>
            <div className="space-y-2">
              <div className="bg-indigo-100 p-4 rounded-full w-fit mx-auto">
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">4.9</h3>
              <p className="text-gray-600">Avaliação Média</p>
            </div>
          </div>
        </div>
      </div>


      {/* Services Section (sem mudanças) ... */}
       <div id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossos Serviços
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Oferecemos uma ampla gama de serviços de beleza para realçar a sua beleza natural
          </p>
        </div>

        {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onSelect={handleServiceSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Serviços em breve
              </h3>
              <p className="text-gray-600">
                Estamos preparando os nossos serviços. Volte em breve!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* About Section (sem mudanças) ... */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Sobre o {settings?.name || 'Salão'} {/* <-- MUDANÇA */}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Com mais de 5 anos de experiência, o {settings?.name || 'Salão'} é referência em beleza e bem-estar. 
                Nossa equipe de profissionais qualificados está sempre pronta para oferecer o melhor atendimento.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Horário flexível de atendimento</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Profissionais certificados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Produtos de alta qualidade</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg"
                alt="Salon Interior"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-transparent opacity-20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section (Atualizado com dados do hook) */}
      <div id="contact" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Entre em Contato
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Estamos aqui para atender você. Entre em contato conosco!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="bg-purple-100 p-4 rounded-full w-fit mx-auto mb-4">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Endereço</h3>
              <p className="text-gray-600 whitespace-pre-line"> {/* Permite quebras de linha */}
                {settingsLoading ? 'Carregando...' : (settings?.address || 'Endereço não disponível')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="bg-pink-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Phone className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Telefone</h3>
              <p className="text-gray-600">
                {settingsLoading ? 'Carregando...' : (settings?.phone || 'Telefone não disponível')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="bg-indigo-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Mail className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">
                {settingsLoading ? 'Carregando...' : (settings?.email || 'Email não disponível')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        service={selectedService}
        isOpen={isBookingModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default Home