import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import SoporteForm from './SoporteForm';
import ModuloAsignacion from './ModuloAsignacion';
import ModuloDashboard from './ModuloDashboard';
import ModuloAsignados from './ModuloAsignados';
import MisSoportes from './MisSoportes';

// Módulos que ve cada rol
const MODULOS = {
  Jefe: [
    { id: 'asignacion', titulo: 'Asignación Soportes' },
    { id: 'dashboard', titulo: 'Dashboard' },
  ],
  Experto: [
    { id: 'asignados', titulo: 'Soportes Asignados' },
    { id: 'dashboard', titulo: 'Dashboard' },
  ],
  reportador: [ // Aprendiz e Instructor
    { id: 'reportar', titulo: 'Reportar novedad' },
    { id: 'mis', titulo: 'Mis soportes' },
  ],
};

export default function Panel({ perfil }) {
  const modulos = MODULOS[perfil.rol] || MODULOS.reportador;
  const [modulo, setModulo] = useState(modulos[0].id);
  const datos = useTickets(perfil);

  // Número pendiente de atender en cada pestaña
  const insignia = { asignacion: datos.conteo.nuevos, asignados: datos.conteo.pendientes };

  if (datos.cargando) return <p className="loading">Cargando soportes...</p>;

  return (
    <>
      <nav className="tabs" role="tablist" aria-label="Módulos">
        {modulos.map(m => (
          <button
            key={m.id}
            role="tab"
            aria-selected={modulo === m.id}
            className={`tab ${modulo === m.id ? 'activa' : ''}`}
            onClick={() => setModulo(m.id)}
          >
            {m.titulo}
            {insignia[m.id] > 0 && <span className="insignia">{insignia[m.id]}</span>}
          </button>
        ))}
      </nav>

      {datos.error && <p className="error">{datos.error}</p>}

      {modulo === 'asignacion' && <ModuloAsignacion perfil={perfil} datos={datos} />}
      {modulo === 'dashboard' && <ModuloDashboard perfil={perfil} datos={datos} />}
      {modulo === 'asignados' && <ModuloAsignados perfil={perfil} datos={datos} />}
      {modulo === 'reportar' && (
        <SoporteForm perfil={perfil} alCrear={async () => { await datos.cargar(true); setModulo('mis'); }} />
      )}
      {modulo === 'mis' && <MisSoportes perfil={perfil} datos={datos} />}
    </>
  );
}
