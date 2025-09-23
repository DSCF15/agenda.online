import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    servico: "",
    profissional: "",
  });

  const handleDateClick = (info) => {
    setSelectedDate(info.date);
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.servico || !form.profissional) {
      alert("Preencha todos os campos!");
      return;
    }

    setEvents([
      ...events,
      {
        title: `${form.servico} - ${form.nome} (${form.profissional})`,
        start: selectedDate,
        allDay: false,
      },
    ]);

    setForm({ nome: "", servico: "", profissional: "" });
    setIsOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">📅 Agenda Online</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={true}
        editable={false}
        events={events}
        dateClick={handleDateClick}
        slotMinTime="09:00:00"
        slotMaxTime="18:00:00"
        locale="pt-br"
        height="80vh"
      />

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Confirmar Agendamento
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              />

              <select
                value={form.servico}
                onChange={(e) =>
                  setForm({ ...form, servico: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Selecione o serviço</option>
                <option value="Corte de cabelo">Corte de cabelo</option>
                <option value="Manicure">Manicure</option>
                <option value="Massagem">Massagem</option>
              </select>

              <select
                value={form.profissional}
                onChange={(e) =>
                  setForm({ ...form, profissional: e.target.value })
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Selecione o profissional</option>
                <option value="Ana">Ana</option>
                <option value="Carlos">Carlos</option>
                <option value="Marina">Marina</option>
              </select>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
