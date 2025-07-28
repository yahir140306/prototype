# 🏠 RANTU - Plataforma de Alquiler de Cuartos

Una plataforma moderna y completa para alquilar cuartos, construida con **Astro**, **Supabase** y **Tailwind CSS**.

## 🚀 Características Principales

### 🔐 **Sistema de Autenticación**

- Registro e inicio de sesión con email
- Autenticación OTP (One-Time Password)
- Middleware de protección de rutas
- Gestión de sesiones con cookies seguras

### 🏡 **Gestión de Cuartos**

- **CRUD completo** para propietarios
- **Subida de imágenes** con optimización automática
- **Filtros de búsqueda** por precio
- **Descargas de tarjetas** promocionales
- **Visualización responsive** en todos los dispositivos

### ⭐ **Sistema de Comentarios y Calificaciones**

- **Calificaciones con estrellas** (1-5 ⭐)
- **Comentarios detallados** con validaciones
- **Estadísticas en tiempo real** (promedio y total)
- **Un comentario por usuario** por cuarto
- **Interfaz intuitiva** con feedback visual

### 👤 **Panel de Usuario**

- **"Mis Cuartos"** - gestión personal
- **Estadísticas propias** (total, activos, precio promedio)
- **Acciones rápidas** (ver, editar, eliminar)
- **Navegación contextual** según estado de autenticación

## 🛠️ Tecnologías Utilizadas

- **[Astro](https://astro.build/)** - Framework web moderno
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[HTML2Canvas](https://html2canvas.hertzen.com/)** - Generación de imágenes
- **JavaScript ES6+** - Interactividad del cliente

## 📁 Estructura del Proyecto

```
prototype/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Nav.astro       # Navegación principal
│   │   ├── Cuarto.astro    # Lista de cuartos
│   │   └── BotonMovil.astro # Navegación móvil
│   ├── pages/
│   │   ├── api/            # Endpoints de API
│   │   │   ├── agregar-cuarto.js     # CRUD cuartos
│   │   │   └── cuartos/
│   │   │       ├── [id].js           # Eliminar cuarto
│   │   │       └── [id]/
│   │   │           └── comentarios.js # API comentarios
│   │   ├── cuarto/         # Páginas de cuartos
│   │   ├── mis-cuartos.astro        # Panel usuario
│   │   ├── editar-cuarto/           # Edición cuartos
│   │   └── registrar.astro          # Autenticación
│   ├── logic/
│   │   └── itemNav.js      # Configuración navegación
│   ├── lib/
│   │   └── supabase.ts     # Cliente Supabase
│   └── utils/
│       ├── auth.js         # Utilidades autenticación
│       └── urlDecoder.js   # Decodificación URLs
├── database_setup_comentarios.sql   # Setup base de datos
├── comentarios_template.csv         # Plantilla CSV
└── comentarios_sample.csv          # Datos ejemplo
```

## 🔧 Instalación y Configuración

### 1. **Clonar el Repositorio**

```bash
git clone <repository-url>
cd prototype
```

### 2. **Instalar Dependencias**

```bash
npm install
```

### 3. **Configurar Variables de Entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=tu_supabase_url
PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. **Configurar Base de Datos**

Ejecuta el script SQL en tu proyecto Supabase:

```bash
# En Supabase SQL Editor, ejecuta:
database_setup_comentarios.sql
```

### 5. **Iniciar Servidor de Desarrollo**

```bash
npm run dev
```

## 📋 Configuración de Supabase

### **Tablas Requeridas:**

#### 1. **Tabla `cuartos`**

```sql
CREATE TABLE cuartos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_1 TEXT,
    imagen_2 TEXT,
    imagen_3 TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

#### 2. **Tabla `comentarios`**

```sql
-- Ver archivo: database_setup_comentarios.sql
```

### **Storage Buckets:**

- `cuartos-images` - Para almacenar imágenes de cuartos

### **Row Level Security (RLS):**

- ✅ Habilitado en todas las tablas
- ✅ Políticas de seguridad configuradas
- ✅ Solo usuarios autenticados pueden crear/modificar

## 🎯 Funcionalidades Detalladas

### **Para Visitantes:**

- ✅ Ver todos los cuartos disponibles
- ✅ Filtrar por rango de precios
- ✅ Leer comentarios y calificaciones
- ✅ Descargar tarjetas promocionales
- ✅ Registro/inicio de sesión

### **Para Usuarios Autenticados:**

- ✅ Todo lo anterior, más:
- ✅ Crear nuevos cuartos
- ✅ Ver "Mis Cuartos" con estadísticas
- ✅ Editar/eliminar cuartos propios
- ✅ Agregar comentarios y calificaciones
- ✅ Gestión completa de perfil

### **Sistema de Comentarios:**

- ⭐ Calificación de 1-5 estrellas
- 📝 Comentarios de 10-500 caracteres
- 👤 Avatar con inicial del usuario
- 📊 Estadísticas automáticas (promedio, total)
- 🔒 Un comentario por usuario por cuarto
- 📱 Interfaz responsive y accesible

## 🚦 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Vista previa
npm run preview

# Linting
npm run astro check
```

## 🔒 Seguridad Implementada

- **Autenticación JWT** con Supabase
- **Row Level Security (RLS)** en base de datos
- **Validación de datos** en cliente y servidor
- **Protección CSRF** con cookies seguras
- **Sanitización de inputs** automática
- **Verificación de propiedad** en operaciones CRUD

## 📱 Responsive Design

- ✅ **Móvil primero** (Mobile-first approach)
- ✅ **Breakpoints optimizados** con Tailwind
- ✅ **Navegación adaptiva** (desktop/móvil)
- ✅ **Imágenes responsivas** con lazy loading
- ✅ **Formularios touch-friendly**

## 🎨 Diseño y UX

- **Colores:** Paleta moderna púrpura-azul
- **Tipografía:** Inter (sistema) con jerarquía clara
- **Animaciones:** Transiciones suaves y micro-interacciones
- **Iconos:** Sistema consistente con Lucide/Heroicons
- **Estados:** Loading, success, error claramente definidos

## 📊 Características de Performance

- **Astro Islands** - Hidratación selectiva
- **Optimización de imágenes** - Compresión automática
- **Lazy loading** - Carga diferida de contenido
- **Caching inteligente** - Headers optimizados
- **Bundle splitting** - Código dividido eficientemente

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- **Astro Team** - Por el increíble framework
- **Supabase** - Por el BaaS completo y fácil de usar
- **Tailwind CSS** - Por el sistema de diseño utility-first
- **Vercel** - Por el hosting y deployment sencillo

**¡Gracias por usar RANTU! 🏠✨**

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
