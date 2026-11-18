import TicketCard from './TicketCard';
import { perteneceAGrupo } from '../utils/gruposTicket';

// Módulo 3 — Soportes Asignados (Expertos / Técnicos)
export default function ModuloAsignados({ perfil, datos }) {
  const pendientes = datos.tickets.filter(t => perteneceAGrupo(t, 'pendientes'));
  return (
    <section className="panel">
      <h2>Soportes Asignados</h2>
      <p className="ayuda">Soportes que te envió el Jefe TIC. Cuando termines la reparación, describe la solución y márcalo como solucionado.</p>
      {!pendientes.length ? <p>No tienes soportes pendientes.</p> : (
        <div className="ticket-grid">
          {pendientes.map(t => (
            <TicketCard key={t.id} ticket={t} perfil={perfil} expertos={[]} alFinalizar={datos.finalizar} />
          ))}
        </div>
      )}
    </section>
  );
}
