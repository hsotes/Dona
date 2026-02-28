/**
 * Resources de Perfiles Estructurales
 */

import { PERFILES } from '../data/loader.js';

export function listPerfilesResources() {
  const tipos = ['IPN', 'IPE', 'UPN', 'HEB', 'HEA'];

  return tipos.map(tipo => ({
    uri: `perfiles://${tipo}`,
    name: `Perfiles ${tipo}`,
    description: `Todos los perfiles tipo ${tipo}`,
    mimeType: 'application/json' as const,
  }));
}

export function handlePerfilResource(uri: string) {
  // URI: perfil://TIPO/DESIGNACION
  // Ejemplo: perfil://HEB/200

  const match = uri.match(/^perfil:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    throw new Error('URI de perfil inválida. Formato: perfil://TIPO/DESIGNACION');
  }

  const [, tipo, designacion] = match;
  const perfil = PERFILES.find(
    p => p.tipo === tipo && p.designacion === designacion
  );

  if (!perfil) {
    throw new Error(`Perfil ${tipo} ${designacion} no encontrado`);
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json' as const,
      text: JSON.stringify(perfil, null, 2),
    }],
  };
}

export function handlePerfilesResource(uri: string) {
  // URI: perfiles://TIPO
  // Ejemplo: perfiles://HEB

  const match = uri.match(/^perfiles:\/\/(.+)$/);
  if (!match) {
    throw new Error('URI de perfiles inválida. Formato: perfiles://TIPO');
  }

  const tipo = match[1];

  let perfiles = PERFILES;
  if (tipo !== 'all') {
    perfiles = PERFILES.filter(p => p.tipo === tipo);
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json' as const,
      text: JSON.stringify(perfiles, null, 2),
    }],
  };
}
