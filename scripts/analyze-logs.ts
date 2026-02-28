/**
 * Análisis de logs de queries RAG
 *
 * Lee logs/queries.jsonl y muestra estadísticas:
 * - Total de queries
 * - Timings promedio (embedding, search, total)
 * - Top fuentes más retornadas
 * - Distribución de scores
 *
 * Uso: npx tsx scripts/analyze-logs.ts [--last N]
 */

import * as fs from 'fs';
import { getLogFilePath, type QueryLog } from '../src/utils/logger.js';

function loadLogs(lastN?: number): QueryLog[] {
  const logFile = getLogFilePath();

  if (!fs.existsSync(logFile)) {
    console.log('No hay archivo de logs todavía.');
    process.exit(0);
  }

  const lines = fs.readFileSync(logFile, 'utf-8')
    .split('\n')
    .filter(line => line.trim().length > 0);

  let logs: QueryLog[] = lines.map(line => JSON.parse(line));

  if (lastN && lastN > 0) {
    logs = logs.slice(-lastN);
  }

  return logs;
}

function analyzeTimings(logs: QueryLog[]) {
  const timings = logs.map(l => l.timings);

  const avg = (arr: number[]) => arr.length > 0
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : 0;

  const p95 = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
  };

  const embeddingTimes = timings.map(t => t.embeddingMs ?? 0);
  const searchTimes = timings.map(t => t.searchMs ?? 0);
  const totalTimes = timings.map(t => t.totalMs);

  console.log('\n=== TIMINGS ===');
  console.log(`  Embedding:  avg=${avg(embeddingTimes)}ms  p95=${p95(embeddingTimes)}ms`);
  console.log(`  Search:     avg=${avg(searchTimes)}ms  p95=${p95(searchTimes)}ms`);
  console.log(`  Total:      avg=${avg(totalTimes)}ms  p95=${p95(totalTimes)}ms`);
}

function analyzeResults(logs: QueryLog[]) {
  // Top fuentes
  const sourceCounts: Map<string, number> = new Map();
  const allScores: number[] = [];

  for (const log of logs) {
    for (const r of log.results) {
      sourceCounts.set(r.source, (sourceCounts.get(r.source) || 0) + 1);
      allScores.push(r.score);
    }
  }

  const topSources = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n=== TOP FUENTES ===');
  for (const [source, count] of topSources) {
    console.log(`  ${count.toString().padStart(4)}x  ${source}`);
  }

  // Distribución de scores
  if (allScores.length > 0) {
    const sorted = [...allScores].sort((a, b) => a - b);
    console.log('\n=== SCORES ===');
    console.log(`  Min:    ${sorted[0].toFixed(4)}`);
    console.log(`  Median: ${sorted[Math.floor(sorted.length / 2)].toFixed(4)}`);
    console.log(`  Max:    ${sorted[sorted.length - 1].toFixed(4)}`);
    console.log(`  >0.7:   ${allScores.filter(s => s > 0.7).length}/${allScores.length}`);
    console.log(`  >0.5:   ${allScores.filter(s => s > 0.5).length}/${allScores.length}`);
    console.log(`  <0.3:   ${allScores.filter(s => s < 0.3).length}/${allScores.length}`);
  }
}

function analyzeMethods(logs: QueryLog[]) {
  const methods: Map<string, number> = new Map();
  for (const log of logs) {
    methods.set(log.searchMethod, (methods.get(log.searchMethod) || 0) + 1);
  }

  console.log('\n=== MÉTODOS DE BÚSQUEDA ===');
  for (const [method, count] of methods) {
    console.log(`  ${method}: ${count}`);
  }
}

// Main
const args = process.argv.slice(2);
const lastIdx = args.indexOf('--last');
const lastN = lastIdx !== -1 ? parseInt(args[lastIdx + 1]) : undefined;

const logs = loadLogs(lastN);

console.log(`=== ANÁLISIS DE LOGS RAG ===`);
console.log(`  Total queries: ${logs.length}`);
if (logs.length > 0) {
  console.log(`  Desde: ${logs[0].timestamp}`);
  console.log(`  Hasta: ${logs[logs.length - 1].timestamp}`);
}

if (logs.length === 0) {
  console.log('\nNo hay queries registradas.');
  process.exit(0);
}

analyzeTimings(logs);
analyzeResults(logs);
analyzeMethods(logs);

console.log('\n=== ÚLTIMAS 5 QUERIES ===');
for (const log of logs.slice(-5)) {
  const topScore = log.results.length > 0
    ? log.results[0].score.toFixed(3)
    : 'n/a';
  console.log(`  [${log.timings.totalMs}ms] "${log.originalQuery}" → ${log.resultsCount} results (top: ${topScore})`);
}
