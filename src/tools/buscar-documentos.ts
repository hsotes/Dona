/**
 * Tool: buscar_documentos
 *
 * Búsqueda en documentos vectorizados (PDFs, manuales, bibliografía)
 * Soporta: semántica, keyword (BM25), e híbrida (RRF).
 */

import { getStoreStats, type SearchResult } from '../vectordb/index.js';
import { hybridSearch, type SearchMethod } from '../vectordb/hybrid-search.js';
import { multiStepSearch } from '../vectordb/multistep-search.js';
import { logQuery, createQueryId } from '../utils/logger.js';

export const buscarDocumentosSchema = {
  name: 'buscar_documentos',
  description: 'Busca información en la bibliografía técnica vectorizada (libros, normas, manuales) usando búsqueda semántica. Útil para encontrar conceptos, fórmulas, procedimientos de cálculo, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      consulta: {
        type: 'string',
        description: 'La pregunta o tema a buscar (ej: "cómo calcular pandeo lateral torsional", "coeficiente de arriostramiento", "diseño de conexiones")',
      },
      tipoFuente: {
        type: 'string',
        enum: ['pdf', 'manual', 'norma', 'todos'],
        description: 'Filtrar por tipo de documento (default: todos)',
        default: 'todos',
      },
      limite: {
        type: 'number',
        description: 'Número máximo de fragmentos a retornar (default: 5)',
        default: 5,
      },
      normaOrigen: {
        type: 'string',
        description: 'Filtrar por norma de origen (ej: "CIRSOC 301", "AISC 360", "AWS D1.1", "AISI S100", "Tekla Structures")',
      },
      tema: {
        type: 'string',
        description: 'Filtrar por tema (ej: "diseño acero", "soldadura", "conexiones", "conformado frio", "software", "placas base", "cargas viento")',
      },
      coleccion: {
        type: 'string',
        enum: ['norma', 'libro', 'memoria', 'software', 'material', 'pliego', 'todos'],
        description: 'Filtrar por tipo de colección: norma (reglamentos CIRSOC/AISI/AWS), libro (McCormac/AISC Manual/AHMSA), memoria (ejemplos/tesis/memorias de cálculo), software (Tekla/SAP2000), material (ASTM), pliego. Default: todos',
        default: 'todos',
      },
    },
    required: ['consulta'],
  },
};

interface BuscarDocumentosArgs {
  consulta: string;
  tipoFuente?: 'pdf' | 'manual' | 'norma' | 'todos';
  limite?: number;
  normaOrigen?: string;
  tema?: string;
  coleccion?: 'norma' | 'libro' | 'memoria' | 'software' | 'material' | 'pliego' | 'todos';
}

export async function buscarDocumentosTool(args: BuscarDocumentosArgs) {
  const { consulta, tipoFuente = 'todos', limite = 5, normaOrigen, tema, coleccion = 'todos' } = args;

  try {
    // Construir filtro combinando todos los criterios
    const filter: Record<string, string> = {};
    if (tipoFuente !== 'todos') filter.sourceType = tipoFuente;
    if (normaOrigen) filter.normaOrigen = normaOrigen;
    if (tema) filter.tema = tema;
    if (coleccion !== 'todos') filter.coleccion = coleccion;
    const filterOrUndefined = Object.keys(filter).length > 0 ? filter : undefined;

    const queryId = createQueryId();

    // Si el usuario no filtró por colección, usar multi-step (detección automática + diversidad)
    // Si filtró explícitamente, usar hybrid directo (ya está focalizado)
    const useMultiStep = coleccion === 'todos';

    let results: SearchResult[];
    let timings: { embeddingMs: number; bm25Ms: number; searchMs: number; fusionMs?: number; rewriteMs: number; rerankMs: number; totalMs: number };
    let method: string;
    let rewrittenQuery: string | undefined;

    if (useMultiStep) {
      const ms = await multiStepSearch({
        query: consulta,
        limit: limite,
        filter: filterOrUndefined,
        rewrite: true,
        rerank: false,
      });
      results = ms.results;
      timings = ms.timings;
      method = ms.detectedCollection ? `multistep(${ms.detectedCollection})` : 'multistep';
      rewrittenQuery = ms.rewrittenQuery;
    } else {
      const hs = await hybridSearch({
        query: consulta,
        limit: limite,
        filter: filterOrUndefined,
        method: 'hybrid',
        rewrite: true,
        rerank: false,
      });
      results = hs.results;
      timings = hs.timings;
      method = hs.method;
      rewrittenQuery = hs.rewrittenQuery;
    }

    // Formatear resultados para el LLM con nivel de confianza
    const fragmentos = results.map((r, idx) => {
      const similarity = 1 - r.distance;
      let confianza: 'alta' | 'media' | 'baja';
      if (similarity > 0.7) confianza = 'alta';
      else if (similarity > 0.5) confianza = 'media';
      else confianza = 'baja';

      return {
        numero: idx + 1,
        fuente: r.metadata.source,
        tipo: r.metadata.sourceType,
        titulo: r.metadata.title || r.metadata.source,
        relevancia: similarity.toFixed(3),
        confianza,
        contenido: r.content,
      };
    });

    // Logear la query
    logQuery({
      queryId,
      timestamp: new Date().toISOString(),
      originalQuery: consulta,
      rewrittenQuery,
      searchMethod: method,
      filter: filterOrUndefined,
      topK: limite,
      resultsCount: results.length,
      results: results.map((r, idx) => ({
        id: r.id,
        source: r.metadata.source,
        score: parseFloat((1 - r.distance).toFixed(4)),
        rank: idx + 1,
      })),
      timings: {
        embeddingMs: timings.embeddingMs,
        bm25Ms: timings.bm25Ms,
        searchMs: timings.searchMs,
        rerankMs: timings.rerankMs,
        rewriteMs: timings.rewriteMs,
        totalMs: timings.totalMs,
      },
    });

    return {
      consulta,
      tipoFuente,
      metodo: method,
      resultados: fragmentos.length,
      fragmentos,
      nota: fragmentos.length === 0
        ? 'No se encontraron documentos relevantes. Verifica que los documentos estén indexados con: npm run indexar'
        : `Se encontraron ${fragmentos.length} fragmentos relevantes. Los fragmentos están ordenados por relevancia.`,
      nota_grounding: 'IMPORTANTE: Basá tu respuesta EXCLUSIVAMENTE en los fragmentos proporcionados. No inventes datos técnicos, valores numéricos ni referencias a normas. Si la información no está en los fragmentos, indicá que no se encontró en la bibliografía disponible. Citá la fuente de cada dato que uses.',
    };
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage.includes('OPENAI_API_KEY')) {
      return {
        error: 'La búsqueda semántica requiere configurar OPENAI_API_KEY',
        solucion: 'Configura la variable de entorno OPENAI_API_KEY con tu API key de OpenAI',
      };
    }

    if (errorMessage.includes('Collection') || errorMessage.includes('empty')) {
      return {
        error: 'El vector store está vacío',
        solucion: 'Ejecuta "npm run indexar" para indexar los documentos',
      };
    }

    return {
      error: `Error en la búsqueda: ${errorMessage}`,
    };
  }
}

/**
 * Tool auxiliar para ver estadísticas del vector store
 */
export const estadisticasVectorStoreSchema = {
  name: 'estadisticas_vectorstore',
  description: 'Muestra estadísticas del vector store: cuántos documentos están indexados y cuáles son',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function estadisticasVectorStoreTool() {
  try {
    const stats = await getStoreStats();

    return {
      totalChunks: stats.totalChunks,
      documentosIndexados: stats.sources.length,
      documentos: stats.sources.sort(),
      estado: stats.totalChunks > 0 ? 'activo' : 'vacío',
      nota: stats.totalChunks === 0
        ? 'El vector store está vacío. Ejecuta "npm run indexar" para indexar documentos.'
        : `Vector store activo con ${stats.totalChunks} fragmentos de ${stats.sources.length} documentos.`,
    };
  } catch (error) {
    return {
      error: `Error obteniendo estadísticas: ${(error as Error).message}`,
      estado: 'error',
    };
  }
}
