// Las 3 tarjetas del tablero. Los estados se detectan por nombre, no por id.
export const GRUPOS = [
  { clave: 'nuevos', etiqueta: 'Nuevos' },
  { clave: 'pendientes', etiqueta: 'Pendientes' },
  { clave: 'finalizados', etiqueta: 'Finalizados' },
];

// Qué tarjetas ve cada rol. Aprendiz e Instructor no ven contadores.
export const GRUPOS_POR_ROL = {
  Jefe: ['nuevos', 'pendientes', 'finalizados'],
  Experto: ['pendientes', 'finalizados'],
};

export function grupoDeEstado(nombre = '') {
  if (/nuevo/i.test(nombre)) return 'nuevos';
  if (/cerrad|resuelt|finaliz/i.test(nombre)) return 'finalizados';
  return 'pendientes';
}

// Supabase devuelve timestamps sin zona (están en UTC). Se les agrega la Z
// para que el navegador no los interprete como hora local.
export function aFecha(valor) {
  if (!valor) return null;
  const s = String(valor);
  return new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
}

// El "día" de los contadores empieza a las 3:00 a. m. (hora del navegador)
export function inicioDiaOperativo(ahora = new Date()) {
  const inicio = new Date(ahora);
  inicio.setHours(3, 0, 0, 0);
  if (ahora < inicio) inicio.setDate(inicio.getDate() - 1);
  return inicio;
}

export function proximoReinicio(ahora = new Date()) {
  const siguiente = inicioDiaOperativo(ahora);
  siguiente.setDate(siguiente.getDate() + 1);
  return siguiente;
}

// Nuevos y Pendientes: todo lo que sigue abierto (nunca se pierde trabajo sin resolver).
// Finalizados: solo los cerrados desde las 3:00 a. m. de hoy.
export function perteneceAGrupo(ticket, grupo, ahora = new Date()) {
  if (grupoDeEstado(ticket.estado?.nombre) !== grupo) return false;
  if (grupo !== 'finalizados') return true;
  const cierre = aFecha(ticket.fecha_cierre || ticket.fecha_reporte);
  return !!cierre && cierre >= inicioDiaOperativo(ahora);
}

export function contarPorGrupo(tickets, ahora = new Date()) {
  const conteo = { nuevos: 0, pendientes: 0, finalizados: 0 };
  GRUPOS.forEach(({ clave }) => {
    conteo[clave] = tickets.filter(t => perteneceAGrupo(t, clave, ahora)).length;
  });
  return conteo;
}
