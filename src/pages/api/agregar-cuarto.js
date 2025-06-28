import { createClient } from '../../lib/supabase';

export async function POST({ request, cookies }) {
  console.log('🔥 Middleware executing for path: /api/agregar-cuarto');
  
  try {
    const supabase = createClient({ request, cookies });
    
    // Add timeout handling for mobile
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 45000); // 45 seconds
    });
    
    const formDataPromise = request.formData();
    const formData = await Promise.race([formDataPromise, timeoutPromise]);
    
    const name = formData.get('name');
    const descripcion = formData.get('descripcion');
    const precio = parseFloat(formData.get('precio'));
    
    const imagen_1 = formData.get('imagen_1');
    const imagen_2 = formData.get('imagen_2');
    const imagen_3 = formData.get('imagen_3');

    console.log('📝 Datos recibidos:', { name, descripcion, precio });
    console.log('🖼️  Imágenes recibidas:', {
      imagen_1: imagen_1 ? `${imagen_1.name} - ${imagen_1.size} bytes` : 'No hay imagen',
      imagen_2: imagen_2 ? `${imagen_2.name} - ${imagen_2.size} bytes` : 'No hay imagen',
      imagen_3: imagen_3 ? `${imagen_3.name} - ${imagen_3.size} bytes` : 'No hay imagen'
    });

    // Validate required fields
    if (!name || !descripcion || !precio || isNaN(precio)) {
      console.log('❌ Faltan campos obligatorios');
      return new Response(
        JSON.stringify({ 
          error: 'Faltan campos obligatorios',
          success: false 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image sizes (5MB max for mobile compatibility)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const images = [imagen_1, imagen_2, imagen_3].filter(img => img && img.size > 0);
    
    for (const img of images) {
      if (img.size > maxSize) {
        return new Response(
          JSON.stringify({ 
            error: `La imagen ${img.name} es muy grande. Máximo 5MB.`,
            success: false 
          }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

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
            upsert: false,
            duplex: 'half' // Better for mobile uploads
          });

        if (uploadError) {
          console.error(`💥 Error subiendo ${nombreBase}:`, uploadError);
          
          // More specific error messages
          if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
            throw new Error(`La imagen ${nombreBase} es muy grande. Reduce el tamaño.`);
          } else if (uploadError.message.includes('timeout')) {
            throw new Error(`Timeout subiendo ${nombreBase}. Intenta de nuevo.`);
          } else {
            throw new Error(`Error subiendo ${nombreBase}: ${uploadError.message}`);
          }
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
      console.error('💥 Error de almacenamiento:', storageError);
      return new Response(
        JSON.stringify({ 
          error: 'Error procesando imágenes', 
          details: storageError.message,
          success: false 
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

    const { data: cuartoData, error: dbError } = await supabase
      .from('cuartos')
      .insert([
        {
          name,
          descripcion,
          precio,
          imagen_principal: imagen_1_url, 
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
          details: dbError.message,
          success: false 
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
    
    // Handle specific mobile errors
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;
    
    if (error.message === 'Request timeout') {
      errorMessage = 'La solicitud tardó demasiado. Intenta de nuevo.';
      statusCode = 408;
    } else if (error.message.includes('FormData')) {
      errorMessage = 'Error procesando los datos del formulario.';
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        success: false 
      }),
      { 
        status: statusCode, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}