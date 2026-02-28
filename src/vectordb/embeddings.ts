/**
 * Módulo de embeddings usando OpenAI
 */

import OpenAI from 'openai';

// Cliente de OpenAI (se inicializa con la API key del environment)
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY no está configurada. ' +
        'Configúrala en las variables de entorno o en un archivo .env'
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Genera embeddings para un texto usando OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Genera embeddings para múltiples textos en batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();

  // OpenAI permite hasta 2048 inputs por request
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });

    const embeddings = response.data.map(d => d.embedding);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * Dimensión de los embeddings (text-embedding-3-small = 1536)
 */
export const EMBEDDING_DIMENSION = 1536;
