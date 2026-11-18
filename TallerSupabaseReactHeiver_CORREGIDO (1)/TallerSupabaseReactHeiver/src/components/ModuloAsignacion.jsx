import TicketCard from './TicketCard';
import { perteneceAGrupo } from '../utils/gruposTicket';

// Módulo 1 — Asignación Soportes (Jefe TIC)
export default function ModuloAsignacion({ perfil, datos }) {
  const nuevos = datos.tickets.filter(t => perteneceAGrupo(t, 'nuevos'));
  return (
    <section className="panel">
      <h2>Módulo Asignación Soportes</h2>
      <p className="ayuda">Revisa cada novedad reportada, escribe el diagnóstico y elige el experto que la solucionará.</p>
      {!nuevos.length ? <p>No hay soportes nuevos por asignar.</p> : (
        <div className="ticket-grid">
          {nuevos.map(t => (
            <TicketCard key={t.id} ticket={t} perfil={perfil} expertos={datos.expertos} alEnviar={datos.enviar} />
          ))}
        </div>
      )}
    </section>
  );
}
