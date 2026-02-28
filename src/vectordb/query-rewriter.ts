/**
 * Query Rewriter - Reescribe queries para mejorar el retrieval
 *
 * Usa gpt-4o-mini para expandir abreviaturas, agregar sinónimos técnicos,
 * y reformular queries de ingeniería estructural argentina.
 *
 * Costo: ~$0.00005 por query
 */

import { getOpenAIClient } from './embeddings.js';

const REWRITE_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `Sos un experto en ingeniería estructural argentina. Reescribí la consulta del usuario para mejorar la búsqueda en documentos técnicos.

Reglas ESTRICTAS:
- Mantené la query CORTA (máximo 8-12 palabras). NO agregues oraciones extra.
- Solo expandí abreviaturas obvias (ej: "FLT" → "pandeo lateral torsional", "LT" → "lateral torsional")
- NO agregues sinónimos ni paréntesis explicativos
- Mantené EXACTOS: números de sección, norma, perfil, unidades (CIRSOC 301, F.2.1, HEB 200, 345 MPa)
- Si la query ya es clara y técnica, devolvela TAL CUAL sin cambios
- Respondé SOLO con la query reescrita, nada más`;

/**
 * Reescribe una query usando LLM para mejorar el retrieval.
 * Retorna la query reescrita y el tiempo en ms.
 */
export async function rewriteQuery(
  query: string,
): Promise<{ rewritten: string; rewriteMs: number }> {
  const start = performance.now();

  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: REWRITE_MODEL,
      temperature: 0,
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
    });

    const rewritten = response.choices[0]?.message?.content?.trim() || query;
    const rewriteMs = Math.round(performance.now() - start);

    return { rewritten, rewriteMs };
  } catch (error) {
    console.error('[QueryRewriter] Error:', (error as Error).message);
    // Fallback: retornar query original
    return {
      rewritten: query,
      rewriteMs: Math.round(performance.now() - start),
    };
  }
}
