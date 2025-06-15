import { supabase } from "../../lib/supabaseClient";

export async function post({ request }) {
  const formData = await request.formData()
  const nombre = formData.get('nombre')
  const apellidoPaterno = formData.get('apellido_paterno')
  const apellidoMaterno = formData.get('apellido_materno')
  const email = formData.get('email')
  const password = formData.get('password')
  const role = formData.get('role')

  // Supabase solamente espera email y password, 
  // pero podemos usar `options` para guardar el resto en `user_metadata`.
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      data: { 
        nombre, 
        apellido_paterno: apellidoPaterno, 
        apellido_materno: apellidoMaterno, 
        role 
      }
    }
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  
  // Redirigir al inicio de sesión cuando el registro sea exitoso
  return new Response(null, { 
    status: 302, 
    headers: { Location: "/iniciar" } 
  })
}
