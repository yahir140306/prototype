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
    requiresAuth: false
  },
  {
    label: "Buscar",
    href: "/buscar",
    isButton: false,
    requiresAuth: false
  },
  {
    label: "Sobre Nosotros", 
    href: "/about",
    isButton: false,
    requiresAuth: false
  },
  {
    label: "Agregar Cuarto",
    href: "/agregar-cuarto", 
    isButton: true,
    requiresAuth: true  // ESTO DEBE SER true
  }
];

// Debug: verificar configuración
console.log('Items configuration:', items);