/**
 * Hybrid Search - Combina BM25 (keyword) + Semantic (embedding)
 *
 * Usa Reciprocal Rank Fusion (RRF) para combinar rankings.
 * Fallback automático a semántico si no hay índice BM25.
 */

import { searchDocumentsWithTimings, searchWithEmbedding, getChunkContent, type SearchResult, type SearchTimings } from './store.js';
import { generateEmbedding } from './embeddings.js';
import { searchBM25, bm25IndexExists, type BM25Result } from './bm25.js';
import { rewriteQuery } from './query-rewriter.js';
import { rerankResults } from './reranker.js';

// RRF constant (estándar: 60)
const DEFAULT_RRF_K = 60;
// Factor de overfetch (buscamos más para tener mejor fusión)
const OVERFETCH_FACTOR = 3;

export type SearchMethod = 'semantic' | 'bm25' | 'hybrid';

export interface HybridSearchOptions {
  query: string;
  limit?: number;
  filter?: Record<string, string>;
  method?: SearchMethod;
  rrfK?: number;
  rewrite?: boolean;
  rerank?: boolean;
  /** Embedding pre-computado para reutilizar (evita llamada extra a API) */
  precomputedEmbedding?: number[];
}

export interface HybridTimings {
  embeddingMs: number;
  bm25Ms: number;
  searchMs: number;
  fusionMs: number;
  rewriteMs: number;
  rerankMs: number;
  totalMs: number;
}

export interface HybridSearchResult {
  results: SearchResult[];
  timings: HybridTimings;
  method: SearchMethod;
  rewrittenQuery?: string;
}

/**
 * Reciprocal Rank Fusion: combina dos rankings en uno.
 * score(d) = sum(1 / (K + rank_i))
 */
function reciprocalRankFusion(
  semanticResults: { id: string; rank: number }[],
  bm25Results: { id: string; rank: number }[],
  rrfK: number,
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const r of semanticResults) {
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (rrfK + r.rank));
  }

  for (const r of bm25Results) {
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (rrfK + r.rank));
  }

  return scores;
}

/**
 * Búsqueda híbrida: combina semántica + BM25 con RRF.
 */
export async function hybridSearch(options: HybridSearchOptions): Promise<HybridSearchResult> {
  const {
    query,
    limit = 5,
    filter,
    method = 'hybrid',
    rrfK = DEFAULT_RRF_K,
    rewrite = false,
    rerank = false,
    precomputedEmbedding,
  } = options;

  const totalStart = performance.now();
  let rewriteMs = 0;
  let rerankMs = 0;
  let rewrittenQuery: string | undefined;

  // Query Rewriting (opcional)
  let searchQuery = query;
  if (rewrite) {
    const rw = await rewriteQuery(query);
    searchQuery = rw.rewritten;
    rewriteMs = rw.rewriteMs;
    rewrittenQuery = rw.rewritten;
  }

  // Con rerank, over-fetching es mayor (20 candidatos → rerank → top N)
  const rerankOverfetch = rerank ? 20 : 0;

  // Solo BM25
  if (method === 'bm25') {
    const fetchLimit = rerank ? rerankOverfetch : limit;
    const bm25Start = performance.now();
    const bm25Results = searchBM25(searchQuery, fetchLimit, filter);
    const bm25Ms = Math.round(performance.now() - bm25Start);

    let results: SearchResult[] = bm25Results.map(r => ({
      id: r.docId,
      content: getChunkContent(r.source, r.chunkIndex),
      metadata: {
        source: r.source,
        sourceType: r.sourceType as 'pdf' | 'manual' | 'norma',
        chunkIndex: r.chunkIndex,
      },
      distance: 1 - (r.score / (bm25Results[0]?.score || 1)),
    }));

    if (rerank && results.length > limit) {
      const rr = await rerankResults(query, results, limit);
      results = rr.results;
      rerankMs = rr.rerankMs;
    }

    return {
      results,
      timings: {
        embeddingMs: 0, bm25Ms, searchMs: 0, fusionMs: 0,
        rewriteMs, rerankMs,
        totalMs: Math.round(performance.now() - totalStart),
      },
      method: 'bm25',
      rewrittenQuery,
    };
  }

  // Solo semántico
  if (method === 'semantic' || !bm25IndexExists()) {
    const fetchLimit = rerank ? rerankOverfetch : limit;

    let semResults: SearchResult[];
    let embeddingMs = 0;
    let searchMs = 0;

    if (precomputedEmbedding) {
      const sr = searchWithEmbedding(precomputedEmbedding, fetchLimit, filter);
      semResults = sr.results;
      searchMs = sr.searchMs;
    } else {
      const sr = await searchDocumentsWithTimings(searchQuery, fetchLimit, filter);
      semResults = sr.results;
      embeddingMs = sr.timings.embeddingMs;
      searchMs = sr.timings.searchMs;
    }

    let results = semResults;
    if (rerank && results.length > limit) {
      const rr = await rerankResults(query, results, limit);
      results = rr.results;
      rerankMs = rr.rerankMs;
    } else {
      results = results.slice(0, limit);
    }

    return {
      results,
      timings: {
        embeddingMs, bm25Ms: 0,
        searchMs, fusionMs: 0,
        rewriteMs, rerankMs,
        totalMs: Math.round(performance.now() - totalStart),
      },
      method: 'semantic',
      rewrittenQuery,
    };
  }

  // Híbrido: overfetch de ambas fuentes → RRF → (rerank →) top N
  const overfetchLimit = rerank
    ? rerankOverfetch
    : limit * OVERFETCH_FACTOR;

  // Ejecutar ambas búsquedas
  const bm25Start = performance.now();
  const bm25Results = searchBM25(searchQuery, overfetchLimit, filter);
  const bm25Ms = Math.round(performance.now() - bm25Start);

  let semanticResults: SearchResult[];
  let semEmbeddingMs = 0;
  let semSearchMs = 0;

  if (precomputedEmbedding) {
    const sr = searchWithEmbedding(precomputedEmbedding, overfetchLimit, filter);
    semanticResults = sr.results;
    semSearchMs = sr.searchMs;
  } else {
    const sr = await searchDocumentsWithTimings(searchQuery, overfetchLimit, filter);
    semanticResults = sr.results;
    semEmbeddingMs = sr.timings.embeddingMs;
    semSearchMs = sr.timings.searchMs;
  }

  // RRF Fusion
  const fusionStart = performance.now();

  const semanticRanked = semanticResults.map((r, idx) => ({
    id: r.id,
    rank: idx + 1,
  }));

  const bm25Ranked = bm25Results.map((r, idx) => ({
    id: r.docId,
    rank: idx + 1,
  }));

  const rrfScores = reciprocalRankFusion(semanticRanked, bm25Ranked, rrfK);

  // Limitar candidatos: si rerank, tomar más para re-rankear
  const fusionLimit = rerank ? rerankOverfetch : limit;
  const sortedIds = [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, fusionLimit)
    .map(([id]) => id);

  // Construir resultados finales
  const semanticMap = new Map(semanticResults.map(r => [r.id, r]));
  const bm25Map = new Map(bm25Results.map(r => [r.docId, r]));

  let finalResults: SearchResult[] = [];
  for (const id of sortedIds) {
    const semResult = semanticMap.get(id);
    if (semResult) {
      finalResults.push(semResult);
      continue;
    }

    const bm25Result = bm25Map.get(id);
    if (bm25Result) {
      finalResults.push({
        id,
        content: getChunkContent(bm25Result.source, bm25Result.chunkIndex),
        metadata: {
          source: bm25Result.source,
          sourceType: bm25Result.sourceType as 'pdf' | 'manual' | 'norma',
          chunkIndex: bm25Result.chunkIndex,
        },
        distance: 0.5,
      });
    }
  }

  const fusionMs = Math.round(performance.now() - fusionStart);

  // Re-ranking (opcional)
  if (rerank && finalResults.length > limit) {
    const rr = await rerankResults(query, finalResults, limit);
    finalResults = rr.results;
    rerankMs = rr.rerankMs;
  } else {
    finalResults = finalResults.slice(0, limit);
  }

  return {
    results: finalResults,
    timings: {
      embeddingMs: semEmbeddingMs,
      bm25Ms,
      searchMs: semSearchMs,
      fusionMs,
      rewriteMs,
      rerankMs,
      totalMs: Math.round(performance.now() - totalStart),
    },
    method: 'hybrid',
    rewrittenQuery,
  };
}
