
import React from 'react'
import {Clock, DollarSign} from 'lucide-react'
import { useTenant } from '../hooks/useTenant'

const TenantServiceCard = ({ service, onSelect }) => {
  const { tenant } = useTenant()

  if (!service.active) return null

  const primaryColor = tenant?.branding?.primaryColor || '#8B5CF6'
  const secondaryColor = tenant?.branding?.secondaryColor || '#EC4899'

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      {/* Imagem do Serviço */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.imageUrl || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'}
          alt={service.name}
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
          style={{
            background: `linear-gradient(to top, ${primaryColor}20 0%, transparent 100%)`
          }}
        />
        
        {/* Badge da Categoria */}
        <div className="absolute top-3 left-3">
          <span 
            className="px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
          </span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {service.name}
        </h3>
        
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Informações do Serviço */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock size={16} style={{ color: primaryColor }} />
            <span className="text-sm">{service.duration} min</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <DollarSign size={16} style={{ color: secondaryColor }} />
            <span 
              className="text-2xl font-bold"
              style={{ color: secondaryColor }}
            >
              {service.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botão de Agendamento */}
        <button
          onClick={() => onSelect(service)}
          className="w-full text-white py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        >
          Agendar Serviço
        </button>
      </div>
    </div>
  )
}

export default TenantServiceCard
