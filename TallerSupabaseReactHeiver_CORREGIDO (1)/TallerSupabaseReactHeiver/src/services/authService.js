import { supabase } from '../api/supabaseClient';

const ROLES_REPORTADORES = ['Aprendiz', 'Instructor'];

// Convierte los errores de Supabase en mensajes claros para el usuario
const traducir = (error) => {
  const msg = (error?.message || '').toLowerCase();
  if (error?.status === 429 || msg.includes('rate limit'))
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Este correo ya está registrado.';
  if (msg.includes('invalid login credentials'))
    return 'Correo o contraseña incorrectos.';
  if (msg.includes('email not confirmed'))
    return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.';
  if (msg.includes('signups not allowed') || msg.includes('signup is disabled'))
    return 'Los registros están desactivados en Supabase (Authentication → Sign In / Providers).';
  if (msg.includes('database error'))
    return 'Error en la base de datos al crear el perfil. Ejecuta el script supabase_setup.sql.';
  if (msg.includes('password'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('email') && msg.includes('invalid'))
    return 'El correo no es válido.';
  return error?.message || 'Ocurrió un error inesperado.';
};

export const authService = {
  async registrar({ nombre, correo, password, rol }) {
    // Solo Aprendiz e Instructor pueden registrarse desde el cliente
    const rolSeguro = ROLES_REPORTADORES.includes(rol) ? rol : 'Aprendiz';
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim().toLowerCase(),
      password,
      options: { data: { nombre: nombre.trim(), rol: rolSeguro } },
    });
    if (error) throw new Error(traducir(error));
    if (!data.user) throw new Error('No se pudo crear el usuario.');
    // Con confirmación de correo activa, un correo repetido no da error sino identities vacío
    if (data.user.identities?.length === 0) throw new Error('Este correo ya está registrado.');
    return data;
  },

  async iniciarSesion(correo, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(traducir(error));
    return data;
  },

  // OJO: usuarios.id NO es el id de auth. Se enlaza por auth_user_id.
  async obtenerPerfil(authUserId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Tu cuenta existe pero no tiene perfil en la tabla usuarios. Ejecuta supabase_setup.sql.');
    return data;
  },

  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
