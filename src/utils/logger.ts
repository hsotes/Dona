/**
 * Logger estructurado para queries RAG
 *
 * Escribe logs en formato JSONL (un JSON por linea) a logs/queries.jsonl
 * Cero dependencias externas.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'queries.jsonl');

export interface QueryLogResult {
  id: string;
  source: string;
  score: number;
  rank: number;
}

export interface QueryLogTimings {
  embeddingMs?: number;
  bm25Ms?: number;
  searchMs?: number;
  rerankMs?: number;
  rewriteMs?: number;
  totalMs: number;
}

export interface QueryLog {
  queryId: string;
  timestamp: string;
  originalQuery: string;
  rewrittenQuery?: string;
  searchMethod: 'semantic' | 'bm25' | 'hybrid';
  filter?: Record<string, string>;
  topK: number;
  resultsCount: number;
  results: QueryLogResult[];
  timings: QueryLogTimings;
}

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

export function logQuery(log: QueryLog): void {
  try {
    ensureLogsDir();
    const line = JSON.stringify(log) + '\n';
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch (err) {
    // No romper el servidor si el logging falla
    console.error('[Logger] Error escribiendo log:', (err as Error).message);
  }
}

export function createQueryId(): string {
  return randomUUID();
}

export function getLogFilePath(): string {
  return LOG_FILE;
}
