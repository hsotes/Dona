/**
 * Resources de Normativas
 */

import { NORMAS } from '../data/loader.js';

export function listNormasResources() {
  return NORMAS.map(norma => ({
    uri: `norma://${norma.codigo}`,
    name: norma.nombre,
    description: norma.descripcion,
    mimeType: 'application/json' as const,
  }));
}

export function handleNormaResource(uri: string) {
  // URI: norma://CODIGO
  // Ejemplo: norma://CIRSOC_301

  const match = uri.match(/^norma:\/\/(.+)$/);
  if (!match) {
    throw new Error('URI de norma inválida. Formato: norma://CODIGO');
  }

  const codigo = match[1];
  const norma = NORMAS.find(n => n.codigo === codigo);

  if (!norma) {
    throw new Error(`Norma ${codigo} no encontrada`);
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json' as const,
      text: JSON.stringify(norma, null, 2),
    }],
  };
}
