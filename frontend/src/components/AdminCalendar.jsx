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
// Isto é o que vai fazer o calendário ficar bonito e legível
const CustomEvent = ({ event }) => {
  return (
    <div className="flex flex-col h-full justify-center px-1">
      <div className="text-xs font-bold truncate leading-tight">
        {event.title} {/* Nome do Cliente */}
      </div>
      <div className="text-[10px] opacity-90 leading-tight mt-0.5 line-clamp-2">
        {event.resource.serviceName} {/* Nome do Serviço */}
      </div>
    </div>
  )
}

const AdminCalendar = ({ appointments, onSelectEvent }) => {
  
  const events = appointments.map(apt => {
    const startDateTime = new Date(`${apt.appointmentDate.split('T')[0]}T${apt.appointmentTime}`)
    const endDateTime = new Date(startDateTime.getTime() + (apt.serviceDuration || 30) * 60000)

    return {
      id: apt._id,
      title: apt.clientName, // Título principal é o cliente
      start: startDateTime,
      end: endDateTime,
      resource: apt,
      status: apt.status
    }
  })

  const eventStyleGetter = (event) => {
    let backgroundColor = '#8B5CF6' // Roxo (Agendado)
    if (event.status === 'confirmado') backgroundColor = '#10B981'
    if (event.status === 'cancelado') backgroundColor = '#EF4444'
    if (event.status === 'concluido') backgroundColor = '#6B7280'

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        display: 'block',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '2px' // Padding interno
      }
    }
  }

  return (
    <div className="h-[700px] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', fontFamily: 'Inter, sans-serif' }}
        culture='pt-BR'
        // Tradução dos botões
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
        // Definições visuais
        defaultView="week"
        min={new Date(0, 0, 0, 8, 0, 0)} // Começa 08:00
        max={new Date(0, 0, 0, 21, 0, 0)} // Acaba 21:00
        step={15} // Intervalos de 15 min
        timeslots={2} // 2 slots por meia hora (visual mais limpo)
        
        // AQUI ESTÁ O SEGREDO: Usar o componente customizado
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