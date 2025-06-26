// const imagenes = {JSON.stringify(imagenes)};
//       let index = 0;
//       const mainImage = document.getElementById('mainImage');
//       const updateImage = () => {
//         mainImage.src = imagenes[index].url;
//         mainImage.alt = imagenes[index].alt;
//       };
//       document.getElementById('prev')?.addEventListener('click', () => {
//         index = (index - 1 + imagenes.length) % imagenes.length;
//         updateImage();
//       });
//       document.getElementById('next')?.addEventListener('click', () => {
//         index = (index + 1) % imagenes.length;
//         updateImage();
//       });