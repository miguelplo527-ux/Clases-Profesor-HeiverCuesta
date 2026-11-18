import { useState } from 'react';
import ContadoresTickets from './ContadoresTickets';
import TicketCard from './TicketCard';
import { GRUPOS_POR_ROL, perteneceAGrupo } from '../utils/gruposTicket';

// Módulo 2 — Dashboard (estados: Nuevo, Pendiente, Finalizado)
export default function ModuloDashboard({ perfil, datos }) {
  const [grupo, setGrupo] = useState(null);
  const grupos = GRUPOS_POR_ROL[perfil.rol] || [];
  const visibles = grupo ? datos.tickets.filter(t => perteneceAGrupo(t, grupo, datos.ahora)) : datos.tickets;
  return (
    <section className="panel">
      <h2>Módulo Dashboard</h2>
      <ContadoresTickets grupos={grupos} conteo={datos.conteo} seleccionado={grupo} alSeleccionar={setGrupo} />
      <p className="ayuda">Toca una tarjeta para filtrar la lista. Finalizados se reinicia cada día a las 3:00 a. m.</p>
      {!visibles.length ? (
        <p>{grupo === 'finalizados' ? 'Aún no hay soportes finalizados desde las 3:00 a. m.' : 'No hay soportes para mostrar.'}</p>
      ) : (
        <div className="ticket-grid">
          {visibles.map(t => <TicketCard key={t.id} ticket={t} perfil={perfil} expertos={[]} soloLectura />)}
        </div>
      )}
    </section>
  );
}
