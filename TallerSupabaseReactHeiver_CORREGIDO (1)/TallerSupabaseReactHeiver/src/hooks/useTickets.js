import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { soporteService } from '../services/soporteService';
import { contarPorGrupo, proximoReinicio } from '../utils/gruposTicket';

// Carga los tickets del usuario y los mantiene actualizados (Realtime + respaldo cada 30 s).
export function useTickets(perfil) {
  const [tickets, setTickets] = useState([]);
  const [expertos, setExpertos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [reloj, setReloj] = useState(0);

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

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const canal = supabase.channel(`tickets-${perfil.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => cargar(true))
      .subscribe();
    const intervalo = setInterval(() => cargar(true), 30000);
    return () => { supabase.removeChannel(canal); clearInterval(intervalo); };
  }, [cargar, perfil.id]);

  // Reinicio diario del contador de Finalizados a las 3:00 a. m.
  useEffect(() => {
    const espera = Math.max(1000, proximoReinicio().getTime() - Date.now() + 1000);
    const id = setTimeout(() => setReloj(x => x + 1), espera);
    return () => clearTimeout(id);
  }, [reloj]);

  // Jefe: diagnostica y envía al experto (Nuevo -> Pendiente)
  const enviar = async (ticket, expertoId, diagnostico) => {
    try { setError(''); await soporteService.enviarAExperto(ticket, expertoId, diagnostico, perfil.id); await cargar(true); }
    catch (err) { setError(err.message); }
  };
  // Experto: termina la reparación (Pendiente -> Finalizado)
  const finalizar = async (ticket, solucion) => {
    try { setError(''); await soporteService.finalizar(ticket, solucion, perfil.id); await cargar(true); }
    catch (err) { setError(err.message); }
  };

  const ahora = new Date();
  return { tickets, expertos, error, cargando, cargar, enviar, finalizar, ahora, conteo: contarPorGrupo(tickets, ahora) };
}
