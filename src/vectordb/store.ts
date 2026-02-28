/**
 * Vector Store Optimizado v3 - Sharding por documento
 *
 * Estrategia de almacenamiento:
 * - vectors/{source}.vec.json: Embeddings + metadata POR DOCUMENTO
 * - chunks/{source}.json: Contenido de texto POR DOCUMENTO
 * - manifest.json: Lista de documentos indexados
 *
 * Cada documento se guarda en su propio archivo, eliminando el límite de tamaño.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding, generateEmbeddings } from './embeddings.js';

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const STORE_DIR = path.join(__dirname, '..', '..', 'knowledge', 'vectordb');
const VECTORS_DIR = path.join(STORE_DIR, 'vectors');
const CHUNKS_DIR = path.join(STORE_DIR, 'chunks');
const MANIFEST_PATH = path.join(STORE_DIR, 'manifest.json');
// Ruta legacy para migración
const LEGACY_VECTORS_PATH = path.join(STORE_DIR, 'vectors.json');

// Tipos
interface IndexedDocument {
  id: string;
  embedding: number[];
  metadata: {
    source: string;
    sourceType: 'pdf' | 'manual' | 'norma';
    page?: number;
    chunkIndex: number;
    title?: string;
    normaOrigen?: string;
    idioma?: 'es' | 'en';
    tema?: string;
    coleccion?: string;
  };
}

interface DocumentShard {
  source: string;
  documents: IndexedDocument[];
}

interface Manifest {
  version: 3;
  sources: { name: string; chunks: number; indexedAt: string }[];
}

// Cache en memoria
let manifest: Manifest | null = null;
let lastManifestLoad: number = 0;
const CACHE_TTL = 5000;
const vectorCache: Map<string, IndexedDocument[]> = new Map();
const chunksCache: Map<string, Map<number, string>> = new Map();

/**
 * Calcula similitud coseno entre dos vectores
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Asegura que los directorios existen
 */
function ensureDirs(): void {
  for (const dir of [STORE_DIR, VECTORS_DIR, CHUNKS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Genera nombre de archivo seguro para un source
 */
function sourceToFilename(source: string): string {
  return source.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Carga el manifest
 */
function loadManifest(): Manifest {
  const now = Date.now();

  if (manifest && (now - lastManifestLoad) < CACHE_TTL) {
    return manifest;
  }

  ensureDirs();

  // Migrar de formato legacy si existe
  if (fs.existsSync(LEGACY_VECTORS_PATH) && !fs.existsSync(MANIFEST_PATH)) {
    console.log('[VectorStore] Migrando de formato legacy a v3 (sharding)...');
    migrateFromLegacy();
  }

  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    lastManifestLoad = now;
    const total = manifest!.sources.reduce((sum, s) => sum + s.chunks, 0);
    console.log(`[VectorStore] ${manifest!.sources.length} documentos, ${total} vectores`);
  } else {
    manifest = { version: 3, sources: [] };
    lastManifestLoad = now;
    saveManifest();
    console.log('[VectorStore] Store nuevo creado');
  }

  return manifest!;
}

/**
 * Guarda el manifest
 */
function saveManifest(): void {
  if (!manifest) return;
  ensureDirs();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * Migra del formato legacy (un gran vectors.json) al formato v3 (sharding)
 */
function migrateFromLegacy(): void {
  const data = fs.readFileSync(LEGACY_VECTORS_PATH, 'utf-8');
  const parsed = JSON.parse(data);

  // Determinar si es v1 (con content) o v2 (sin content)
  const docs: Array<{ id: string; content?: string; embedding: number[]; metadata: any }> =
    parsed.documents || [];

  // Agrupar por source
  const bySource: Map<string, { vectors: IndexedDocument[]; chunks: Map<number, string> }> = new Map();

  for (const doc of docs) {
    const source = doc.metadata.source;
    if (!bySource.has(source)) {
      bySource.set(source, { vectors: [], chunks: new Map() });
    }
    const group = bySource.get(source)!;

    group.vectors.push({
      id: doc.id,
      embedding: doc.embedding,
      metadata: doc.metadata,
    });

    if (doc.content) {
      group.chunks.set(doc.metadata.chunkIndex, doc.content);
    }
  }

  // Guardar shards
  ensureDirs();
  const newManifest: Manifest = { version: 3, sources: [] };

  for (const [source, group] of bySource) {
    const filename = sourceToFilename(source);

    // Guardar vectores
    const shard: DocumentShard = { source, documents: group.vectors };
    fs.writeFileSync(path.join(VECTORS_DIR, `${filename}.vec.json`), JSON.stringify(shard));

    // Guardar chunks si hay contenido
    if (group.chunks.size > 0) {
      const chunksObj: Record<number, string> = {};
      for (const [idx, content] of group.chunks) {
        chunksObj[idx] = content;
      }
      fs.writeFileSync(path.join(CHUNKS_DIR, `${filename}.json`), JSON.stringify(chunksObj));
    }

    newManifest.sources.push({
      name: source,
      chunks: group.vectors.length,
      indexedAt: new Date().toISOString(),
    });
  }

  // Migrar chunks existentes del formato v2
  if (fs.existsSync(CHUNKS_DIR)) {
    // Los chunks de v2 ya están en chunks/ con el formato correcto
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  manifest = newManifest;

  // Renombrar legacy
  fs.renameSync(LEGACY_VECTORS_PATH, LEGACY_VECTORS_PATH + '.migrated');

  console.log(`[VectorStore] Migrados ${docs.length} vectores de ${bySource.size} documentos a v3`);
}

/**
 * Carga vectores de un documento
 */
function loadDocumentVectors(source: string): IndexedDocument[] {
  if (vectorCache.has(source)) {
    return vectorCache.get(source)!;
  }

  const filename = sourceToFilename(source);
  const filepath = path.join(VECTORS_DIR, `${filename}.vec.json`);

  if (fs.existsSync(filepath)) {
    const shard: DocumentShard = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    vectorCache.set(source, shard.documents);
    return shard.documents;
  }

  return [];
}

/**
 * Guarda vectores de un documento
 */
function saveDocumentVectors(source: string, documents: IndexedDocument[]): void {
  ensureDirs();
  const filename = sourceToFilename(source);
  const shard: DocumentShard = { source, documents };
  fs.writeFileSync(path.join(VECTORS_DIR, `${filename}.vec.json`), JSON.stringify(shard));
  vectorCache.set(source, documents);
}

/**
 * Guarda chunks de un documento a disco
 */
function saveDocumentChunks(source: string, chunks: Map<number, string>): void {
  ensureDirs();
  const filename = sourceToFilename(source);
  const chunksObj: Record<number, string> = {};
  for (const [idx, content] of chunks) {
    chunksObj[idx] = content;
  }
  fs.writeFileSync(path.join(CHUNKS_DIR, `${filename}.json`), JSON.stringify(chunksObj));
  chunksCache.set(source, chunks);
}

/**
 * Carga chunks de un documento desde disco
 */
function loadDocumentChunks(source: string): Map<number, string> {
  if (chunksCache.has(source)) {
    return chunksCache.get(source)!;
  }

  const filename = sourceToFilename(source);
  const filepath = path.join(CHUNKS_DIR, `${filename}.json`);

  if (fs.existsSync(filepath)) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const chunks = new Map<number, string>();
    for (const [idx, content] of Object.entries(data)) {
      chunks.set(parseInt(idx), content as string);
    }
    chunksCache.set(source, chunks);
    return chunks;
  }

  return new Map();
}

/**
 * Obtiene el contenido de un chunk específico
 */
export function getChunkContent(source: string, chunkIndex: number): string {
  const chunks = loadDocumentChunks(source);
  return chunks.get(chunkIndex) || '[Contenido no disponible]';
}

/**
 * Inicializa el vector store
 */
export async function initVectorStore(): Promise<Manifest> {
  return loadManifest();
}

/**
 * Representa un chunk de documento
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    sourceType: 'pdf' | 'manual' | 'norma';
    page?: number;
    chunkIndex: number;
    title?: string;
    normaOrigen?: string;
    idioma?: 'es' | 'en';
    tema?: string;
    coleccion?: string;
  };
}

/**
 * Agrega documentos al vector store
 */
export async function addDocuments(chunks: DocumentChunk[]): Promise<void> {
  const m = loadManifest();

  // Generar embeddings en batch
  const texts = chunks.map(c => c.content);
  console.log(`[VectorStore] Generando embeddings para ${texts.length} chunks...`);
  const embeddings = await generateEmbeddings(texts);

  // Agrupar por source
  const bySource: Map<string, { vectors: IndexedDocument[]; chunks: Map<number, string> }> = new Map();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const source = chunk.metadata.source;

    if (!bySource.has(source)) {
      bySource.set(source, {
        vectors: loadDocumentVectors(source).slice(), // Copia de existentes
        chunks: loadDocumentChunks(source),
      });
    }

    const group = bySource.get(source)!;

    // Eliminar si ya existe
    const existingIdx = group.vectors.findIndex(d => d.id === chunk.id);
    if (existingIdx !== -1) {
      group.vectors.splice(existingIdx, 1);
    }

    group.vectors.push({
      id: chunk.id,
      embedding: embeddings[i],
      metadata: chunk.metadata,
    });

    group.chunks.set(chunk.metadata.chunkIndex, chunk.content);
  }

  // Guardar cada documento por separado
  for (const [source, group] of bySource) {
    saveDocumentVectors(source, group.vectors);
    saveDocumentChunks(source, group.chunks);

    // Actualizar manifest
    const existing = m.sources.find(s => s.name === source);
    if (existing) {
      existing.chunks = group.vectors.length;
      existing.indexedAt = new Date().toISOString();
    } else {
      m.sources.push({
        name: source,
        chunks: group.vectors.length,
        indexedAt: new Date().toISOString(),
      });
    }
  }

  saveManifest();

  const total = m.sources.reduce((sum, s) => sum + s.chunks, 0);
  console.log(`[VectorStore] Agregados ${chunks.length} chunks (total: ${total})`);
}

export interface SearchTimings {
  embeddingMs: number;
  searchMs: number;
  totalMs: number;
}

export interface SearchResultWithTimings {
  results: SearchResult[];
  timings: SearchTimings;
}

/**
 * Busca documentos similares a una query
 */
export async function searchDocuments(
  query: string,
  limit: number = 5,
  filter?: Record<string, string>
): Promise<SearchResult[]> {
  const { results } = await searchDocumentsWithTimings(query, limit, filter);
  return results;
}

/**
 * Busca documentos similares a una query, retornando timings
 */
export async function searchDocumentsWithTimings(
  query: string,
  limit: number = 5,
  filter?: Record<string, string>
): Promise<SearchResultWithTimings> {
  const totalStart = performance.now();
  const m = loadManifest();

  if (m.sources.length === 0) {
    console.log('[VectorStore] No hay documentos indexados');
    return { results: [], timings: { embeddingMs: 0, searchMs: 0, totalMs: 0 } };
  }

  // Generar embedding de la query
  console.log('[VectorStore] Generando embedding para búsqueda...');
  const embStart = performance.now();
  const queryEmbedding = await generateEmbedding(query);
  const embeddingMs = performance.now() - embStart;

  // Buscar en todos los documentos
  const searchStart = performance.now();
  const allScores: { doc: IndexedDocument; similarity: number }[] = [];

  for (const sourceInfo of m.sources) {
    const documents = loadDocumentVectors(sourceInfo.name);

    for (const doc of documents) {
      // Aplicar filtro
      if (filter) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if ((doc.metadata as Record<string, unknown>)[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      allScores.push({
        doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      });
    }
  }

  // Ordenar por similitud
  allScores.sort((a, b) => b.similarity - a.similarity);
  const searchMs = performance.now() - searchStart;

  // Tomar los top N y cargar contenido
  const results: SearchResult[] = allScores.slice(0, limit).map(item => ({
    id: item.doc.id,
    content: getChunkContent(item.doc.metadata.source, item.doc.metadata.chunkIndex),
    metadata: item.doc.metadata,
    distance: 1 - item.similarity,
  }));

  const totalMs = performance.now() - totalStart;

  return {
    results,
    timings: {
      embeddingMs: Math.round(embeddingMs),
      searchMs: Math.round(searchMs),
      totalMs: Math.round(totalMs),
    },
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: DocumentChunk['metadata'];
  distance: number;
}

/**
 * Verifica si un documento ya está indexado
 */
export async function isDocumentIndexed(source: string): Promise<boolean> {
  const m = loadManifest();
  return m.sources.some(s => s.name === source);
}

/**
 * Elimina documentos de una fuente específica
 */
export async function deleteDocumentsBySource(source: string): Promise<void> {
  const m = loadManifest();

  const filename = sourceToFilename(source);

  // Eliminar archivos
  const vecFile = path.join(VECTORS_DIR, `${filename}.vec.json`);
  const chunkFile = path.join(CHUNKS_DIR, `${filename}.json`);

  if (fs.existsSync(vecFile)) fs.unlinkSync(vecFile);
  if (fs.existsSync(chunkFile)) fs.unlinkSync(chunkFile);

  // Limpiar cache
  vectorCache.delete(source);
  chunksCache.delete(source);

  // Actualizar manifest
  const idx = m.sources.findIndex(s => s.name === source);
  if (idx !== -1) {
    const removed = m.sources[idx].chunks;
    m.sources.splice(idx, 1);
    saveManifest();
    console.log(`[VectorStore] Eliminados ${removed} chunks de "${source}"`);
  }
}

/**
 * Obtiene estadísticas del vector store
 */
export async function getStoreStats(): Promise<{
  totalChunks: number;
  sources: string[];
}> {
  const m = loadManifest();

  return {
    totalChunks: m.sources.reduce((sum, s) => sum + s.chunks, 0),
    sources: m.sources.map(s => s.name),
  };
}
