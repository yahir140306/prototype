import { createClient } from '../../../../lib/supabase';

// GET - Obtener comentarios de un cuarto
export async function GET({ params, request, cookies }) {
  console.log('📝 GET comentarios del cuarto:', params.id);
  
  try {
    const supabase = createClient({ request, cookies });
    const cuartoId = params.id;

    // Obtener comentarios con información del usuario
    const { data: comentarios, error } = await supabase
      .from('comentarios')
      .select(`
        *,
        usuarios:user_id (
          email
        )
      `)
      .eq('cuarto_id', cuartoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo comentarios:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error obteniendo comentarios',
          success: false 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calcular estadísticas
    const totalComentarios = comentarios?.length || 0;
    const promedioCalificacion = totalComentarios > 0 
      ? comentarios.reduce((sum, c) => sum + c.calificacion, 0) / totalComentarios 
      : 0;

    console.log(`✅ ${totalComentarios} comentarios obtenidos, promedio: ${promedioCalificacion.toFixed(1)}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        comentarios: comentarios || [],
        estadisticas: {
          total: totalComentarios,
          promedio: Math.round(promedioCalificacion * 10) / 10 // Redondear a 1 decimal
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error general obteniendo comentarios:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// POST - Agregar nuevo comentario
export async function POST({ params, request, cookies }) {
  console.log('📝 POST nuevo comentario para cuarto:', params.id);
  
  try {
    const supabase = createClient({ request, cookies });
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Debes iniciar sesión para comentar',
          success: false 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cuartoId = params.id;
    const formData = await request.formData();
    
    const comentario = formData.get('comentario')?.trim();
    const calificacion = parseInt(formData.get('calificacion'));

    console.log('📝 Datos del comentario:', { comentario, calificacion, userId: user.id });

    // Validaciones
    if (!comentario || comentario.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'El comentario debe tener al menos 10 caracteres',
          success: false 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return new Response(
        JSON.stringify({ 
          error: 'La calificación debe ser entre 1 y 5 estrellas',
          success: false 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el cuarto existe
    const { data: cuarto, error: cuartoError } = await supabase
      .from('cuartos')
      .select('id, name')
      .eq('id', cuartoId)
      .single();

    if (cuartoError || !cuarto) {
      return new Response(
        JSON.stringify({ 
          error: 'Cuarto no encontrado',
          success: false 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el usuario ya comentó este cuarto
    const { data: comentarioExistente } = await supabase
      .from('comentarios')
      .select('id')
      .eq('cuarto_id', cuartoId)
      .eq('user_id', user.id)
      .single();

    if (comentarioExistente) {
      return new Response(
        JSON.stringify({ 
          error: 'Ya has comentado este cuarto. Puedes editar tu comentario existente.',
          success: false 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insertar el comentario
    const { data: nuevoComentario, error: insertError } = await supabase
      .from('comentarios')
      .insert([
        {
          cuarto_id: cuartoId,
          user_id: user.id,
          comentario,
          calificacion,
          created_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        usuarios:user_id (
          email
        )
      `)
      .single();

    if (insertError) {
      console.error('Error insertando comentario:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Error guardando comentario',
          details: insertError.message,
          success: false 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎉 Comentario agregado exitosamente:', nuevoComentario.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        comentario: nuevoComentario,
        mensaje: 'Comentario agregado exitosamente'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error general agregando comentario:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
