#!/usr/bin/env tsx
/**
 * Script para indexar documentos en el vector store
 *
 * Uso:
 *   npx tsx scripts/indexar-documentos.ts              # Indexa todo
 *   npx tsx scripts/indexar-documentos.ts --pdfs       # Solo PDFs del RAG
 *   npx tsx scripts/indexar-documentos.ts --manuales   # Solo manuales
 *   npx tsx scripts/indexar-documentos.ts --biblio     # Solo bibliografía externa
 *   npx tsx scripts/indexar-documentos.ts --archivo <ruta>  # Un archivo específico
 *   npx tsx scripts/indexar-documentos.ts --stats      # Ver estadísticas
 *   npx tsx scripts/indexar-documentos.ts --reindex    # Re-indexar todo (borra existente)
 *   npx tsx scripts/indexar-documentos.ts --rebuild-bm25  # Reconstruir índice BM25
 */

import * as fs from 'fs';
import * as path from 'path';

// Cargar .env si existe
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}
import {
  addDocuments,
  isDocumentIndexed,
  deleteDocumentsBySource,
  getStoreStats,
  processPDF,
  processTextFile,
  processDirectory,
  buildBM25Index,
  saveBM25Index,
  type DocumentChunk,
} from '../src/vectordb/index.js';

// Rutas
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const PDFS_DIR = path.join(KNOWLEDGE_DIR, 'normas', 'pdfs');
const MANUALES_DIR = path.join(KNOWLEDGE_DIR, 'manuales');
const BIBLIO_DIR = 'C:\\Users\\Hernan Soto\\Documents\\Cálculo estructural';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Indexa un archivo específico
 */
async function indexarArchivo(
  filePath: string,
  sourceType: 'pdf' | 'manual' | 'norma',
  forceReindex: boolean = false
): Promise<number> {
  const fileName = path.basename(filePath);

  // Verificar si ya está indexado
  if (!forceReindex && await isDocumentIndexed(fileName)) {
    logWarning(`${fileName} ya está indexado. Usa --reindex para re-indexar.`);
    return 0;
  }

  // Si es reindex, eliminar chunks existentes
  if (forceReindex) {
    await deleteDocumentsBySource(fileName);
  }

  const ext = path.extname(filePath).toLowerCase();
  let chunks: DocumentChunk[] = [];

  try {
    if (ext === '.pdf') {
      chunks = await processPDF(filePath, sourceType);
    } else if (['.md', '.txt', '.markdown'].includes(ext)) {
      chunks = processTextFile(filePath, sourceType as 'manual');
    } else {
      logError(`Formato no soportado: ${ext}`);
      return 0;
    }

    if (chunks.length > 0) {
      await addDocuments(chunks);
      logSuccess(`${fileName}: ${chunks.length} chunks indexados`);
    }

    return chunks.length;
  } catch (error) {
    logError(`Error indexando ${fileName}: ${(error as Error).message}`);
    return 0;
  }
}

/**
 * Indexa todos los archivos de un directorio
 */
async function indexarDirectorio(
  dirPath: string,
  sourceType: 'pdf' | 'manual' | 'norma',
  forceReindex: boolean = false
): Promise<number> {
  if (!fs.existsSync(dirPath)) {
    logWarning(`Directorio no existe: ${dirPath}`);
    return 0;
  }

  const files = fs.readdirSync(dirPath);
  let totalChunks = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.pdf' || ['.md', '.txt', '.markdown'].includes(ext)) {
      const chunks = await indexarArchivo(filePath, sourceType, forceReindex);
      totalChunks += chunks;
    }
  }

  return totalChunks;
}

/**
 * Muestra estadísticas del vector store
 */
async function mostrarEstadisticas() {
  try {
    const stats = await getStoreStats();

    console.log('');
    log('═'.repeat(50), 'cyan');
    log('  Estadísticas del Vector Store', 'bold');
    log('═'.repeat(50), 'cyan');
    console.log('');

    logInfo(`Total de chunks: ${stats.totalChunks}`);
    logInfo(`Documentos indexados: ${stats.sources.length}`);
    console.log('');

    if (stats.sources.length > 0) {
      log('Documentos:', 'bold');
      for (const source of stats.sources.sort()) {
        console.log(`  - ${source}`);
      }
    }
  } catch (error) {
    logError(`Error obteniendo estadísticas: ${(error as Error).message}`);
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  console.log('');
  log('═'.repeat(50), 'cyan');
  log('  RAG Estructuras - Indexador de Documentos', 'bold');
  log('═'.repeat(50), 'cyan');
  console.log('');

  // Verificar API key
  if (!process.env.OPENAI_API_KEY) {
    logError('OPENAI_API_KEY no está configurada.');
    logInfo('Configúrala ejecutando:');
    console.log('  $env:OPENAI_API_KEY="tu-api-key"  (PowerShell)');
    console.log('  set OPENAI_API_KEY=tu-api-key    (CMD)');
    console.log('  export OPENAI_API_KEY=tu-api-key (Bash)');
    process.exit(1);
  }

  const forceReindex = args.includes('--reindex');

  // Mostrar estadísticas
  if (args.includes('--stats')) {
    await mostrarEstadisticas();
    return;
  }

  // Solo reconstruir BM25 sin indexar
  if (args.includes('--rebuild-bm25') && args.length === 1) {
    log('\n🔍 Reconstruyendo índice BM25...', 'bold');
    const bm25Start = performance.now();
    const bm25Index = buildBM25Index();
    saveBM25Index(bm25Index);
    const bm25Ms = Math.round(performance.now() - bm25Start);
    logSuccess(`Índice BM25 construido: ${bm25Index.totalDocs} docs, ${Object.keys(bm25Index.terms).length} términos (${bm25Ms}ms)`);
    return;
  }

  // Indexar archivo específico
  if (args.includes('--archivo')) {
    const idx = args.indexOf('--archivo');
    const filePath = args[idx + 1];

    if (!filePath) {
      logError('Debe especificar la ruta del archivo');
      process.exit(1);
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      logError(`Archivo no encontrado: ${absolutePath}`);
      process.exit(1);
    }

    const chunks = await indexarArchivo(absolutePath, 'pdf', forceReindex);
    logSuccess(`Total: ${chunks} chunks indexados`);
    return;
  }

  let totalChunks = 0;

  // Indexar PDFs del RAG
  if (args.length === 0 || args.includes('--pdfs') || args.includes('--all')) {
    log('\n📚 Indexando PDFs del RAG...', 'bold');
    const chunks = await indexarDirectorio(PDFS_DIR, 'norma', forceReindex);
    totalChunks += chunks;
  }

  // Indexar manuales
  if (args.length === 0 || args.includes('--manuales') || args.includes('--all')) {
    log('\n📖 Indexando manuales...', 'bold');
    const chunks = await indexarDirectorio(MANUALES_DIR, 'manual', forceReindex);
    totalChunks += chunks;
  }

  // Indexar bibliografía externa
  if (args.includes('--biblio') || args.includes('--all')) {
    log('\n📕 Indexando bibliografía externa...', 'bold');

    if (fs.existsSync(BIBLIO_DIR)) {
      const chunks = await indexarDirectorio(BIBLIO_DIR, 'pdf', forceReindex);
      totalChunks += chunks;
    } else {
      logWarning(`Directorio de bibliografía no encontrado: ${BIBLIO_DIR}`);
    }
  }

  console.log('');
  log('═'.repeat(50), 'cyan');
  logSuccess(`Indexación completada: ${totalChunks} chunks totales`);
  log('═'.repeat(50), 'cyan');
  console.log('');

  // Construir índice BM25 si se pidió o si hubo indexación nueva
  if (args.includes('--rebuild-bm25') || totalChunks > 0) {
    log('\n🔍 Construyendo índice BM25...', 'bold');
    const bm25Start = performance.now();
    const bm25Index = buildBM25Index();
    saveBM25Index(bm25Index);
    const bm25Ms = Math.round(performance.now() - bm25Start);
    logSuccess(`Índice BM25 construido: ${bm25Index.totalDocs} docs, ${Object.keys(bm25Index.terms).length} términos (${bm25Ms}ms)`);
  }

  // Mostrar estadísticas finales
  await mostrarEstadisticas();
}

main().catch((error) => {
  logError(`Error fatal: ${error.message}`);
  process.exit(1);
});
