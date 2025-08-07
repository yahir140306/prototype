import { createClient } from "../../../lib/supabase";

export async function DELETE({ params, request, cookies }) {
  console.log("🗑️  DELETE cuarto:", params.id);

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

    const cuartoId = params.id;

    // Verificar que el cuarto pertenece al usuario
    const { data: cuarto, error: fetchError } = await supabase
      .from("cuartos")
      .select("*")
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !cuarto) {
      return new Response(
        JSON.stringify({
          error: "Cuarto no encontrado o no tienes permisos para eliminarlo",
          success: false,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
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

    // Eliminar el cuarto de la base de datos
    const { error: deleteError } = await supabase
      .from("cuartos")
      .delete()
      .eq("id", cuartoId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error eliminando cuarto:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Error eliminando cuarto",
          details: deleteError.message,
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

    const name = formData.get("titulo");
    const descripcion = formData.get("descripcion");
    const precio = parseFloat(formData.get("precio"));

    const imagen_1 = formData.get("imagen_1");
    const imagen_2 = formData.get("imagen_2");
    const imagen_3 = formData.get("imagen_3");

    console.log("📝 Datos de actualización:", { name, descripcion, precio });

    // Validar campos obligatorios
    if (!name || !descripcion || !precio || isNaN(precio)) {
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
    const { data: cuartoActualizado, error: updateError } = await supabase
      .from("cuartos")
      .update({
        name,
        descripcion,
        precio,
        imagen_principal: imagen_1_url,
        imagen_1: imagen_1_url,
        imagen_2: imagen_2_url,
        imagen_3: imagen_3_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cuartoId)
      .eq("user_id", user.id)
      .select()
      .single();

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

    return new Response(
      JSON.stringify({
        success: true,
        cuarto: cuartoActualizado,
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
