import { createClient } from "../../../../lib/supabase";

export async function GET({ params, request, cookies }) {
  console.log("📖 GET comentarios para cuarto:", params.id);

  try {
    const supabase = createClient({ request, cookies });
    const cuartoId = parseInt(params.id); // Convertir a número

    if (isNaN(cuartoId)) {
      return new Response(
        JSON.stringify({
          error: "ID de cuarto inválido",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener comentarios con información del usuario
    const { data: comentarios, error: comentariosError } = await supabase
      .from("comentarios")
      .select(
        `
        *,
        user_id,
        created_at,
        comentario,
        calificacion
      `
      )
      .eq("cuarto_id", cuartoId)
      .order("created_at", { ascending: false });

    if (comentariosError) {
      console.error("Error obteniendo comentarios:", comentariosError);
      return new Response(
        JSON.stringify({
          error: "Error obteniendo comentarios",
          details: comentariosError.message,
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener información de usuarios para los comentarios
    const comentariosConUsuarios = await Promise.all(
      comentarios.map(async (comentario) => {
        // Obtener email del usuario desde auth.users
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", comentario.user_id)
          .single();

        const email = userData?.email || "Usuario";
        const inicial = email.charAt(0).toUpperCase();

        return {
          ...comentario,
          usuario_email: email,
          usuario_inicial: inicial,
          fecha_formateada: new Date(comentario.created_at).toLocaleDateString(
            "es-ES",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        };
      })
    );

    // Calcular estadísticas
    const totalComentarios = comentarios.length;
    const promedioCalificacion =
      totalComentarios > 0
        ? comentarios.reduce((sum, c) => sum + c.calificacion, 0) /
          totalComentarios
        : 0;

    console.log(
      `✅ Obtenidos ${totalComentarios} comentarios para cuarto ${cuartoId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        comentarios: comentariosConUsuarios,
        estadisticas: {
          total: totalComentarios,
          promedio: Math.round(promedioCalificacion * 10) / 10,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Error en GET comentarios:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        success: false,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST({ params, request, cookies }) {
  console.log("📝 POST comentario para cuarto:", params.id);

  try {
    const supabase = createClient({ request, cookies });

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Debes iniciar sesión para comentar",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const cuartoId = parseInt(params.id); // Convertir a número

    if (isNaN(cuartoId)) {
      return new Response(
        JSON.stringify({
          error: "ID de cuarto inválido",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const comentario = formData.get("comentario")?.toString().trim();
    const calificacion = parseInt(formData.get("calificacion"));

    console.log("Datos recibidos:", {
      comentario,
      calificacion,
      cuartoId,
      userId: user.id,
    });

    // Validaciones
    if (!comentario || comentario.length < 10) {
      return new Response(
        JSON.stringify({
          error: "El comentario debe tener al menos 10 caracteres",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return new Response(
        JSON.stringify({
          error: "La calificación debe ser entre 1 y 5 estrellas",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar que el cuarto existe
    const { data: cuarto, error: cuartoError } = await supabase
      .from("cuartos")
      .select("id")
      .eq("id", cuartoId)
      .single();

    if (cuartoError || !cuarto) {
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado",
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si el usuario ya comentó este cuarto
    const { data: comentarioExistente } = await supabase
      .from("comentarios")
      .select("id")
      .eq("cuarto_id", cuartoId)
      .eq("user_id", user.id)
      .single();

    if (comentarioExistente) {
      return new Response(
        JSON.stringify({
          error: "Ya has comentado este cuarto",
          success: false,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insertar el comentario
    const { data: nuevoComentario, error: insertError } = await supabase
      .from("comentarios")
      .insert({
        cuarto_id: cuartoId,
        user_id: user.id,
        comentario: comentario,
        calificacion: calificacion,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error insertando comentario:", insertError);
      return new Response(
        JSON.stringify({
          error: "Error guardando el comentario",
          details: insertError.message,
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Comentario creado exitosamente:", nuevoComentario.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comentario agregado exitosamente",
        comentario: nuevoComentario,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Error en POST comentario:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        success: false,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
