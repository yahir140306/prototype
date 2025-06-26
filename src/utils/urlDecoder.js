// utils/urlDecoder.js
export function decodeHexUrl(hexUrl) {
  // Verificar que hexUrl existe y no es null/undefined
  if (!hexUrl || typeof hexUrl !== 'string') {
    console.log('decodeHexUrl: valor inválido recibido:', hexUrl);
    return null;
  }

  try {
    // Si la URL ya parece normal (contiene http), devolverla tal como está
    if (hexUrl.startsWith('http')) {
      return hexUrl;
    }

    // Si es una cadena hexadecimal, intentar decodificarla
    if (hexUrl.match(/^[0-9a-fA-F]+$/)) {
      const decoded = Buffer.from(hexUrl, 'hex').toString('utf8');
      console.log('URL decodificada:', decoded);
      return decoded;
    }

    // Si no es hex ni http, asumir que es una URL normal
    return hexUrl;

  } catch (error) {
    console.error('Error decodificando URL:', error);
    return null;
  }
}

// Función alternativa si usas codificación URL estándar
export function decodeUrl(encodedUrl) {
  if (!encodedUrl || typeof encodedUrl !== 'string') {
    return null;
  }

  try {
    return decodeURIComponent(encodedUrl);
  } catch (error) {
    console.error('Error decodificando URL:', error);
    return encodedUrl; // Devolver la original si hay error
  }
}

function decodeHexUrl(hexValue) {
  if (!hexValue || hexValue === null) {
    return null;
  }
  
  // Si ya es una URL normal, devolverla tal cual
  if (typeof hexValue === 'string' && hexValue.startsWith('http')) {
    return hexValue;
  }
  
  // Si es un buffer/bytea, convertir
  if (hexValue.startsWith('\\x')) {
    try {
      const hex = hexValue.slice(2); // remover \x
      const decoded = Buffer.from(hex, 'hex').toString('utf8');
      return decoded;
    } catch (error) {
      console.error('Error decodificando hex:', error);
      return null;
    }
  }
  
  return hexValue;
}