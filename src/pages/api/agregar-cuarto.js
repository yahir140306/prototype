// src/pages/api/agregar-cuarto.js
import { createClient } from '../../lib/supabase';

export async function POST({ request, cookies }) {
  console.log('🔥 Middleware executing for path: /api/agregar-cuarto');
  
  try {
    const supabase = createClient({ request, cookies });
    const formData = await request.formData();
    
    const name = formData.get('name');
    const descripcion = formData.get('descripcion');
    const precio = parseFloat(formData.get('precio'));
    
    // Obtener las 3 imágenes posibles
    const imagen_1 = formData.get('imagen_1');
    const imagen_2 = formData.get('imagen_2');
    const imagen_3 = formData.get('imagen_3');

    console.log('📝 Datos recibidos:', { name, descripcion, precio });
    console.log('🖼️  Imágenes recibidas:', {
      imagen_1: imagen_1 ? `${imagen_1.name} - ${imagen_1.size} bytes` : 'No hay imagen',
      imagen_2: imagen_2 ? `${imagen_2.name} - ${imagen_2.size} bytes` : 'No hay imagen',
      imagen_3: imagen_3 ? `${imagen_3.name} - ${imagen_3.size} bytes` : 'No hay imagen'
    });

    // Validaciones básicas
    if (!name || !descripcion || !precio) {
      console.log('❌ Faltan campos obligatorios');
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Función para subir una imagen
    async function subirImagen(imagen, nombreBase) {
      if (!imagen || imagen.size === 0) return null;
      
      console.log(`✅ Subiendo ${nombreBase}: ${imagen.name} | Tamaño: ${imagen.size} bytes`);
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = imagen.name.split('.').pop();
      const fileName = `${nombreBase}_${timestamp}_${randomStr}.${extension}`;
      
      const BUCKET_NAME = 'cuartos-images';
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, imagen, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`💥 Error subiendo ${nombreBase}:`, uploadError);
          throw new Error(`Error subiendo ${nombreBase}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        console.log(`🎉 ${nombreBase} subida exitosamente:`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;

      } catch (error) {
        console.error(`💥 Error procesando ${nombreBase}:`, error);
        throw error;
      }
    }

    // Subir todas las imágenes
    let imagen_1_url = null;
    let imagen_2_url = null;
    let imagen_3_url = null;

    try {
      if (imagen_1 && imagen_1.size > 0) {
        imagen_1_url = await subirImagen(imagen_1, 'cuarto_1');
      }
      if (imagen_2 && imagen_2.size > 0) {
        imagen_2_url = await subirImagen(imagen_2, 'cuarto_2');
      }
      if (imagen_3 && imagen_3.size > 0) {
        imagen_3_url = await subirImagen(imagen_3, 'cuarto_3');
      }
    } catch (storageError) {
      return new Response(
        JSON.stringify({ 
          error: 'Error procesando imágenes', 
          details: storageError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 Guardando en base de datos con URLs:', {
      imagen_principal: imagen_1_url,
      imagen_1: imagen_1_url,
      imagen_2: imagen_2_url,
      imagen_3: imagen_3_url
    });

    // Insertar cuarto en la base de datos
    const { data: cuartoData, error: dbError } = await supabase
      .from('cuartos')
      .insert([
        {
          name,
          descripcion,
          precio,
          imagen_principal: imagen_1_url, // La primera imagen es la principal
          imagen_1: imagen_1_url,
          imagen_2: imagen_2_url,
          imagen_3: imagen_3_url,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('💥 Error insertando en BD:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Error guardando cuarto', 
          details: dbError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎉 Cuarto creado exitosamente:', cuartoData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cuarto: cuartoData,
        mensaje: 'Cuarto agregado exitosamente',
        imagenesSubidas: {
          imagen_1: !!imagen_1_url,
          imagen_2: !!imagen_2_url,
          imagen_3: !!imagen_3_url
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error general:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor', 
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}