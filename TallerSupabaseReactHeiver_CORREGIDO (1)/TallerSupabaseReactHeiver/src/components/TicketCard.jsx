import { useState } from 'react';
import { aFecha, grupoDeEstado } from '../utils/gruposTicket';

const formatear = (v) => { const d = aFecha(v); return d ? d.toLocaleString() : ''; };

export default function TicketCard({ ticket: t, perfil, expertos, alEnviar, alFinalizar, soloLectura = false }) {
  const [diagnostico, setDiagnostico] = useState('');
  const [experto, setExperto] = useState('');
  const [solucion, setSolucion] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const grupo = grupoDeEstado(t.estado?.nombre);
  const esJefe = perfil.rol === 'Jefe';
  const esExperto = perfil.rol === 'Experto';

  const ejecutar = (accion) => async (e) => {
    e.preventDefault();
    setOcupado(true);
    try { await accion(); } finally { setOcupado(false); }
  };

  return (
    <article className="ticket">
      <div className="ticket-top">
        <strong>Ticket #{t.id.slice(0, 8)}</strong>
        <span className={`status status-${grupo}`}>{t.estado?.nombre || 'Sin estado'}</span>
      </div>
      <p><b>Equipo:</b> {t.equipo?.nombre || 'No disponible'} ({t.equipo?.tipo || ''})</p>
      <p><b>Salón:</b> {t.equipo?.salon?.nombre || 'No indicado'}</p>
      <p><b>Reportado por:</b> {t.reportador?.nombre || 'Usuario'}</p>
      <p><b>Descripción:</b> {t.descripcion}</p>
      {t.asignado?.nombre && <p><b>Experto:</b> {t.asignado.nombre}</p>}
      {t.diagnostico && <p><b>Diagnóstico:</b> {t.diagnostico}</p>}
      {t.solucion && <p><b>Solución:</b> {t.solucion}</p>}
      <small>Reportado: {formatear(t.fecha_reporte)}</small>
      {t.fecha_cierre && <small> · Finalizado: {formatear(t.fecha_cierre)}</small>}

      {/* Jefe: diagnostica y elige al experto */}
      {!soloLectura && esJefe && grupo === 'nuevos' && (
        <form className="ticket-accion" onSubmit={ejecutar(() => alEnviar(t, experto, diagnostico.trim()))}>
          <label>Diagnóstico
            <textarea required minLength="5" value={diagnostico} onChange={e => setDiagnostico(e.target.value)} placeholder="¿Cuál es el problema del equipo?" />
          </label>
          <label>Experto que lo solucionará
            <select required value={experto} onChange={e => setExperto(e.target.value)}>
              <option value="">Seleccione un experto</option>
              {expertos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </label>
          <button disabled={ocupado || !expertos.length}>{ocupado ? 'Enviando...' : 'Enviar al experto'}</button>
          {!expertos.length && <small>No hay usuarios con rol Experto.</small>}
        </form>
      )}

      {/* Experto: marca el equipo como reparado */}
      {!soloLectura && esExperto && grupo === 'pendientes' && (
        <form className="ticket-accion" onSubmit={ejecutar(() => alFinalizar(t, solucion.trim()))}>
          <label>Solución aplicada
            <textarea required minLength="5" value={solucion} onChange={e => setSolucion(e.target.value)} placeholder="¿Qué se hizo para arreglar el equipo?" />
          </label>
          <button disabled={ocupado}>{ocupado ? 'Guardando...' : 'Marcar como solucionado'}</button>
        </form>
      )}
    </article>
  );
}
