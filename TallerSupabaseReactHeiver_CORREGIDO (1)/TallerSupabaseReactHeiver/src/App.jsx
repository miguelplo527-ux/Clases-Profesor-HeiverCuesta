import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Panel from './components/Panel';
import './index.css';

const TITULO = 'Proceso Solicitud Soporte';
const ETIQUETA_ROL = { Jefe: 'Jefe TIC', Experto: 'Experto / Técnico', Aprendiz: 'Aprendiz', Instructor: 'Instructor' };

function Sistema() {
  const { sesion, perfil, errorPerfil, cargando, iniciarSesion, registrar, cerrarSesion } = useAuth();
  const [vista, setVista] = useState('login');

  if (cargando) return <main className="loading">Conectando con Supabase...</main>;

  // Hay sesión pero no se pudo leer el perfil: mostrar el motivo
  if (sesion && !perfil) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h2>No se pudo cargar tu perfil</h2>
          <p className="error">{errorPerfil}</p>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </section>
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className="auth-page">
        <header className="brand">
          <h1>{TITULO}</h1>
          <p>Administración de equipos y novedades</p>
        </header>
        {vista === 'registro'
          ? <Register alRegistrar={registrar} irLogin={() => setVista('login')} />
          : <Login alIngresar={iniciarSesion} irRegistro={() => setVista('registro')} />}
      </main>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{TITULO}</h1>
          <p>{perfil.nombre} · {ETIQUETA_ROL[perfil.rol] || perfil.rol}</p>
        </div>
        <button className="secondary" onClick={cerrarSesion}>Cerrar sesión</button>
      </header>
      <main className="content">
        <Panel perfil={perfil} />
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><Sistema /></AuthProvider>;
}
