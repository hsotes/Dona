#!/usr/bin/env tsx
/**
 * Test rápido de búsqueda híbrida
 *
 * Uso:
 *   npx tsx scripts/test-hybrid.ts "CIRSOC 301 pandeo lateral"
 *   npx tsx scripts/test-hybrid.ts "HEB 200 momento plástico" --method bm25
 *   npx tsx scripts/test-hybrid.ts "diseño de conexiones" --rewrite --rerank
 */

import * as fs from 'fs';
import * as path from 'path';

// Cargar .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) process.env[key] = value;
    }
  }
}

import { hybridSearch, type SearchMethod } from '../src/vectordb/hybrid-search.js';
import { bm25IndexExists } from '../src/vectordb/bm25.js';

async function main() {
  const args = process.argv.slice(2);

  // Extraer query (todo lo que no sea un flag)
  const query = args.filter(a => !a.startsWith('--')).join(' ');
  if (!query) {
    console.log('Uso: npx tsx scripts/test-hybrid.ts "tu consulta" [--method semantic|bm25|hybrid] [--rewrite] [--rerank]');
    process.exit(1);
  }

  const methodIdx = args.indexOf('--method');
  const method = (methodIdx !== -1 ? args[methodIdx + 1] : 'hybrid') as SearchMethod;
  const rewrite = args.includes('--rewrite');
  const rerank = args.includes('--rerank');

  console.log(`Query: "${query}"`);
  console.log(`Method: ${method} | Rewrite: ${rewrite} | Rerank: ${rerank}`);
  console.log(`BM25 index: ${bm25IndexExists() ? 'disponible' : 'NO disponible'}`);
  console.log('');

  const { results, timings, method: usedMethod, rewrittenQuery } = await hybridSearch({
    query,
    limit: 5,
    method,
    rewrite,
    rerank,
  });

  if (rewrittenQuery) {
    console.log(`Query reescrita: "${rewrittenQuery}"`);
  }
  console.log(`Método usado: ${usedMethod}`);
  console.log(`Timings: embedding=${timings.embeddingMs}ms bm25=${timings.bm25Ms}ms search=${timings.searchMs}ms fusion=${timings.fusionMs}ms rewrite=${timings.rewriteMs}ms rerank=${timings.rerankMs}ms total=${timings.totalMs}ms`);
  console.log(`\nResultados (${results.length}):\n`);

  for (const [i, r] of results.entries()) {
    const similarity = (1 - r.distance).toFixed(3);
    console.log(`${i + 1}. [${similarity}] ${r.metadata.source} (chunk ${r.metadata.chunkIndex})`);
    console.log(`   ${r.content.slice(0, 150).replace(/\n/g, ' ')}...`);
    console.log('');
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
