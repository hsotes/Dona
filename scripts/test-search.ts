#!/usr/bin/env tsx
/**
 * Script para probar búsqueda semántica
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

import { searchDocuments } from '../src/vectordb/index.js';

async function main() {
  const query = process.argv[2] || 'pandeo lateral torsional';

  console.log('\n=== Búsqueda Semántica ===');
  console.log(`Query: "${query}"\n`);

  const results = await searchDocuments(query, 3);

  if (results.length === 0) {
    console.log('No se encontraron resultados.');
    return;
  }

  results.forEach((r, i) => {
    console.log(`[${i+1}] ${r.metadata.source}`);
    console.log(`    Relevancia: ${((1-r.distance) * 100).toFixed(1)}%`);
    console.log(`    Extracto: ${r.content.substring(0, 350).replace(/\n/g, ' ')}...\n`);
  });
}

main().catch(console.error);
