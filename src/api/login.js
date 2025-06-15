import { supabase } from "../../lib/supabaseClient";

// Esto permitirá que el API handle el inicio de sesión.
export async function post({ request }) {
  const formData = await request.formData()
  const email = formData.get('email')
  const password = formData.get('password')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  
  // Aquí puedes redirigir directamente cuando el inicio de sesión sea exitoso
  return Response.redirect('/home') // Por ejemplo, ir al perfil del usuário
}
