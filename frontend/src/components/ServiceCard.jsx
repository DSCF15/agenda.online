import React from 'react'
import {Clock, DollarSign} from 'lucide-react'

// Envolvemos o componente com React.memo
const ServiceCard = React.memo(({ service, onSelect }) => {
  if (!service.active) return null

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      {/* Service Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.imageUrl || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'}
          alt={service.name}
          className="w-full h-full object-cover"
          // A GRANDE MELHORIA: Só carrega a imagem quando estiver perto do ecrã
          loading="lazy" 
          // Adicionar width e height (se souberes) ajuda o navegador a evitar "saltos" na página
          // width={400} 
          // height={192} // 192px = h-48
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {service.name}
        </h3>
        
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Service Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock size={16} className="text-purple-600" />
            <span className="text-sm">{service.duration} min</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <DollarSign size={16} className="text-pink-600" />
            <span className="text-2xl font-bold text-pink-600">
              {service.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Booking Button */}
        <button
          onClick={() => onSelect(service)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 hover:shadow-lg"
        >
          Agendar Serviço
        </button>
      </div>
    </div>
  )
}) // Fechamos o React.memo aqui

export default ServiceCard