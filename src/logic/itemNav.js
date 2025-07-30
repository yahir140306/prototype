// export const items = [
//   { label: "Home", href: "/" },
//   { label: "Entrar", href: "/registrar" },
//   {
//     label: "Agregar Cuarto",
//     href: "/agregar-cuarto",
//     isButton: true,
//   },
// ];

// logic/itemNav.js
export const items = [
  {
    label: "Inicio",
    href: "/",
    isButton: false,
    requiresAuth: false,
  },
  {
    label: "Perfil",
    href: "/protected",
    isButton: false,
    requiresAuth: false,
  },
  {
    label: "Entrar",
    href: "/registrar",
    isButton: false,
    requiresAuth: false,
    hideWhenAuth: true, // Nueva propiedad: ocultar cuando esté autenticado
  },
  {
    label: "Mis Cuartos",
    href: "/mis-cuartos",
    isButton: false,
    requiresAuth: true, // Solo mostrar cuando esté autenticado
  },
  {
    label: "Agregar Cuarto",
    href: "/agregar-cuarto",
    isButton: true,
    requiresAuth: true, // ESTO DEBE SER true
  },
];

// Debug: verificar configuración
console.log("Items configuration:", items);
