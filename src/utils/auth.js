// utils/auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifica si el usuario está autenticado usando las cookies de Astro
 * @param {Object} cookies - Objeto cookies de Astro
 * @returns {Promise<Object|null>} - Usuario autenticado o null
 */
export async function getAuthenticatedUser(cookies) {
  try {
    // Obtener tokens de las cookies
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Crear cliente de Supabase con el token
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });

    // Verificar el usuario actual
    const { data: { user }, error } = await supabaseWithAuth.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return null;
  }
}

/**
 * Establece las cookies de autenticación
 * @param {Object} cookies - Objeto cookies de Astro
 * @param {Object} session - Sesión de Supabase
 */
export function setAuthCookies(cookies, session) {
  if (session?.access_token && session?.refresh_token) {
    cookies.set('sb-access-token', session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
  }
}

/**
 * Limpia las cookies de autenticación
 * @param {Object} cookies - Objeto cookies de Astro
 */
export function clearAuthCookies(cookies) {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
}