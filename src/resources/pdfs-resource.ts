/**
 * Resources de PDFs
 */

import { PDF_METADATA } from '../data/loader.js';

export function listPDFsResources() {
  return PDF_METADATA.map(pdf => ({
    uri: `pdf://${pdf.id}`,
    name: pdf.titulo,
    description: pdf.descripcion,
    mimeType: 'application/json' as const,
  }));
}

export function handlePDFResource(uri: string) {
  // URI: pdf://ID

  const match = uri.match(/^pdf:\/\/(.+)$/);
  if (!match) {
    throw new Error('URI de PDF inválida. Formato: pdf://ID');
  }

  const id = match[1];

  if (id === 'all') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json' as const,
        text: JSON.stringify(PDF_METADATA, null, 2),
      }],
    };
  }

  const pdf = PDF_METADATA.find(p => p.id === id);

  if (!pdf) {
    throw new Error(`PDF ${id} no encontrado`);
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json' as const,
      text: JSON.stringify(pdf, null, 2),
    }],
  };
}
