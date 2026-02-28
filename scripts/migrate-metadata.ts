#!/usr/bin/env tsx
/**
 * Migra metadata en archivos vec.json existentes sin re-generar embeddings.
 *
 * Lee cada vec.json, aplica enrichMetadata() a cada documento,
 * y guarda de vuelta. Costo: $0 (sin llamadas a API).
 *
 * Uso:
 *   npx tsx scripts/migrate-metadata.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { enrichMetadata } from '../src/vectordb/metadata-enricher.js';

const STORE_DIR = path.join(process.cwd(), 'knowledge', 'vectordb');
const VECTORS_DIR = path.join(STORE_DIR, 'vectors');
const MANIFEST_PATH = path.join(STORE_DIR, 'manifest.json');

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('No hay manifest.json - ejecutá npm run indexar primero');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  let totalUpdated = 0;

  console.log(`\nMigrando metadata para ${manifest.sources.length} documentos...\n`);

  for (const sourceInfo of manifest.sources) {
    const sourceName = sourceInfo.name;
    const safeFilename = sourceName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const vecFile = path.join(VECTORS_DIR, `${safeFilename}.vec.json`);

    if (!fs.existsSync(vecFile)) {
      console.log(`  ⚠ ${sourceName}: vec.json no encontrado`);
      continue;
    }

    const vecData = JSON.parse(fs.readFileSync(vecFile, 'utf-8'));
    const enriched = enrichMetadata(sourceName);
    let docUpdated = 0;

    for (const doc of vecData.documents) {
      const meta = doc.metadata;
      let changed = false;

      // Actualizar campos que faltan o difieren
      if (meta.normaOrigen !== enriched.normaOrigen) {
        meta.normaOrigen = enriched.normaOrigen;
        changed = true;
      }
      if (meta.idioma !== enriched.idioma) {
        meta.idioma = enriched.idioma;
        changed = true;
      }
      if (meta.tema !== enriched.tema) {
        meta.tema = enriched.tema;
        changed = true;
      }
      if (meta.coleccion !== enriched.coleccion) {
        meta.coleccion = enriched.coleccion;
        changed = true;
      }

      if (changed) docUpdated++;
    }

    if (docUpdated > 0) {
      fs.writeFileSync(vecFile, JSON.stringify(vecData));
      console.log(`  ✓ ${sourceName}: ${docUpdated} chunks actualizados → coleccion=${enriched.coleccion}, tema=${enriched.tema}`);
      totalUpdated += docUpdated;
    } else {
      console.log(`  - ${sourceName}: sin cambios`);
    }
  }

  console.log(`\n✓ Migración completada: ${totalUpdated} chunks actualizados en total`);
  console.log('  Ahora ejecutá: npm run indexar:bm25   (para reconstruir BM25 con la nueva metadata)');
}

main();
