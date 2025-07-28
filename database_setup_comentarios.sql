-- Script SQL para crear la tabla de comentarios en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- 1. Crear la tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    cuarto_id UUID NOT NULL REFERENCES cuartos (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    comentario TEXT NOT NULL CHECK (
        char_length(comentario) >= 10
        AND char_length(comentario) <= 500
    ),
    calificacion INTEGER NOT NULL CHECK (
        calificacion >= 1
        AND calificacion <= 5
    ),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT now()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_comentarios_cuarto_id ON comentarios (cuarto_id);

CREATE INDEX IF NOT EXISTS idx_comentarios_user_id ON comentarios (user_id);

CREATE INDEX IF NOT EXISTS idx_comentarios_created_at ON comentarios (created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad

-- Política para leer comentarios: cualquiera puede leer comentarios
CREATE POLICY "Cualquiera puede leer comentarios" ON comentarios FOR
SELECT USING (true);

-- Política para insertar comentarios: solo usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden agregar comentarios" ON comentarios FOR
INSERT
WITH
    CHECK (
        auth.uid () IS NOT NULL
        AND auth.uid () = user_id
    );

-- Política para actualizar comentarios: solo el autor puede actualizar
CREATE POLICY "Solo el autor puede actualizar su comentario" ON comentarios FOR
UPDATE USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- Política para eliminar comentarios: solo el autor puede eliminar
CREATE POLICY "Solo el autor puede eliminar su comentario" ON comentarios FOR DELETE USING (auth.uid () = user_id);

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear trigger para actualizar updated_at
CREATE TRIGGER update_comentarios_updated_at 
    BEFORE UPDATE ON comentarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Agregar constraint para evitar múltiples comentarios del mismo usuario por cuarto
ALTER TABLE comentarios
ADD CONSTRAINT unique_user_cuarto UNIQUE (user_id, cuarto_id);

-- 8. Opcional: Crear vista para estadísticas de cuartos
CREATE OR REPLACE VIEW cuartos_estadisticas AS
SELECT
    c.id,
    c.name,
    c.precio,
    COALESCE(AVG(com.calificacion), 0) as promedio_calificacion,
    COUNT(com.id) as total_comentarios
FROM cuartos c
    LEFT JOIN comentarios com ON c.id = com.cuarto_id
GROUP BY
    c.id,
    c.name,
    c.precio;

-- Comandos útiles para testing (no ejecutar en producción):
-- DELETE FROM comentarios; -- Borrar todos los comentarios
-- DROP TABLE IF EXISTS comentarios CASCADE; -- Borrar tabla completa