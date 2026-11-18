import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargar = async (session) => {
      if (!session?.user) {
        if (!activo) return;
        setSesion(null); setPerfil(null); setErrorPerfil(''); setCargando(false);
        return;
      }
      try {
        const p = await authService.obtenerPerfil(session.user.id);
        if (!activo) return;
        setPerfil(p); setErrorPerfil('');
      } catch (err) {
        if (!activo) return;
        setPerfil(null);
        setErrorPerfil(err.message || 'No se pudo cargar tu perfil.');
      }
      if (!activo) return;
      setSesion(session);
      setCargando(false);
    };

    supabase.auth.getSession().then(({ data }) => cargar(data.session));

    // setTimeout evita bloquear el cliente de Supabase dentro del callback
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => cargar(session), 0);
    });

    return () => { activo = false; listener.subscription.unsubscribe(); };
  }, []);

  // El listener onAuthStateChange actualiza sesion y perfil solo
  const value = {
    sesion, perfil, errorPerfil, cargando,
    registrar: authService.registrar,
    iniciarSesion: authService.iniciarSesion,
    cerrarSesion: async () => {
      await authService.cerrarSesion();
      setSesion(null); setPerfil(null); setErrorPerfil('');
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
