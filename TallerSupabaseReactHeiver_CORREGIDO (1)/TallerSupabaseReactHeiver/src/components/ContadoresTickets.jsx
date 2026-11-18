import { GRUPOS } from '../utils/gruposTicket';

export default function ContadoresTickets({ grupos, conteo, seleccionado, alSeleccionar }) {
  return (
    <div className="contadores" role="group" aria-label="Resumen de tickets">
      {GRUPOS.filter(g => grupos.includes(g.clave)).map(({ clave, etiqueta }) => (
        <button
          key={clave}
          type="button"
          className={`contador ${seleccionado === clave ? 'activo' : ''}`}
          aria-pressed={seleccionado === clave}
          onClick={() => alSeleccionar(seleccionado === clave ? null : clave)}
        >
          <span className="contador-caja">{conteo[clave]}</span>
          <span className="contador-etiqueta">{etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
