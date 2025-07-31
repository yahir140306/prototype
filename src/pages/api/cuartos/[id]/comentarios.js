import { createClient } from "../../../../lib/supabase";

export async function GET({ params, request, cookies }) {
  console.log("📖 GET comentarios para cuarto:", params.id);
  console.log("Tipo de params.id:", typeof params.id);

  try {
    const supabase = createClient({ request, cookies });

    // Validación mejorada del ID
    let cuartoId;

    if (!params.id || params.id === "undefined" || params.id === "null") {
      console.error("❌ ID no proporcionado:", params.id);
      return new Response(
        JSON.stringify({
          error: "ID de cuarto no proporcionado",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    cuartoId = parseInt(params.id, 10);

    if (isNaN(cuartoId) || cuartoId <= 0) {
      console.error("❌ ID inválido:", params.id, "-> parseInt:", cuartoId);
      return new Response(
        JSON.stringify({
          error: `ID de cuarto inválido: ${params.id}`,
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ ID válido:", cuartoId);

    // Obtener comentarios básicos
    const { data: comentarios, error: comentariosError } = await supabase
      .from("comentarios")
      .select(
        `
        id,
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

    console.log(`📊 Encontrados ${comentarios.length} comentarios`);

    // Procesar comentarios con información básica del usuario
    const comentariosConUsuarios = comentarios.map((comentario) => {
      // Generar email simulado o usar el user_id
      const userId = comentario.user_id;
      const emailSimulado = `usuario-${userId.substring(0, 8)}@example.com`;
      const inicial = emailSimulado.charAt(0).toUpperCase();

      return {
        ...comentario,
        usuario_email: emailSimulado,
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
    });

    // Calcular estadísticas
    const totalComentarios = comentarios.length;
    const promedioCalificacion =
      totalComentarios > 0
        ? comentarios.reduce((sum, c) => sum + c.calificacion, 0) /
          totalComentarios
        : 0;

    console.log(
      `✅ Procesados ${totalComentarios} comentarios para cuarto ${cuartoId}`
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
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
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
      console.error("❌ Error de autenticación:", authError);
      return new Response(
        JSON.stringify({
          error: "Debes iniciar sesión para comentar",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Usuario autenticado:", user.id);

    // Validación del ID
    let cuartoId;

    if (!params.id || params.id === "undefined" || params.id === "null") {
      return new Response(
        JSON.stringify({
          error: "ID de cuarto no proporcionado",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    cuartoId = parseInt(params.id, 10);

    if (isNaN(cuartoId) || cuartoId <= 0) {
      console.error(
        "❌ ID inválido en POST:",
        params.id,
        "-> parseInt:",
        cuartoId
      );
      return new Response(
        JSON.stringify({
          error: `ID de cuarto inválido: ${params.id}`,
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const comentario = formData.get("comentario")?.toString().trim();
    const calificacion = parseInt(formData.get("calificacion"));

    console.log("📋 Datos recibidos:", {
      comentario: comentario?.substring(0, 50) + "...",
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
      console.error("❌ Cuarto no encontrado:", cuartoError);
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado",
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Cuarto existe:", cuarto.id);

    // Verificar si el usuario ya comentó este cuarto
    const { data: comentarioExistente, error: checkError } = await supabase
      .from("comentarios")
      .select("id")
      .eq("cuarto_id", cuartoId)
      .eq("user_id", user.id)
      .maybeSingle(); // Cambiar a maybeSingle para evitar errores

    if (checkError) {
      console.error("❌ Error verificando comentario existente:", checkError);
    }

    if (comentarioExistente) {
      return new Response(
        JSON.stringify({
          error: "Ya has comentado este cuarto",
          success: false,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insertar el comentario - SIMPLIFICADO
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
      console.error("💥 Error insertando comentario:", insertError);
      return new Response(
        JSON.stringify({
          error: "Error guardando el comentario",
          details: insertError.message,
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🎉 Comentario creado exitosamente:", nuevoComentario.id);

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
