/**
 * Multi-step Retrieval - Búsqueda en capas con diversidad de fuentes
 *
 * Estrategia:
 * 1. Detectar colección relevante por keywords de la query
 * 2. Si hay colección: búsqueda focalizada + búsqueda global
 * 3. Si no hay colección: solo búsqueda global
 * 4. Merge con diversidad de fuentes (max N del mismo source)
 *
 * Costo adicional: $0 (reutiliza embedding, BM25 es local)
 */

import { generateEmbedding } from './embeddings.js';
import { rewriteQuery } from './query-rewriter.js';
import { hybridSearch, type HybridSearchResult, type HybridTimings } from './hybrid-search.js';
import type { SearchResult } from './store.js';
import type { Coleccion } from './metadata-enricher.js';

export interface MultiStepOptions {
  query: string;
  limit?: number;
  filter?: Record<string, string>;
  rewrite?: boolean;
  rerank?: boolean;
  /** Max resultados del mismo source en output final (default: 2) */
  maxPerSource?: number;
}

export interface MultiStepResult {
  results: SearchResult[];
  timings: HybridTimings & { multiStepMs: number };
  method: 'multistep';
  rewrittenQuery?: string;
  detectedCollection?: Coleccion;
  steps: number;
}

/**
 * Detecta la colección más relevante para una query por keywords.
 * Retorna null si no se detecta una colección específica.
 */
export function detectCollection(query: string): Coleccion | null {
  const lower = query.toLowerCase();

  // Normas y reglamentos
  if (/cirsoc|aisi.?s100|aws.?d1|reglamento\b/.test(lower)) return 'norma';

  // Materiales (especificaciones ASTM)
  if (/\bastm\b|a36[0-9]|a37[0-9]|a313|ensayo.?(?:de\s+)?tracci[oó]n/.test(lower)) return 'material';

  // Software
  if (/\btekla\b|sap.?2000/.test(lower)) return 'software';

  // Memorias de cálculo
  if (/\bmemoria\b|galp[oó]n|nave.?industrial|ejemplo.?de.?c[aá]lculo/.test(lower)) return 'memoria';

  // Pliegos
  if (/\bpliego\b|licitaci[oó]n/.test(lower)) return 'pliego';

  return null;
}

/**
 * Aplica diversidad de fuentes: max N resultados del mismo source.
 * Preserva el orden de relevancia original.
 */
export function enforceSourceDiversity(
  results: SearchResult[],
  limit: number,
  maxPerSource: number = 2,
): SearchResult[] {
  const sourceCounts = new Map<string, number>();
  const diverse: SearchResult[] = [];
  const overflow: SearchResult[] = [];

  for (const r of results) {
    const source = r.metadata.source;
    const count = sourceCounts.get(source) || 0;

    if (count < maxPerSource) {
      diverse.push(r);
      sourceCounts.set(source, count + 1);
    } else {
      overflow.push(r);
    }

    if (diverse.length >= limit) break;
  }

  // Si faltan resultados, completar con overflow
  while (diverse.length < limit && overflow.length > 0) {
    diverse.push(overflow.shift()!);
  }

  return diverse.slice(0, limit);
}

/**
 * Multi-step search: búsqueda focalizada + global con diversidad.
 */
export async function multiStepSearch(options: MultiStepOptions): Promise<MultiStepResult> {
  const {
    query,
    limit = 5,
    filter,
    rewrite = true,
    rerank = false,
    maxPerSource = 2,
  } = options;

  const totalStart = performance.now();
  let rewriteMs = 0;
  let rewrittenQuery: string | undefined;

  // Step 0: Query rewriting
  let searchQuery = query;
  if (rewrite) {
    const rw = await rewriteQuery(query);
    searchQuery = rw.rewritten;
    rewriteMs = rw.rewriteMs;
    rewrittenQuery = rw.rewritten;
  }

  // Step 1: Generar embedding UNA sola vez
  const embStart = performance.now();
  const embedding = await generateEmbedding(searchQuery);
  const embeddingMs = Math.round(performance.now() - embStart);

  // Step 2: Detectar colección relevante
  // Usar query original (sin rewriting) para detección, ya que tiene los keywords del usuario
  const detectedCollection = detectCollection(query);

  const overfetchLimit = limit * 2;
  let steps = 1;
  let allResults: SearchResult[] = [];

  // Step 3: Búsqueda focalizada (si hay colección detectada)
  let narrowTimings: HybridTimings | null = null;
  if (detectedCollection) {
    const narrowFilter = { ...filter, coleccion: detectedCollection };

    const narrowResult = await hybridSearch({
      query: searchQuery,
      limit: overfetchLimit,
      filter: narrowFilter,
      method: 'hybrid',
      rewrite: false, // Ya hicimos rewriting arriba
      rerank: false,
      precomputedEmbedding: embedding,
    });

    allResults.push(...narrowResult.results);
    narrowTimings = narrowResult.timings;
    steps = 2;
  }

  // Step 4: Búsqueda global (siempre)
  const broadResult = await hybridSearch({
    query: searchQuery,
    limit: overfetchLimit,
    filter,
    method: 'hybrid',
    rewrite: false,
    rerank: false,
    precomputedEmbedding: embedding,
  });

  allResults.push(...broadResult.results);

  // Step 5: Deduplicar por ID de chunk
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of allResults) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      deduped.push(r);
    }
  }

  // Step 6: Aplicar diversidad de fuentes
  const finalResults = enforceSourceDiversity(deduped, limit, maxPerSource);

  const multiStepMs = Math.round(performance.now() - totalStart);

  // Combinar timings
  const timings: HybridTimings & { multiStepMs: number } = {
    embeddingMs,
    bm25Ms: (narrowTimings?.bm25Ms || 0) + broadResult.timings.bm25Ms,
    searchMs: (narrowTimings?.searchMs || 0) + broadResult.timings.searchMs,
    fusionMs: (narrowTimings?.fusionMs || 0) + broadResult.timings.fusionMs,
    rewriteMs,
    rerankMs: 0,
    totalMs: multiStepMs,
    multiStepMs,
  };

  return {
    results: finalResults,
    timings,
    method: 'multistep',
    rewrittenQuery,
    detectedCollection: detectedCollection || undefined,
    steps,
  };
}
