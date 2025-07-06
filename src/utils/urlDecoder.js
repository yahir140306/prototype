// utils/urlDecoder.js

/**
 * Decodifica una URL que puede estar en formato hexadecimal
 * @param {string} hexUrl - URL en formato hex, bytea de PostgreSQL, o URL normal
 * @returns {string|null} - URL decodificada o null si hay error
 */
export function decodeHexUrl(hexUrl) {
  // Verificar que hexUrl existe y no es null/undefined
  if (!hexUrl || typeof hexUrl !== "string") {
    // console.log('decodeHexUrl: valor inválido recibido:', hexUrl);
    return null;
  }

  try {
    // Si la URL ya parece normal (contiene http), devolverla tal como está
    if (hexUrl.startsWith("http")) {
      return hexUrl;
    }

    // Si es bytea de PostgreSQL (empieza con \x)
    if (hexUrl.startsWith("\\x")) {
      const hex = hexUrl.slice(2); // remover \x
      const decoded = Buffer.from(hex, "hex").toString("utf8");
      console.log("URL decodificada desde bytea:", decoded);
      return decoded;
    }

    // Si es una cadena hexadecimal pura
    if (hexUrl.match(/^[0-9a-fA-F]+$/)) {
      const decoded = Buffer.from(hexUrl, "hex").toString("utf8");
      console.log("URL decodificada desde hex:", decoded);
      return decoded;
    }

    // Si no es hex ni http, asumir que es una URL normal
    return hexUrl;
  } catch (error) {
    console.error("Error decodificando URL:", error);
    return null;
  }
}

/**
 * Decodifica una URL con codificación URL estándar (percent-encoding)
 * @param {string} encodedUrl - URL codificada con %
 * @returns {string|null} - URL decodificada
 */
export function decodeUrl(encodedUrl) {
  if (!encodedUrl || typeof encodedUrl !== "string") {
    return null;
  }

  try {
    return decodeURIComponent(encodedUrl);
  } catch (error) {
    console.error("Error decodificando URL:", error);
    return encodedUrl; // Devolver la original si hay error
  }
}
