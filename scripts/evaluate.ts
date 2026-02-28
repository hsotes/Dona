#!/usr/bin/env tsx
/**
 * Runner de evaluación del pipeline RAG
 *
 * Ejecuta el test set contra diferentes configuraciones y muestra métricas.
 *
 * Uso:
 *   npx tsx scripts/evaluate.ts                          # Todas las configs
 *   npx tsx scripts/evaluate.ts --method semantic        # Solo semántico
 *   npx tsx scripts/evaluate.ts --method hybrid          # Solo híbrido
 *   npx tsx scripts/evaluate.ts --rewrite                # Con query rewriting
 *   npx tsx scripts/evaluate.ts --rerank                 # Con re-ranking
 *   npx tsx scripts/evaluate.ts --all                    # Comparar todas las combinaciones
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
import { multiStepSearch } from '../src/vectordb/multistep-search.js';
import { evaluateQuery, aggregateMetrics, type EvalResult } from '../src/evaluation/metrics.js';

interface TestQuery {
  id: string;
  query: string;
  category: string;
  expectedSources: string[];
  expectedKeywords: string[];
}

interface TestSet {
  version: number;
  queries: TestQuery[];
}

interface EvalConfig {
  name: string;
  method: SearchMethod | 'multistep';
  rewrite: boolean;
  rerank: boolean;
}

async function runEvaluation(config: EvalConfig, queries: TestQuery[]): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const q of queries) {
    try {
      let searchResults;

      if (config.method === 'multistep') {
        const ms = await multiStepSearch({
          query: q.query,
          limit: 5,
          rewrite: config.rewrite,
          rerank: config.rerank,
        });
        searchResults = ms.results;
      } else {
        const hs = await hybridSearch({
          query: q.query,
          limit: 5,
          method: config.method,
          rewrite: config.rewrite,
          rerank: config.rerank,
        });
        searchResults = hs.results;
      }

      // Extraer sources únicos de resultados
      const retrievedSources = [...new Set(searchResults.map(r => r.metadata.source))];

      const evalResult = evaluateQuery(
        q.id,
        q.query,
        q.category,
        retrievedSources,
        q.expectedSources,
      );

      results.push(evalResult);

      // Progress indicator
      const symbol = evalResult.recallAtK > 0 ? '✓' : '✗';
      process.stdout.write(symbol);
    } catch (error) {
      console.error(`\nError en query "${q.id}": ${(error as Error).message}`);
      results.push(evaluateQuery(q.id, q.query, q.category, [], q.expectedSources));
      process.stdout.write('E');
    }
  }

  console.log('');
  return results;
}

function printResults(configName: string, results: EvalResult[]) {
  const agg = aggregateMetrics(results);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${configName}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Queries:    ${agg.count}`);
  console.log(`  Recall@5:   ${(agg.avgRecall * 100).toFixed(1)}%`);
  console.log(`  Precision@5: ${(agg.avgPrecision * 100).toFixed(1)}%`);
  console.log(`  MRR:        ${agg.avgMRR.toFixed(3)}`);
  console.log(`  NDCG:       ${agg.avgNDCG.toFixed(3)}`);

  console.log(`\n  Por categoría:`);
  for (const [cat, stats] of Object.entries(agg.byCategory)) {
    console.log(`    ${cat.padEnd(20)} Recall: ${(stats.avgRecall * 100).toFixed(0)}%  MRR: ${stats.avgMRR.toFixed(2)}  (n=${stats.count})`);
  }

  // Mostrar queries fallidas
  const failed = results.filter(r => r.recallAtK === 0 && r.expectedSources.length > 0);
  if (failed.length > 0) {
    console.log(`\n  Queries sin hits (${failed.length}):`);
    for (const f of failed.slice(0, 10)) {
      console.log(`    [${f.queryId}] "${f.query}"`);
      console.log(`      Expected: ${f.expectedSources.join(', ')}`);
      console.log(`      Got:      ${f.retrievedSources.join(', ') || '(vacío)'}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Cargar test set
  const testSetPath = path.join(process.cwd(), 'evaluation', 'test-set.json');
  if (!fs.existsSync(testSetPath)) {
    console.error('No se encontró evaluation/test-set.json');
    process.exit(1);
  }

  const testSet: TestSet = JSON.parse(fs.readFileSync(testSetPath, 'utf-8'));
  console.log(`Cargado test set: ${testSet.queries.length} queries\n`);

  // Determinar configuraciones a evaluar
  const configs: EvalConfig[] = [];

  if (args.includes('--all')) {
    configs.push(
      { name: 'Semantic only', method: 'semantic', rewrite: false, rerank: false },
      { name: 'Semantic + Rewrite', method: 'semantic', rewrite: true, rerank: false },
      { name: 'Hybrid (RRF)', method: 'hybrid', rewrite: false, rerank: false },
      { name: 'Hybrid + Rewrite', method: 'hybrid', rewrite: true, rerank: false },
      { name: 'Hybrid + Rewrite + Rerank', method: 'hybrid', rewrite: true, rerank: true },
      { name: 'MultiStep + Rewrite', method: 'multistep', rewrite: true, rerank: false },
    );
  } else if (args.includes('--multistep')) {
    configs.push(
      { name: 'MultiStep + Rewrite', method: 'multistep', rewrite: true, rerank: false },
    );
  } else {
    const method = (args.find(a => a === '--method') ? args[args.indexOf('--method') + 1] : 'hybrid') as SearchMethod;
    const rewrite = args.includes('--rewrite');
    const rerank = args.includes('--rerank');

    const name = [
      method.charAt(0).toUpperCase() + method.slice(1),
      rewrite ? '+ Rewrite' : '',
      rerank ? '+ Rerank' : '',
    ].filter(Boolean).join(' ');

    configs.push({ name, method, rewrite, rerank });
  }

  // Ejecutar evaluaciones
  const allResults: { config: string; results: EvalResult[] }[] = [];

  for (const config of configs) {
    console.log(`\nEvaluando: ${config.name}...`);
    const results = await runEvaluation(config, testSet.queries);
    printResults(config.name, results);
    allResults.push({ config: config.name, results });
  }

  // Tabla comparativa si hay múltiples configs
  if (allResults.length > 1) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log('  COMPARATIVA');
    console.log(`${'═'.repeat(70)}`);
    console.log(`  ${'Config'.padEnd(35)} Recall  Prec   MRR    NDCG`);
    console.log(`  ${'-'.repeat(65)}`);
    for (const { config, results } of allResults) {
      const agg = aggregateMetrics(results);
      console.log(
        `  ${config.padEnd(35)} ` +
        `${(agg.avgRecall * 100).toFixed(1).padStart(5)}%  ` +
        `${(agg.avgPrecision * 100).toFixed(1).padStart(5)}%  ` +
        `${agg.avgMRR.toFixed(3).padStart(5)}  ` +
        `${agg.avgNDCG.toFixed(3).padStart(5)}`
      );
    }
  }
}

main().catch((error) => {
  console.error(`Error fatal: ${error.message}`);
  process.exit(1);
});
