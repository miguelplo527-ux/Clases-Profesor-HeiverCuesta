import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { soporteService } from '../services/soporteService';
import ContadoresTickets from './ContadoresTickets';
import TicketCard from './TicketCard';
import { GRUPOS_POR_ROL, contarPorGrupo, perteneceAGrupo, proximoReinicio } from '../utils/gruposTicket';

export default function SoporteList({ perfil, recargar }) {
  const [tickets, setTickets] = useState([]);
  const [expertos, setExpertos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [grupo, setGrupo] = useState(null);
  const [reloj, setReloj] = useState(0);

  const gruposVisibles = GRUPOS_POR_ROL[perfil.rol]; // undefined para Aprendiz/Instructor

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [t, e] = await Promise.all([
        soporteService.listar(perfil),
        perfil.rol === 'Jefe' ? soporteService.expertos() : Promise.resolve([]),
      ]);
      setTickets(t); setExpertos(e);
      if (!silencioso) setError('');
    } catch (err) {
      if (!silencioso) setError(err.message || 'No se pudieron cargar los tickets.');
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useEffect(() => { cargar(); }, [cargar, recargar]);

  // Actualización en vivo: Supabase Realtime + respaldo cada 30 s
  useEffect(() => {
    const canal = supabase.channel(`tickets-${perfil.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => cargar(true))
      .subscribe();
    const intervalo = setInterval(() => cargar(true), 30000);
    return () => { supabase.removeChannel(canal); clearInterval(intervalo); };
  }, [cargar, perfil.id]);

  // Reinicio diario de los contadores a las 3:00 a. m., aunque la página siga abierta
  useEffect(() => {
    const espera = Math.max(1000, proximoReinicio().getTime() - Date.now() + 1000);
    const id = setTimeout(() => setReloj(x => x + 1), espera);
    return () => clearTimeout(id);
  }, [reloj]);

  const enviar = async (t, expertoId, diagnostico) => {
    try { setError(''); await soporteService.enviarAExperto(t, expertoId, diagnostico, perfil.id); await cargar(true); }
    catch (err) { setError(err.message); }
  };
  const finalizar = async (t, solucion) => {
    try { setError(''); await soporteService.finalizar(t, solucion, perfil.id); await cargar(true); }
    catch (err) { setError(err.message); }
  };

  const ahora = new Date();
  const conteo = contarPorGrupo(tickets, ahora);
  const visibles = grupo ? tickets.filter(t => perteneceAGrupo(t, grupo, ahora)) : tickets;

  if (cargando) return <p>Cargando tickets...</p>;

  const titulo = perfil.rol === 'Experto' ? 'Tickets asignados' : perfil.rol === 'Jefe' ? 'Todos los tickets' : 'Mis tickets';

  return (
    <section className="panel">
      {gruposVisibles && (
        <ContadoresTickets grupos={gruposVisibles} conteo={conteo} seleccionado={grupo} alSeleccionar={setGrupo} />
      )}

      <div className="section-title"><h2>{titulo}</h2></div>
      {error && <p className="error">{error}</p>}

      {!visibles.length ? (
        <p>{grupo === 'finalizados' ? 'Aún no hay tickets finalizados desde las 3:00 a. m.' : 'No hay tickets para mostrar.'}</p>
      ) : (
        <div className="ticket-grid">
          {visibles.map(t => (
            <TicketCard key={t.id} ticket={t} perfil={perfil} expertos={expertos} alEnviar={enviar} alFinalizar={finalizar} />
          ))}
        </div>
      )}
    </section>
  );
}
