import { createClient } from "../../lib/supabase";

export async function DELETE({ request, cookies }) {
  console.log("🗑️ DELETE cuarto");

  try {
    const supabase = createClient({ request, cookies });
    const { id } = await request.json();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Debes iniciar sesión para eliminar un cuarto",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const cuartoId = parseInt(id);

    console.log("🔍 Buscando cuarto ID:", cuartoId, "para usuario:", user.id);

    // Verificar que el cuarto pertenece al usuario
    const { data: cuarto, error: fetchError } = await supabase
      .from("cuartos")
      .select("*")
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !cuarto) {
      console.error("❌ Error o cuarto no encontrado:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado o no tienes permisos para eliminarlo",
          debug: {
            cuartoId: cuartoId,
            userId: user.id,
            fetchError: fetchError,
          },
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Cuarto encontrado:", cuarto);
    console.log("🗑️ Marcando cuarto como inactivo (eliminación lógica)...");
    console.log("📊 Datos de eliminación:", {
      cuartoId: cuartoId,
      userId: user.id,
      cuartoTitulo: cuarto.titulo,
    });

    const { data: updatedData, error: updateError } = await supabase
      .from("cuartos")
      .update({ activo: false })
      .eq("id", cuartoId)
      .select();

    console.log("🔍 Resultado de eliminación lógica:", {
      updatedData: updatedData,
      updateError: updateError,
      updatedCount: updatedData?.length || 0,
    });

    if (updateError) {
      console.error("💥 Error marcando cuarto como inactivo:", updateError);
      return new Response(
        JSON.stringify({
          error: "Error eliminando cuarto",
          details: updateError.message,
          debug: {
            cuartoId: cuartoId,
            userId: user.id,
          },
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si se actualizó algo
    if (!updatedData || updatedData.length === 0) {
      console.warn("⚠️ No se pudo marcar el cuarto como inactivo");
      console.log("🔍 Última verificación - el cuarto aún existe?");

      const { data: verificar, error: verificarError } = await supabase
        .from("cuartos")
        .select("*")
        .eq("id", cuartoId);

      console.log("📋 Estado actual del cuarto:", {
        verificar: verificar,
        verificarError: verificarError,
      });

      return new Response(
        JSON.stringify({
          error: "No se pudo eliminar el cuarto - posible problema con RLS",
          debug: {
            cuartoId: cuartoId,
            userId: user.id,
            updatedCount: 0,
            cuartoStillExists: verificar?.length > 0,
            rlsIssue: true,
            suggestion:
              "Las políticas de Row Level Security en Supabase están bloqueando la operación",
          },
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Cuarto eliminado exitosamente:", cuartoId);

    return new Response(
      JSON.stringify({
        success: true,
        mensaje: "Cuarto eliminado exitosamente",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error general eliminando cuarto:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST({ params, request, cookies }) {
  console.log("✏️ UPDATE cuarto:", params.id);

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
          error: "Debes iniciar sesión para actualizar un cuarto",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const cuartoId = parseInt(params.id);
    const formData = await request.formData();

    // Extraer datos del formulario
    const updateData = {
      titulo: formData.get("titulo")?.toString()?.trim() || null,
      precio: formData.get("precio")
        ? parseFloat(formData.get("precio"))
        : null,
      descripcion: formData.get("descripcion")?.toString()?.trim() || null,
      ubicacion: formData.get("ubicacion")?.toString()?.trim() || null,
      servicios: formData.get("servicios")?.toString()?.trim() || null,
      contacto: formData.get("contacto")?.toString()?.trim() || null,
    };

    // Filtrar valores null/undefined para no sobrescribir con valores vacíos
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(
        ([_, value]) => value !== null && value !== ""
      )
    );

    console.log("📝 Datos a actualizar:", filteredData);

    // Verificar que el cuarto pertenece al usuario antes de actualizar
    const { data: cuartoExistente, error: fetchError } = await supabase
      .from("cuartos")
      .select("*")
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !cuartoExistente) {
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado o no tienes permisos para actualizarlo",
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Actualizar el cuarto
    const { data: cuartoActualizado, error: updateError } = await supabase
      .from("cuartos")
      .update(filteredData)
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .select("*");

    if (updateError) {
      console.error("Error actualizando cuarto:", updateError);
      return new Response(
        JSON.stringify({
          error: "Error actualizando cuarto",
          details: updateError.message,
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!cuartoActualizado || cuartoActualizado.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se pudo actualizar el cuarto - posible problema con RLS",
          debug: {
            cuartoId: cuartoId,
            userId: user.id,
            rlsIssue: true,
          },
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🎉 Cuarto actualizado exitosamente:", cuartoActualizado);

    // Tomar el primer resultado si hay múltiples
    const cuartoFinal = Array.isArray(cuartoActualizado)
      ? cuartoActualizado[0]
      : cuartoActualizado;

    return new Response(
      JSON.stringify({
        success: true,
        cuarto: cuartoFinal,
        mensaje: "Cuarto actualizado exitosamente",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error general actualizando cuarto:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
