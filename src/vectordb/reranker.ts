/**
 * Re-ranker con LLM - Puntúa relevancia de chunks vs query
 *
 * Usa gpt-4o-mini para evaluar cada chunk candidato contra la query.
 * Se aplica después de la búsqueda inicial (over-fetch → rerank → top N).
 *
 * Costo: ~$0.0004 por query (20 chunks candidatos)
 */

import { getOpenAIClient } from './embeddings.js';
import type { SearchResult } from './store.js';

const RERANK_MODEL = 'gpt-4o-mini';
const MAX_CHUNK_CHARS = 500;

const SYSTEM_PROMPT = `Sos un experto en ingeniería estructural. Evaluá la relevancia de cada fragmento respecto a la consulta del usuario.

Para cada fragmento, asigná un score de 0 a 10:
- 10: Responde directamente la consulta
- 7-9: Muy relevante, contiene información útil
- 4-6: Parcialmente relevante
- 1-3: Poco relevante
- 0: Irrelevante

Respondé SOLO con un JSON array de números (los scores en orden). Ejemplo: [8, 3, 10, 5, 1]`;

/**
 * Re-rankea resultados de búsqueda usando LLM.
 * Recibe candidatos y retorna los top N reordenados por relevancia LLM.
 */
export async function rerankResults(
  query: string,
  candidates: SearchResult[],
  topN: number = 5,
): Promise<{ results: SearchResult[]; rerankMs: number }> {
  const start = performance.now();

  if (candidates.length === 0) {
    return { results: [], rerankMs: 0 };
  }

  // Si hay pocos candidatos, no vale la pena re-rankear
  if (candidates.length <= topN) {
    return {
      results: candidates,
      rerankMs: Math.round(performance.now() - start),
    };
  }

  try {
    const client = getOpenAIClient();

    // Construir prompt con fragmentos truncados
    const fragments = candidates.map((c, i) => {
      const truncated = c.content.length > MAX_CHUNK_CHARS
        ? c.content.slice(0, MAX_CHUNK_CHARS) + '...'
        : c.content;
      return `[${i + 1}] ${truncated}`;
    }).join('\n\n');

    const userPrompt = `Consulta: "${query}"\n\nFragmentos:\n${fragments}\n\nScores (JSON array de ${candidates.length} números):`;

    const response = await client.chat.completions.create({
      model: RERANK_MODEL,
      temperature: 0,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';

    // Parsear scores
    const scores = parseScores(content, candidates.length);

    // Combinar con candidatos y reordenar
    const scored = candidates.map((c, i) => ({
      result: c,
      rerankScore: scores[i] ?? 0,
    }));

    scored.sort((a, b) => b.rerankScore - a.rerankScore);

    const results = scored.slice(0, topN).map(s => s.result);
    const rerankMs = Math.round(performance.now() - start);

    return { results, rerankMs };
  } catch (error) {
    console.error('[Reranker] Error:', (error as Error).message);
    // Fallback: retornar los primeros topN sin cambio
    return {
      results: candidates.slice(0, topN),
      rerankMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Parsea la respuesta del LLM como array de scores.
 * Tolera formatos imperfectos.
 */
function parseScores(content: string, expectedLength: number): number[] {
  try {
    // Intentar extraer JSON array del contenido
    const match = content.match(/\[[\d\s,. ]+\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        return parsed.map(n => Math.min(10, Math.max(0, Number(n) || 0)));
      }
    }
  } catch {
    // Fallback: intentar parsear números separados por coma
    const numbers = content.match(/\d+(\.\d+)?/g);
    if (numbers) {
      return numbers.map(n => Math.min(10, Math.max(0, parseFloat(n))));
    }
  }

  // Default: scores iguales
  return new Array(expectedLength).fill(5);
}
