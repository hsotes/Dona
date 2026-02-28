/**
 * Resource de Costos
 */

import { COSTOS } from '../data/loader.js';

export function handleCostosResource(uri: string) {
  // URI: costos:// o costos://RUBRO

  const match = uri.match(/^costos:\/\/?(.*)$/);
  if (!match) {
    throw new Error('URI de costos inválida');
  }

  const rubro = match[1];

  let costos = COSTOS;
  if (rubro) {
    costos = COSTOS.filter(c => c.rubro.toLowerCase().includes(rubro.toLowerCase()));
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json' as const,
      text: JSON.stringify({
        total: costos.length,
        moneda: 'ARS',
        materiales: costos,
      }, null, 2),
    }],
  };
}
