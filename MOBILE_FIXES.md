# Correcciones para Problemas de Subida en Móviles

## Problemas Identificados y Solucionados

### 1. **Límites de Tamaño de Archivo**

**Problema**: Las imágenes de móviles suelen ser muy grandes (15-50MB) y causaban fallos.
**Solución**:

- Reducido el límite de 10MB a 5MB
- Agregada compresión automática de imágenes
- Validación mejorada en cliente y servidor

### 2. **Compresión de Imágenes**

**Nuevo**: Función `compressImageIfNeeded()` que:

- Redimensiona imágenes grandes (max 1920x1080)
- Comprime a JPEG con calidad 80%
- Mantiene proporción de aspecto

### 3. **Manejo de Errores Mejorado**

**Agregado**:

- Mensajes de error específicos para móviles
- Detección de timeouts y conexión lenta
- Retry automático con backoff exponencial (3 intentos)

### 4. **Timeout y Reintentos**

**Nuevo**:

- Timeout de 60 segundos en cliente
- Timeout de 45 segundos en servidor
- Reintentos automáticos con espera incremental
- Headers optimizados para móviles

### 5. **Optimizaciones de UI/UX Móvil**

**Agregado**:

- Meta tags para móviles en Layout.astro
- Mejor feedback visual durante la subida
- Mensajes de error más claros y específicos

## Archivos Modificados

1. **`src/pages/agregar-cuarto.astro`**

   - Compresión de imágenes
   - Retry logic
   - Mejores mensajes de error
   - Timeout handling

2. **`src/pages/api/agregar-cuarto.js`**

   - Validación de tamaño mejorada
   - Timeout en servidor
   - Errores más específicos
   - Headers optimizados

3. **`src/layouts/Layout.astro`**
   - Meta tags para móviles
   - PWA compatibility
   - Performance optimizations

## Cómo Probar

1. Toma fotos grandes con tu móvil (>5MB)
2. Intenta subirlas - deberían comprimirse automáticamente
3. Simula conexión lenta (DevTools > Network > Slow 3G)
4. Verifica que los reintentos funcionen

## Notas Técnicas

- **Compresión**: Canvas API para redimensionar y comprimir
- **Timeouts**: AbortController para cancelar requests largos
- **Retry**: Exponential backoff (1s, 2s, 4s)
- **Validación**: Cliente y servidor para mejor UX
