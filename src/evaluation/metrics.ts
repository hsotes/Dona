/**
 * Métricas de evaluación para RAG
 *
 * Recall@K, Precision@K, MRR, NDCG
 */

export interface EvalResult {
  queryId: string;
  query: string;
  category: string;
  recallAtK: number;
  precisionAtK: number;
  mrr: number;
  ndcg: number;
  retrievedSources: string[];
  expectedSources: string[];
  hits: string[];
  misses: string[];
}

/**
 * Recall@K: Fracción de documentos relevantes que fueron recuperados.
 * recall = |retrieved ∩ expected| / |expected|
 */
export function recallAtK(
  retrievedSources: string[],
  expectedSources: string[],
): number {
  if (expectedSources.length === 0) return 1; // No hay expectativas → perfecto

  const retrieved = new Set(retrievedSources);
  const hits = expectedSources.filter(s => retrieved.has(s));

  return hits.length / expectedSources.length;
}

/**
 * Precision@K: Fracción de documentos recuperados que son relevantes.
 * precision = |retrieved ∩ expected| / |retrieved|
 */
export function precisionAtK(
  retrievedSources: string[],
  expectedSources: string[],
): number {
  if (retrievedSources.length === 0) return 0;
  if (expectedSources.length === 0) return 0; // Si no hay esperados, no hay "aciertos"

  const expected = new Set(expectedSources);
  const hits = retrievedSources.filter(s => expected.has(s));

  return hits.length / retrievedSources.length;
}

/**
 * Mean Reciprocal Rank: 1/rank del primer resultado relevante.
 */
export function meanReciprocalRank(
  retrievedSources: string[],
  expectedSources: string[],
): number {
  if (expectedSources.length === 0) return 1;

  const expected = new Set(expectedSources);

  for (let i = 0; i < retrievedSources.length; i++) {
    if (expected.has(retrievedSources[i])) {
      return 1 / (i + 1);
    }
  }

  return 0;
}

/**
 * Normalized Discounted Cumulative Gain.
 * Mide la calidad del ranking considerando la posición de los resultados relevantes.
 */
export function ndcg(
  retrievedSources: string[],
  expectedSources: string[],
): number {
  if (expectedSources.length === 0) return 1;

  const expected = new Set(expectedSources);

  // DCG: sum(rel_i / log2(i + 2))
  let dcg = 0;
  for (let i = 0; i < retrievedSources.length; i++) {
    const rel = expected.has(retrievedSources[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2);
  }

  // Ideal DCG: todos los relevantes primero
  let idcg = 0;
  const idealCount = Math.min(expectedSources.length, retrievedSources.length);
  for (let i = 0; i < idealCount; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg > 0 ? dcg / idcg : 0;
}

/**
 * Evalúa una query individual contra ground truth.
 */
export function evaluateQuery(
  queryId: string,
  query: string,
  category: string,
  retrievedSources: string[],
  expectedSources: string[],
): EvalResult {
  const expectedSet = new Set(expectedSources);
  const retrievedSet = new Set(retrievedSources);

  return {
    queryId,
    query,
    category,
    recallAtK: recallAtK(retrievedSources, expectedSources),
    precisionAtK: precisionAtK(retrievedSources, expectedSources),
    mrr: meanReciprocalRank(retrievedSources, expectedSources),
    ndcg: ndcg(retrievedSources, expectedSources),
    retrievedSources,
    expectedSources,
    hits: expectedSources.filter(s => retrievedSet.has(s)),
    misses: expectedSources.filter(s => !retrievedSet.has(s)),
  };
}

/**
 * Calcula métricas agregadas sobre un conjunto de evaluaciones.
 */
export function aggregateMetrics(results: EvalResult[]): {
  count: number;
  avgRecall: number;
  avgPrecision: number;
  avgMRR: number;
  avgNDCG: number;
  byCategory: Record<string, { count: number; avgRecall: number; avgMRR: number }>;
} {
  const avg = (arr: number[]) => arr.length > 0
    ? arr.reduce((a, b) => a + b, 0) / arr.length
    : 0;

  const byCategory: Record<string, EvalResult[]> = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }

  const categoryStats: Record<string, { count: number; avgRecall: number; avgMRR: number }> = {};
  for (const [cat, items] of Object.entries(byCategory)) {
    categoryStats[cat] = {
      count: items.length,
      avgRecall: avg(items.map(i => i.recallAtK)),
      avgMRR: avg(items.map(i => i.mrr)),
    };
  }

  return {
    count: results.length,
    avgRecall: avg(results.map(r => r.recallAtK)),
    avgPrecision: avg(results.map(r => r.precisionAtK)),
    avgMRR: avg(results.map(r => r.mrr)),
    avgNDCG: avg(results.map(r => r.ndcg)),
    byCategory: categoryStats,
  };
}
