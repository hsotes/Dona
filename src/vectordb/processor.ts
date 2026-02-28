/**
 * Procesador de documentos - extrae texto y crea chunks
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { DocumentChunk } from './store.js';
import { enrichMetadata } from './metadata-enricher.js';

// Usar require para pdf-parse v1.x (es CommonJS)
const requireModule = createRequire(import.meta.url);
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number; info: { Title?: string } }> = requireModule('pdf-parse');

// Configuración de chunking (reducido de 1000/200 para mejor granularidad)
const CHUNK_SIZE = 500;       // Caracteres por chunk
const CHUNK_OVERLAP = 100;    // Solapamiento entre chunks

/**
 * Extrae texto de un archivo PDF
 */
export async function extractTextFromPDF(filePath: string): Promise<{
  text: string;
  numPages: number;
  title: string;
}> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    numPages: data.numpages,
    title: data.info?.Title || path.basename(filePath, '.pdf'),
  };
}

/**
 * Lee un archivo de texto (markdown, txt)
 */
export function extractTextFromFile(filePath: string): {
  text: string;
  title: string;
} {
  const text = fs.readFileSync(filePath, 'utf-8');
  const title = path.basename(filePath);

  return { text, title };
}

/**
 * Divide texto en chunks con solapamiento
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const chunks: string[] = [];

  // Limpiar el texto
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')  // Reducir múltiples líneas vacías
    .trim();

  // Si el texto es corto, devolverlo como un solo chunk
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  let start = 0;

  while (start < cleanText.length) {
    let end = start + chunkSize;

    // Intentar cortar en un límite de párrafo o oración
    if (end < cleanText.length) {
      // Buscar el último punto, salto de línea o final de oración
      const searchWindow = cleanText.slice(end - 100, end + 100);
      const breakPoints = ['\n\n', '.\n', '. ', '\n'];

      for (const breakPoint of breakPoints) {
        const idx = searchWindow.lastIndexOf(breakPoint);
        if (idx !== -1) {
          end = end - 100 + idx + breakPoint.length;
          break;
        }
      }
    }

    const chunk = cleanText.slice(start, end).trim();

    if (chunk.length > 50) {  // Ignorar chunks muy pequeños
      chunks.push(chunk);
    }

    start = end - overlap;

    // Evitar loops infinitos
    if (start >= cleanText.length - 50) break;
  }

  return chunks;
}

/**
 * Procesa un archivo PDF y genera chunks
 */
export async function processPDF(
  filePath: string,
  sourceType: 'pdf' | 'manual' | 'norma' = 'pdf'
): Promise<DocumentChunk[]> {
  const fileName = path.basename(filePath);
  console.log(`[Processor] Procesando PDF: ${fileName}`);

  const { text, numPages, title } = await extractTextFromPDF(filePath);
  console.log(`[Processor] Extraídas ${numPages} páginas, ${text.length} caracteres`);

  const textChunks = chunkText(text);
  console.log(`[Processor] Generados ${textChunks.length} chunks`);

  const enriched = enrichMetadata(fileName);

  const chunks: DocumentChunk[] = textChunks.map((content, index) => ({
    id: `${fileName}-chunk-${index}`,
    content,
    metadata: {
      source: fileName,
      sourceType,
      chunkIndex: index,
      title,
      ...enriched,
    },
  }));

  return chunks;
}

/**
 * Procesa un archivo de texto/markdown y genera chunks
 */
export function processTextFile(
  filePath: string,
  sourceType: 'manual' | 'norma' = 'manual'
): DocumentChunk[] {
  const fileName = path.basename(filePath);
  console.log(`[Processor] Procesando archivo: ${fileName}`);

  const { text, title } = extractTextFromFile(filePath);
  console.log(`[Processor] Leídos ${text.length} caracteres`);

  const textChunks = chunkText(text);
  console.log(`[Processor] Generados ${textChunks.length} chunks`);

  const enriched = enrichMetadata(fileName);

  const chunks: DocumentChunk[] = textChunks.map((content, index) => ({
    id: `${fileName}-chunk-${index}`,
    content,
    metadata: {
      source: fileName,
      sourceType,
      chunkIndex: index,
      title,
      ...enriched,
    },
  }));

  return chunks;
}

/**
 * Procesa todos los archivos de un directorio
 */
export async function processDirectory(
  dirPath: string,
  sourceType: 'pdf' | 'manual' | 'norma' = 'pdf'
): Promise<DocumentChunk[]> {
  const allChunks: DocumentChunk[] = [];

  if (!fs.existsSync(dirPath)) {
    console.log(`[Processor] Directorio no existe: ${dirPath}`);
    return allChunks;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();

    try {
      if (ext === '.pdf') {
        const chunks = await processPDF(filePath, sourceType);
        allChunks.push(...chunks);
      } else if (['.md', '.txt', '.markdown'].includes(ext)) {
        const chunks = processTextFile(filePath, sourceType as 'manual' | 'norma');
        allChunks.push(...chunks);
      }
    } catch (error) {
      console.error(`[Processor] Error procesando ${file}:`, (error as Error).message);
    }
  }

  return allChunks;
}
