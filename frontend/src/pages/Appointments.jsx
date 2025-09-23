// src/pages/Appointments.jsx
import { useState } from "react";

const horarios = [
  "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00"
];

export default function Appointments() {
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState("");

  const handleBooking = () => {
    if (!name || !selectedTime) {
      alert("Preencha seu nome e selecione um horário.");
      return;
    }
    alert(`Agendamento confirmado para ${name} às ${selectedTime}`);
    setName("");
    setSelectedTime(null);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Agendar Horário</h1>

      <input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <div className="grid grid-cols-2 gap-2 mb-4">
        {horarios.map((hora) => (
          <button
            key={hora}
            onClick={() => setSelectedTime(hora)}
            className={`p-2 rounded border ${
              selectedTime === hora ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            {hora}
          </button>
        ))}
      </div>

      <button
        onClick={handleBooking}
        className="w-full bg-green-500 text-white p-2 rounded"
      >
        Confirmar Agendamento
      </button>
    </div>
  );
}
