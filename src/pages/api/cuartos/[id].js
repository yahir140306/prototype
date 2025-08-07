import { createClient } from "../../../lib/supabase";

export async function DELETE({ params, request, cookies }) {
  console.log("�️  DELETE cuarto:", params.id);

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
          error: "Debes iniciar sesión para eliminar un cuarto",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const cuartoId = parseInt(params.id);

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

    console.log("✅ Cuarto encontrado:", cuarto.id, "- Título:", cuarto.titulo);

    // Eliminar comentarios relacionados PRIMERO
    console.log("🗑️ Eliminando comentarios relacionados...");
    const { error: comentariosError } = await supabase
      .from("comentarios")
      .delete()
      .eq("cuarto_id", cuartoId);

    if (comentariosError) {
      console.warn("⚠️ Error eliminando comentarios:", comentariosError);
    }

    // Marcar el cuarto como inactivo (eliminación lógica)
    console.log("🔄 Marcando cuarto como inactivo (eliminación lógica)...");
    console.log("📊 Datos de eliminación:", {
      cuartoId: cuartoId,
      userId: user.id,
      cuartoTitulo: cuarto.titulo,
    });

    // Intentar con diferentes enfoques
    let updateResult;
    
    // Método 1: Con user_id en el filtro
    console.log("🔍 Método 1: UPDATE con user_id");
    updateResult = await supabase
      .from("cuartos")
      .update({ activo: false })
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .select();

    console.log("📋 Resultado Método 1:", updateResult);

    // Si el primer método no funcionó, intentar sin user_id
    if (!updateResult.data || updateResult.data.length === 0) {
      console.log("🔍 Método 2: UPDATE solo con ID");
      updateResult = await supabase
        .from("cuartos")
        .update({ activo: false })
        .eq("id", cuartoId)
        .select();
      
      console.log("📋 Resultado Método 2:", updateResult);
    }

    // Si aún no funciona, mostrar el error específico de RLS
    if (!updateResult.data || updateResult.data.length === 0) {
      console.error("💥 Ambos métodos de actualización fallaron");
      return new Response(
        JSON.stringify({
          error: "No se puede eliminar el cuarto debido a políticas de seguridad",
          details: "Las políticas de Row Level Security (RLS) en Supabase están bloqueando la operación de UPDATE",
          solution: {
            step1: "Ve al Dashboard de Supabase",
            step2: "Navega a Authentication → Policies",
            step3: "Busca la tabla 'cuartos'",
            step4: "Crea o verifica que existe una política de UPDATE",
            step5: "La política debe ser: 'Users can update their own cuartos' con condición: auth.uid() = user_id"
          },
          debug: {
            cuartoId: cuartoId,
            userId: user.id,
            canRead: true, // Pudimos leer el cuarto
            canUpdate: false, // No pudimos actualizarlo
            rlsBlocking: true
          },
          success: false,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedData = updateResult.data;
    const updateError = updateResult.error;

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

    const cuartoId = parseInt(params.id);

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

    console.log("✅ Cuarto encontrado:", cuarto.id, "- Título:", cuarto.titulo);

    // Eliminar comentarios relacionados PRIMERO
    console.log("🗑️ Eliminando comentarios relacionados...");
    const { error: comentariosError } = await supabase
      .from("comentarios")
      .delete()
      .eq("cuarto_id", cuartoId);

    if (comentariosError) {
      console.warn("⚠️ Error eliminando comentarios:", comentariosError);
      // No fallar la operación, pero registrar el error
    }

    // Eliminar imágenes del storage (opcional)
    const imagesToDelete = [cuarto.imagen_1, cuarto.imagen_2, cuarto.imagen_3]
      .filter((img) => img && img.includes("supabase"))
      .map((img) => {
        // Extraer el nombre del archivo de la URL
        const urlParts = img.split("/");
        return urlParts[urlParts.length - 1];
      });

    if (imagesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("cuartos-images")
        .remove(imagesToDelete);

      if (storageError) {
        console.warn("Error eliminando imágenes:", storageError);
        // No fallar la operación solo por esto
      }
    }

    // Marcar el cuarto como inactivo (eliminación lógica)
    console.log("� Marcando cuarto como inactivo (eliminación lógica)...");
    console.log("📊 Datos de eliminación:", {
      cuartoId: cuartoId,
      userId: user.id,
      cuartoTitulo: cuarto.titulo,
    });

    const { data: updatedData, error: updateError } = await supabase
      .from("cuartos")
      .update({ activo: false })
      .eq("id", cuartoId)
      .select(); // Quitar el filtro de user_id para probar

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
  console.log("✏️  UPDATE cuarto:", params.id);

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
          error: "Debes iniciar sesión para editar un cuarto",
          success: false,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const cuartoId = params.id;

    // Verificar que el cuarto pertenece al usuario
    const { data: cuartoExistente, error: fetchError } = await supabase
      .from("cuartos")
      .select("*")
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !cuartoExistente) {
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado o no tienes permisos para editarlo",
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();

    const titulo = formData.get("titulo")?.toString().trim();
    const descripcion = formData.get("descripcion");
    const precio = parseFloat(formData.get("precio"));

    const imagen_1 = formData.get("imagen_1");
    const imagen_2 = formData.get("imagen_2");
    const imagen_3 = formData.get("imagen_3");

    console.log("📝 Datos de actualización:", { titulo, descripcion, precio });

    // Validar campos obligatorios
    if (!titulo || !descripcion || !precio || isNaN(precio)) {
      return new Response(
        JSON.stringify({
          error: "Faltan campos obligatorios",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Función para subir nueva imagen si se proporciona
    async function subirNuevaImagen(imagen, nombreBase, urlAnterior) {
      if (!imagen || imagen.size === 0) return urlAnterior; // Mantener imagen anterior si no hay nueva

      console.log(
        `✅ Subiendo nueva ${nombreBase}: ${imagen.name} | Tamaño: ${imagen.size} bytes`
      );

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = imagen.name.split(".").pop();
      const fileName = `${nombreBase}_${timestamp}_${randomStr}.${extension}`;

      const BUCKET_NAME = "cuartos-images";

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, imagen, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(`💥 Error subiendo ${nombreBase}:`, uploadError);
          throw new Error(
            `Error subiendo ${nombreBase}: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        console.log(
          `🎉 ${nombreBase} subida exitosamente:`,
          publicUrlData.publicUrl
        );

        // Eliminar imagen anterior si existe y es de Supabase
        if (urlAnterior && urlAnterior.includes("supabase")) {
          const urlParts = urlAnterior.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
        }

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error(`Error subiendo ${nombreBase}:`, error);
        throw error;
      }
    }

    // Subir nuevas imágenes o mantener las existentes
    const imagen_1_url = await subirNuevaImagen(
      imagen_1,
      "imagen_1",
      cuartoExistente.imagen_1
    );
    const imagen_2_url = await subirNuevaImagen(
      imagen_2,
      "imagen_2",
      cuartoExistente.imagen_2
    );
    const imagen_3_url = await subirNuevaImagen(
      imagen_3,
      "imagen_3",
      cuartoExistente.imagen_3
    );

    // Actualizar el cuarto en la base de datos
    console.log(
      "🔄 Intentando actualizar cuarto:",
      cuartoId,
      "para usuario:",
      user.id
    );
    console.log("📊 Datos a actualizar:", {
      titulo,
      descripcion,
      precio,
      imagen_1: imagen_1_url,
      imagen_2: imagen_2_url,
      imagen_3: imagen_3_url,
    });

    // Verificar si el cuarto existe antes de actualizar
    console.log("🔍 Verificando cuarto existente...");
    const { data: verificarCuarto, error: verificarError } = await supabase
      .from("cuartos")
      .select("*")
      .eq("id", parseInt(cuartoId))
      .eq("user_id", user.id);

    console.log("📋 Resultado verificación:", {
      found: verificarCuarto?.length || 0,
      error: verificarError,
      cuartoId: parseInt(cuartoId),
      userId: user.id,
    });

    if (!verificarCuarto || verificarCuarto.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se encontró el cuarto para actualizar",
          debug: {
            cuartoId: parseInt(cuartoId),
            userId: user.id,
            verificarError: verificarError,
          },
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: cuartoActualizado, error: updateError } = await supabase
      .from("cuartos")
      .update({
        titulo,
        descripcion,
        precio,
        imagen_1: imagen_1_url,
        imagen_2: imagen_2_url,
        imagen_3: imagen_3_url,
      })
      .eq("id", parseInt(cuartoId))
      .eq("user_id", user.id)
      .select();

    if (updateError) {
      console.error("💥 Error actualizando cuarto:", updateError);
      return new Response(
        JSON.stringify({
          error: "Error actualizando cuarto",
          details: updateError.message,
          success: false,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🎉 Cuarto actualizado exitosamente:", cuartoActualizado);

    // Tomar el primer resultado si hay múltiples
    const cuarto = Array.isArray(cuartoActualizado)
      ? cuartoActualizado[0]
      : cuartoActualizado;

    return new Response(
      JSON.stringify({
        success: true,
        cuarto: cuarto,
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
