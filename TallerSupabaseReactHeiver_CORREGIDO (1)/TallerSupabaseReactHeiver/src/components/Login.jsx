import { useState } from 'react';
export default function Login({ alIngresar, irRegistro }) {
  const [correo, setCorreo] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  const enviar = async (e) => { e.preventDefault(); setError(''); setOcupado(true); try { await alIngresar(correo, password); } catch (err) { setError(err.message || 'No fue posible iniciar sesión.'); } finally { setOcupado(false); } };
  return <section className="auth-card"><h2>Iniciar sesión</h2><form onSubmit={enviar}><label>Correo<input type="email" required value={correo} onChange={e=>setCorreo(e.target.value)} /></label><label>Contraseña<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>{error && <p className="error">{error}</p>}<button disabled={ocupado}>{ocupado?'Ingresando...':'Ingresar'}</button></form><p>¿No tienes cuenta? <button className="link" onClick={irRegistro}>Regístrate</button></p></section>;
}
