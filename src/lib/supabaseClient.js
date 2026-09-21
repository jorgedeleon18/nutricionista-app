import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Esto solo debería pasar si falta configurar el .env (o las variables de
  // entorno en Netlify). La app sigue mockeada hasta que esto esté resuelto.
  console.warn('[Supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(url, anonKey);
