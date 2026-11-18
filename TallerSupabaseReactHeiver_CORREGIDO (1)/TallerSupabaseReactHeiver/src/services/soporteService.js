import { supabase } from '../api/supabaseClient';
import { grupoDeEstado } from '../utils/gruposTicket';

export const soporteService = {
  async listar(perfil) {
    let query = supabase.from('tickets').select(`*, equipo:equipos(id,nombre,tipo,salon:salones(nombre)), reportador:usuarios!tickets_reportado_por_fkey(nombre,correo), asignado:usuarios!tickets_asignado_a_fkey(nombre), estado:estados_ticket(id,nombre)`).order('fecha_reporte', { ascending: false });
    if (perfil.rol === 'Aprendiz' || perfil.rol === 'Instructor') query = query.eq('reportado_por', perfil.id);
    if (perfil.rol === 'Experto') query = query.eq('asignado_a', perfil.id);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async equipos() {
    const { data, error } = await supabase.from('equipos').select('id,nombre,tipo,salon:salones(nombre)').order('nombre');
    if (error) throw error;
    return data || [];
  },
  async expertos() {
    const { data, error } = await supabase.from('usuarios').select('id,nombre,correo').eq('rol', 'Experto').order('nombre');
    if (error) throw error;
    return data || [];
  },
  async estados() {
    const { data, error } = await supabase.from('estados_ticket').select('id,nombre').order('id');
    if (error) throw error;
    return data || [];
  },
  // Busca el estado que corresponde a cada etapa del flujo (nuevos / pendientes / finalizados)
  async estadoDeGrupo(grupo) {
    const { data, error } = await supabase.from('estados_ticket').select('id,nombre').order('id');
    if (error) throw error;
    const preferido = { nuevos: 'Nuevo', pendientes: 'Pendiente', finalizados: 'Finalizado' }[grupo];
    const candidatos = (data || []).filter(e => grupoDeEstado(e.nombre) === grupo);
    const estado = candidatos.find(e => e.nombre === preferido) || candidatos[0];
    if (!estado) throw new Error(`Falta el estado "${preferido}" en estados_ticket. Ejecuta supabase_actualizacion.sql.`);
    return estado;
  },
  // 1) Aprendiz/Instructor reporta -> el ticket nace en "Nuevo"
  async crear({ equipo_id, reportado_por, descripcion }) {
    const estado = await this.estadoDeGrupo('nuevos');
    const { error } = await supabase.from('tickets').insert({ equipo_id, reportado_por, estado_id: estado.id, descripcion });
    if (error) throw error;
  },
  // 2) El Jefe diagnostica y elige al experto -> pasa a "Pendiente"
  async enviarAExperto(ticket, expertoId, diagnostico, jefeId) {
    const estado = await this.estadoDeGrupo('pendientes');
    const { error } = await supabase.from('tickets')
      .update({ asignado_a: expertoId, jefe_id: jefeId, diagnostico, estado_id: estado.id })
      .eq('id', ticket.id);
    if (error) throw error;
    await this.registrarCambio(ticket, ticket.estado_id, estado.id, jefeId, 'Diagnóstico realizado y enviado al experto');
  },
  // 3) El Experto termina la reparación -> pasa a "Finalizado"
  async finalizar(ticket, solucion, expertoId) {
    const estado = await this.estadoDeGrupo('finalizados');
    const { error } = await supabase.from('tickets')
      .update({ solucion, estado_id: estado.id, fecha_cierre: new Date().toISOString() })
      .eq('id', ticket.id);
    if (error) throw error;
    await this.registrarCambio(ticket, ticket.estado_id, estado.id, expertoId, 'Equipo reparado');
  },
  async registrarCambio(ticket, anterior, nuevo, usuarioId, observacion) {
    const { error } = await supabase.from('historial_tickets').insert({ ticket_id: ticket.id, usuario_id: usuarioId, estado_anterior: anterior, estado_nuevo: nuevo, observacion });
    if (error) throw error;
  }
};
