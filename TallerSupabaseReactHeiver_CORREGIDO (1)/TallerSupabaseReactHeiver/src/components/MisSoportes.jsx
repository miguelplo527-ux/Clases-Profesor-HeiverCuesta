import TicketCard from './TicketCard';

// Aprendiz / Instructor: solo consultan el estado de lo que reportaron
export default function MisSoportes({ perfil, datos }) {
  return (
    <section className="panel">
      <h2>Mis soportes</h2>
      {!datos.tickets.length ? <p>Aún no has reportado novedades.</p> : (
        <div className="ticket-grid">
          {datos.tickets.map(t => <TicketCard key={t.id} ticket={t} perfil={perfil} expertos={[]} soloLectura />)}
        </div>
      )}
    </section>
  );
}
