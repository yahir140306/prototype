import { createClient } from "@supabase/supabase-js";

// Cliente con Service Role para operaciones administrativas (bypasa RLS)
export function createAdminClient() {
  // Verificar si la Service Role Key está disponible
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }

  return createClient(import.meta.env.SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
