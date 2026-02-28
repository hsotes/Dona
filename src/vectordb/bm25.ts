/**
 * BM25 Keyword Search - Implementación pura TypeScript
 *
 * Índice invertido clásico con scoring BM25 (Okapi BM25).
 * Optimizado para terminología de ingeniería estructural argentina.
 *
 * Almacenamiento: knowledge/vectordb/bm25-index.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOLUME_DIR = '/data/vectordb';
const LOCAL_DIR = path.join(__dirname, '..', '..', 'knowledge', 'vectordb');
const STORE_DIR = fs.existsSync(path.join(VOLUME_DIR, 'manifest.json')) ? VOLUME_DIR : LOCAL_DIR;
const BM25_INDEX_PATH = path.join(STORE_DIR, 'bm25-index.json');

// Parámetros BM25
const K1 = 1.2;
const B = 0.75;

// Stopwords españolas comunes (no incluir términos técnicos)
const STOPWORDS = new Set([
  'a', 'al', 'algo', 'ante', 'con', 'como', 'cual', 'cuando',
  'de', 'del', 'desde', 'donde', 'durante',
  'e', 'el', 'ella', 'ellos', 'en', 'entre', 'era', 'esa', 'ese', 'eso', 'esta', 'este', 'esto',
  'fue', 'ha', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los',
  'mas', 'me', 'mi', 'muy', 'no', 'nos', 'o', 'otra', 'otro', 'otros',
  'para', 'pero', 'por', 'que', 'se', 'si', 'sin', 'sobre', 'son', 'su', 'sus',
  'te', 'ti', 'tiene', 'todo', 'tu', 'tus', 'un', 'una', 'uno', 'unos',
  'ya', 'y',
]);

/**
 * Tokeniza texto preservando términos técnicos de ingeniería estructural.
 *
 * Mantiene: CIRSOC-301, F.2.1, HEB200, IPE300, 8mm, etc.
 * Divide en: palabras individuales, lowercase.
 */
export function tokenize(text: string): string[] {
  // Lowercase
  const lower = text.toLowerCase();

  // Regex que captura:
  // - Códigos alfanuméricos con puntos/guiones (f.2.1, cirsoc-301)
  // - Números con unidades (8mm, 200kn, 345mpa)
  // - Perfiles con números (heb200, ipe300, ipn200)
  // - Palabras normales
  const tokenRegex = /[a-záéíóúñü]+(?:\.[0-9]+)+|[a-záéíóúñü]+-[a-záéíóúñü0-9]+|[a-záéíóúñü]+[0-9]+[a-záéíóúñü]*|[0-9]+(?:\.[0-9]+)?(?:mm|cm|m|kn|mpa|kg|tn|cm2|cm3|cm4)?|[a-záéíóúñü]+/g;

  const tokens = lower.match(tokenRegex) || [];

  // Filtrar stopwords y tokens de 1 carácter (excepto números)
  return tokens.filter(t => {
    if (STOPWORDS.has(t)) return false;
    if (t.length <= 1 && !/[0-9]/.test(t)) return false;
    return true;
  });
}

// --- Tipos del índice ---

interface TermInfo {
  /** Número de documentos que contienen el término */
  df: number;
  /** Postings: docId → frequency */
  postings: Record<string, number>;
}

interface BM25Index {
  /** Versión del índice */
  version: 1;
  /** Total de documentos */
  totalDocs: number;
  /** Largo promedio de documentos en tokens */
  avgDocLength: number;
  /** Largo de cada documento */
  docLengths: Record<string, number>;
  /** Metadata mínima por documento para poder retornar resultados */
  docMeta: Record<string, { source: string; chunkIndex: number; sourceType: string; normaOrigen?: string; idioma?: string; tema?: string; coleccion?: string }>;
  /** Índice invertido: término → info */
  terms: Record<string, TermInfo>;
}

// Cache en memoria
let bm25Index: BM25Index | null = null;

/**
 * Construye el índice BM25 a partir de los chunks en disco.
 * Lee todos los archivos de chunks/ y crea el índice invertido.
 */
export function buildBM25Index(): BM25Index {
  const chunksDir = path.join(STORE_DIR, 'chunks');
  const manifestPath = path.join(STORE_DIR, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('No hay manifest.json - ejecutá npm run indexar primero');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // También necesitamos metadata de los vectores para sourceType
  const vectorsDir = path.join(STORE_DIR, 'vectors');

  const index: BM25Index = {
    version: 1,
    totalDocs: 0,
    avgDocLength: 0,
    docLengths: {},
    docMeta: {},
    terms: {},
  };

  let totalLength = 0;

  for (const sourceInfo of manifest.sources) {
    const sourceName = sourceInfo.name;
    const safeFilename = sourceName.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Cargar chunks (contenido)
    const chunksFile = path.join(chunksDir, `${safeFilename}.json`);
    if (!fs.existsSync(chunksFile)) continue;

    const chunksData: Record<string, string> = JSON.parse(fs.readFileSync(chunksFile, 'utf-8'));

    // Cargar metadata de vectores para sourceType y metadata enriquecida
    let sourceType = 'pdf';
    let normaOrigen: string | undefined;
    let idioma: string | undefined;
    let tema: string | undefined;
    let coleccion: string | undefined;
    const vecFile = path.join(vectorsDir, `${safeFilename}.vec.json`);
    if (fs.existsSync(vecFile)) {
      const vecData = JSON.parse(fs.readFileSync(vecFile, 'utf-8'));
      if (vecData.documents?.length > 0) {
        const firstMeta = vecData.documents[0].metadata;
        sourceType = firstMeta.sourceType || 'pdf';
        normaOrigen = firstMeta.normaOrigen;
        idioma = firstMeta.idioma;
        tema = firstMeta.tema;
        coleccion = firstMeta.coleccion;
      }
    }

    // Indexar cada chunk
    for (const [chunkIdx, content] of Object.entries(chunksData)) {
      const docId = `${sourceName}-chunk-${chunkIdx}`;
      const tokens = tokenize(content as string);

      index.totalDocs++;
      index.docLengths[docId] = tokens.length;
      index.docMeta[docId] = {
        source: sourceName,
        chunkIndex: parseInt(chunkIdx),
        sourceType,
        normaOrigen,
        idioma,
        tema,
        coleccion,
      };
      totalLength += tokens.length;

      // Contar frecuencias de términos
      const termFreqs: Map<string, number> = new Map();
      for (const token of tokens) {
        termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
      }

      // Agregar al índice invertido (hasOwn evita colisión con prototype keys como "constructor")
      for (const [term, freq] of termFreqs) {
        if (!Object.hasOwn(index.terms, term)) {
          index.terms[term] = { df: 0, postings: {} };
        }
        index.terms[term].df++;
        index.terms[term].postings[docId] = freq;
      }
    }
  }

  index.avgDocLength = index.totalDocs > 0 ? totalLength / index.totalDocs : 0;

  return index;
}

/**
 * Guarda el índice BM25 a disco.
 */
export function saveBM25Index(index: BM25Index): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
  fs.writeFileSync(BM25_INDEX_PATH, JSON.stringify(index));
  bm25Index = index;

  const sizeBytes = fs.statSync(BM25_INDEX_PATH).size;
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
  console.log(`[BM25] Índice guardado: ${index.totalDocs} docs, ${Object.keys(index.terms).length} términos, ${sizeMB} MB`);
}

/**
 * Carga el índice BM25 desde disco (lazy, con cache).
 */
export function loadBM25Index(): BM25Index | null {
  if (bm25Index) return bm25Index;

  if (!fs.existsSync(BM25_INDEX_PATH)) {
    console.log('[BM25] No hay índice BM25 - se usará solo búsqueda semántica');
    return null;
  }

  const start = performance.now();
  bm25Index = JSON.parse(fs.readFileSync(BM25_INDEX_PATH, 'utf-8'));
  const ms = Math.round(performance.now() - start);
  console.log(`[BM25] Índice cargado: ${bm25Index!.totalDocs} docs, ${Object.keys(bm25Index!.terms).length} términos (${ms}ms)`);

  return bm25Index;
}

/**
 * Calcula score BM25 de un documento para una query.
 */
function scoreBM25(
  queryTokens: string[],
  docId: string,
  index: BM25Index,
): number {
  const docLen = index.docLengths[docId] || 0;
  let score = 0;

  for (const token of queryTokens) {
    if (!Object.hasOwn(index.terms, token)) continue;
    const termInfo = index.terms[token];

    const tf = termInfo.postings[docId] || 0;
    if (tf === 0) continue;

    // IDF: log((N - df + 0.5) / (df + 0.5) + 1)
    const idf = Math.log(
      (index.totalDocs - termInfo.df + 0.5) / (termInfo.df + 0.5) + 1
    );

    // TF component: (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLen / avgDL))
    const tfNorm = (tf * (K1 + 1)) /
      (tf + K1 * (1 - B + B * docLen / index.avgDocLength));

    score += idf * tfNorm;
  }

  return score;
}

export interface BM25Result {
  docId: string;
  score: number;
  source: string;
  chunkIndex: number;
  sourceType: string;
}

/**
 * Busca documentos usando BM25.
 * Retorna los top N resultados ordenados por score BM25.
 */
export function searchBM25(
  query: string,
  limit: number = 10,
  filter?: Record<string, string>,
): BM25Result[] {
  const index = loadBM25Index();
  if (!index) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Obtener documentos candidatos (que tienen al menos un token de la query)
  const candidateIds = new Set<string>();
  for (const token of queryTokens) {
    if (!Object.hasOwn(index.terms, token)) continue;
    const termInfo = index.terms[token];
    for (const docId of Object.keys(termInfo.postings)) {
      candidateIds.add(docId);
    }
  }

  // Scorear candidatos
  const results: BM25Result[] = [];

  for (const docId of candidateIds) {
    const meta = index.docMeta[docId];
    if (!meta) continue;

    // Aplicar filtro
    if (filter) {
      let matches = true;
      for (const [key, value] of Object.entries(filter)) {
        if ((meta as Record<string, unknown>)[key] !== value) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
    }

    const score = scoreBM25(queryTokens, docId, index);
    if (score > 0) {
      results.push({
        docId,
        score,
        source: meta.source,
        chunkIndex: meta.chunkIndex,
        sourceType: meta.sourceType,
      });
    }
  }

  // Ordenar por score descendente
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Verifica si el índice BM25 existe.
 */
export function bm25IndexExists(): boolean {
  return fs.existsSync(BM25_INDEX_PATH);
}
