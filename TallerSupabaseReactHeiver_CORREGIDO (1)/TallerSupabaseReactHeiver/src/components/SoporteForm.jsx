import { useEffect, useState } from 'react';
import { soporteService } from '../services/soporteService';
export default function SoporteForm({ perfil, alCrear }) {
  const [equipos,setEquipos]=useState([]); const [equipo,setEquipo]=useState(''); const [descripcion,setDescripcion]=useState(''); const [error,setError]=useState(''); const [ocupado,setOcupado]=useState(false);
  useEffect(()=>{soporteService.equipos().then(d=>{setEquipos(d);if(d[0])setEquipo(d[0].id)}).catch(e=>setError(e.message));},[]);
  const enviar=async e=>{e.preventDefault();setError('');setOcupado(true);try{await soporteService.crear({equipo_id:equipo,reportado_por:perfil.id,descripcion});setDescripcion('');await alCrear();}catch(err){setError(err.message)}finally{setOcupado(false)}};
  return <section className="panel"><h2>Reportar novedad</h2><form className="ticket-form" onSubmit={enviar}><label>Equipo<select required value={equipo} onChange={e=>setEquipo(e.target.value)}><option value="">Seleccione un equipo</option>{equipos.map(x=><option key={x.id} value={x.id}>{x.nombre} ({x.tipo}){x.salon?.nombre?` - ${x.salon.nombre}`:''}</option>)}</select></label><label>Descripción<textarea required minLength="8" value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Describa el problema del equipo"/></label>{error&&<p className="error">{error}</p>}<button disabled={ocupado||!equipos.length}>{ocupado?'Enviando...':'Crear ticket'}</button>{!equipos.length&&<small>No hay equipos registrados en la tabla equipos.</small>}</form></section>;
}
