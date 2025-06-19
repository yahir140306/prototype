// import { createClient } from "../../lib/supabase";

// // Esto se llama cuando reciben un "POST"
// export async function post({ request }) {
//   const formData = await request.formData();

//   const nombre = formData.get("nombre");
//   const descripcion = formData.get("descripcion");
//   const precio = formData.get("precio");

//   // Supabase
//   const supabase = createClient({});
//   const { data, error } = await supabase.from("cuartos").insert([
//     { name: nombre, descripcion, precio }
//   ]);

//   if (error) {
//     return new Response(JSON.stringify({ error: error.message }), { status: 400 });
//   }
  
//   return new Response(JSON.stringify({ message: "Cuarto agregado con éxito!" }), { status: 200 });
// }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import { createClient } from '../../lib/supabase';

// export async function POST({ request, cookies }) {
//   try {
//     // Usar tu cliente normal (ahora funcionará con las políticas RLS)
//     const supabase = createClient({ request, cookies });
    
//     // Obtener los datos del formulario
//     const formData = await request.formData();
    
//     // Extraer los campos necesarios
//     const cuartoData = {
//       name: formData.get('name'),
//       descripcion: formData.get('descripcion'),
//       precio: parseFloat(formData.get('precio')),
//       imagen_1: formData.get('imagen_1'),
//     };

//     // Validación básica
//     if (!cuartoData.name || !cuartoData.descripcion || !cuartoData.precio) {
//       return new Response(JSON.stringify({ 
//         success: false, 
//         error: 'Faltan campos requeridos' 
//       }), {
//         status: 400,
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
//     }

//     console.log('Intentando insertar:', cuartoData);

//     // Insertar en Supabase
//     const { data, error } = await supabase
//       .from('cuartos')
//       .insert([cuartoData])
//       .select();

//     if (error) {
//       console.error('Error de Supabase:', error);
//       return new Response(JSON.stringify({ 
//         success: false, 
//         error: error.message 
//       }), {
//         status: 400,
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
//     }

//     console.log('Cuarto insertado exitosamente:', data);

//     return new Response(JSON.stringify({ 
//       success: true, 
//       data: data[0],
//       message: 'Cuarto agregado con éxito'
//     }), {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//   } catch (error) {
//     console.error('Error general:', error);
//     return new Response(JSON.stringify({ 
//       success: false, 
//       error: 'Error interno del servidor' 
//     }), {
//       status: 500,
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
//   }
// }


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// src/pages/api/agregar-cuarto.js
import { createClient } from '../../lib/supabase';

export async function POST({ request, cookies }) {
  try {
    const supabase = createClient({ request, cookies });
    
    // Obtener los datos del formulario
    const formData = await request.formData();
    
    // Extraer la imagen
    const imageFile = formData.get('imagen_1');
    let imageUrl = null;

    // Subir imagen a Supabase Storage si existe
    if (imageFile && imageFile.size > 0) {
      console.log('Subiendo imagen:', imageFile.name, 'Tamaño:', imageFile.size);
      
      // Generar nombre único para la imagen
      const timestamp = Date.now();
      const fileName = `cuarto_${timestamp}_${imageFile.name}`;
      
      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cuartos-images') // Nombre del bucket que crearemos
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Error subiendo imagen: ' + uploadError.message 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from('cuartos-images')
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
      console.log('Imagen subida exitosamente:', imageUrl);
    }

    // Extraer los otros campos
    const cuartoData = {
      name: formData.get('name'),
      descripcion: formData.get('descripcion'),
      precio: parseFloat(formData.get('precio')),
      imagen_1: imageUrl, // Ahora guardamos la URL, no el File
    };

    // Validación básica
    if (!cuartoData.name || !cuartoData.descripcion || !cuartoData.precio) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Intentando insertar:', cuartoData);

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('cuartos')
      .insert([cuartoData])
      .select();

    if (error) {
      console.error('Error de Supabase:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Cuarto insertado exitosamente:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      data: data[0],
      message: 'Cuarto agregado con éxito'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error general:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno del servidor: ' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}