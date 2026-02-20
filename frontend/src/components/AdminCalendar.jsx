import React from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

// --- COMPONENTE PERSONALIZADO PARA O EVENTO ---
const CustomEvent = ({ event }) => {
  return (
    <div className="flex flex-col h-full justify-center px-1">
      <div className="text-xs font-bold truncate leading-tight text-white">
        {event.title}
      </div>
      <div className="text-[10px] opacity-90 leading-tight mt-0.5 line-clamp-2 text-white">
        {event.resource.serviceName}
      </div>
      {/* Mostra o nome do barbeiro se for vista de Gerente com vários barbeiros misturados */}
      {event.resource.staffName && (
        <div className="text-[9px] opacity-75 mt-0.5 italic text-white truncate">
          ✂ {event.resource.staffName}
        </div>
      )}
    </div>
  )
}

const AdminCalendar = ({ appointments, onSelectEvent }) => {
  
  const events = appointments.map(apt => {
    const startDateTime = new Date(`${apt.appointmentDate.split('T')[0]}T${apt.appointmentTime}`)
    const endDateTime = new Date(startDateTime.getTime() + (apt.serviceDuration || 30) * 60000)

    return {
      id: apt._id,
      title: apt.clientName,
      start: startDateTime,
      end: endDateTime,
      resource: apt,
      status: apt.status
    }
  })

  // Estilos das caixas de marcação
  const eventStyleGetter = (event) => {
    // Cores mais vivas para contrastar no fundo branco
    let backgroundColor = '#3B82F6' // Azul (Agendado padrão)
    if (event.status === 'confirmed') backgroundColor = '#10B981' // Verde (Confirmado)
    if (event.status === 'pending_email') backgroundColor = '#F59E0B' // Laranja (Pendente)
    if (event.status === 'cancelled') backgroundColor = '#EF4444' // Vermelho (Cancelado)

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        padding: '3px'
      }
    }
  }

  return (
    // Removido o bg-white daqui porque o container principal já vai ter a cor base
    <div className="h-full w-full"> 
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', fontFamily: 'Inter, sans-serif' }}
        culture='pt-BR'
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Lista",
          date: "Data",
          time: "Hora",
          event: "Marcação"
        }}
        defaultView="week"
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 21, 0, 0)}
        step={15}
        timeslots={2}
        components={{
          event: CustomEvent
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
      />
    </div>
  )
}

export default AdminCalendar