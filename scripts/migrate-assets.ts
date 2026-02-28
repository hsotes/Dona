/**
 * Script de Migración de Assets
 *
 * Copia y serializa todos los assets del proyecto original
 * al servidor MCP.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_PROJECT = 'C:\\Users\\Hernan Soto\\App calculo estructural\\structcalc-pro';
const TARGET_DIR = path.join(__dirname, '..', 'knowledge');
const TYPES_DIR = path.join(__dirname, '..', 'src', 'types');

async function main() {
  console.log('🚀 Iniciando migración de assets...\n');

  try {
    // 1. Migrar tipos TypeScript
    console.log('📋 Copiando tipos TypeScript...');
    await migrateTypes();
    console.log('✓ Tipos copiados\n');

    // 2. Migrar perfiles
    console.log('🔩 Serializando perfiles estructurales...');
    await migratePerfiles();
    console.log('✓ Perfiles serializados\n');

    // 3. Migrar costos
    console.log('💰 Copiando catálogo de costos...');
    await migrateCostos();
    console.log('✓ Costos copiados\n');

    // 4. Migrar PDFs
    console.log('📄 Copiando PDFs de normativas...');
    await migratePDFs();
    console.log('✓ PDFs copiados\n');

    // 5. Migrar contextos
    console.log('📚 Serializando contextos de normas...');
    await migrateNormasContext();
    console.log('✓ Contextos de normas serializados\n');

    // 6. Migrar wizard context
    console.log('🧙 Serializando contexto del wizard...');
    await migrateWizardContext();
    console.log('✓ Contexto del wizard serializado\n');

    console.log('✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

async function migrateTypes() {
  // Leer archivo de perfiles para extraer tipos
  const perfilesSource = path.join(SOURCE_PROJECT, 'src', 'data', 'perfiles', 'index.ts');
  const perfilesContent = await fs.readFile(perfilesSource, 'utf-8');

  // Extraer la interface PerfilEstructural
  const perfilInterface = perfilesContent.match(/export interface PerfilEstructural \{[\s\S]*?\n\}/)?.[0];

  if (!perfilInterface) {
    throw new Error('No se pudo extraer PerfilEstructural interface');
  }

  await fs.writeFile(
    path.join(TYPES_DIR, 'perfiles.ts'),
    `${perfilInterface}\n`
  );

  // Leer archivo de normasContext para extraer tipos
  const normasSource = path.join(SOURCE_PROJECT, 'src', 'data', 'normasContext.ts');
  const normasContent = await fs.readFile(normasSource, 'utf-8');

  const normaInterface = normasContent.match(/export interface NormaInfo \{[\s\S]*?\n\}/)?.[0];

  if (!normaInterface) {
    throw new Error('No se pudo extraer NormaInfo interface');
  }

  await fs.writeFile(
    path.join(TYPES_DIR, 'normas.ts'),
    `${normaInterface}\n`
  );

  // Leer archivo de wizardContext para extraer tipos
  const wizardSource = path.join(SOURCE_PROJECT, 'src', 'data', 'wizardContext.ts');
  const wizardContent = await fs.readFile(wizardSource, 'utf-8');

  const wizardInterface = wizardContent.match(/export interface WizardStageContext \{[\s\S]*?\n\}/)?.[0];

  if (!wizardInterface) {
    throw new Error('No se pudo extraer WizardStageContext interface');
  }

  await fs.writeFile(
    path.join(TYPES_DIR, 'wizard.ts'),
    `${wizardInterface}\n`
  );

  // Crear tipo para costos
  await fs.writeFile(
    path.join(TYPES_DIR, 'costos.ts'),
    `export interface MaterialCosto {
  codigo: string;
  descripcion: string;
  rubro: string;
  tipo: string;
  presentacion: string;
  costoUnitario: number;
}

export interface ConsultaCosto {
  query?: string;
  tipo?: string;
  rubro?: string;
  maxResultados?: number;
}
`
  );

  console.log('  - perfiles.ts');
  console.log('  - normas.ts');
  console.log('  - wizard.ts');
  console.log('  - costos.ts');
}

async function migratePerfiles() {
  // Usar import dinámico para importar el módulo
  const perfilesModulePath = path.join(SOURCE_PROJECT, 'src', 'data', 'perfiles', 'index.ts');

  try {
    // Import dinámico
    const { TODOS_LOS_PERFILES } = await import(perfilesModulePath);

    await fs.writeFile(
      path.join(TARGET_DIR, 'perfiles', 'perfiles.json'),
      JSON.stringify(TODOS_LOS_PERFILES, null, 2)
    );

    console.log(`  - ${TODOS_LOS_PERFILES.length} perfiles serializados`);
  } catch (error) {
    console.warn('  ⚠️  No se pudo importar directamente, intentando parsear manualmente...');

    // Fallback: extraer manualmente
    const content = await fs.readFile(perfilesModulePath, 'utf-8');

    // Buscar TODOS_LOS_PERFILES y extraerlo
    const match = content.match(/export const TODOS_LOS_PERFILES[^=]*=\s*\[[\s\S]*?\n\];/);

    if (!match) {
      throw new Error('No se encontró TODOS_LOS_PERFILES en el archivo');
    }

    // Extraer el array como texto y convertir a JSON válido
    let arrayText = match[0]
      .replace(/export const TODOS_LOS_PERFILES[^=]*=\s*/, '')
      .replace(/;\s*$/, '');

    // Parsear manualmente los objetos
    const perfiles: any[] = [];
    const objectMatches = arrayText.matchAll(/\{[^}]+\}/g);

    for (const objMatch of objectMatches) {
      try {
        // Convertir formato TypeScript a JSON válido
        let objText = objMatch[0]
          .replace(/(\w+):/g, '"$1":') // Agregar comillas a las claves
          .replace(/'/g, '"'); // Cambiar comillas simples por dobles

        const obj = JSON.parse(objText);
        perfiles.push(obj);
      } catch (e) {
        console.warn(`  ⚠️  Error parseando perfil, saltando...`);
      }
    }

    await fs.writeFile(
      path.join(TARGET_DIR, 'perfiles', 'perfiles.json'),
      JSON.stringify(perfiles, null, 2)
    );

    console.log(`  - ${perfiles.length} perfiles serializados (modo manual)`);
  }
}

async function migrateCostos() {
  const source = path.join(SOURCE_PROJECT, 'src', 'assets', 'materiales', 'Materiales - Hierro.csv');
  const target = path.join(TARGET_DIR, 'costos', 'materiales-hierro.csv');

  await fs.copyFile(source, target);

  const stats = await fs.stat(target);
  console.log(`  - materiales-hierro.csv (${Math.round(stats.size / 1024)}KB)`);
}

async function migratePDFs() {
  const sourceDir = path.join(SOURCE_PROJECT, 'src', 'assets', 'normas');
  const targetDir = path.join(TARGET_DIR, 'normas', 'pdfs');

  const files = await fs.readdir(sourceDir);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));

  for (const file of pdfFiles) {
    await fs.copyFile(
      path.join(sourceDir, file),
      path.join(targetDir, file)
    );
    console.log(`  - ${file}`);
  }

  console.log(`  Total: ${pdfFiles.length} PDFs`);
}

async function migrateNormasContext() {
  const source = path.join(SOURCE_PROJECT, 'src', 'data', 'normasContext.ts');

  try {
    // Import dinámico
    const { NORMAS_CONTEXT } = await import(source);

    await fs.writeFile(
      path.join(TARGET_DIR, 'normas', 'contextos.json'),
      JSON.stringify(NORMAS_CONTEXT, null, 2)
    );

    console.log(`  - ${NORMAS_CONTEXT.length} normas serializadas`);
  } catch (error) {
    console.warn('  ⚠️  No se pudo importar directamente, copiando archivo completo...');

    // Fallback: copiar el archivo completo
    await fs.copyFile(
      source,
      path.join(TARGET_DIR, 'normas', 'normasContext.ts')
    );

    console.log('  - Archivo copiado (procesar manualmente)');
  }
}

async function migrateWizardContext() {
  const source = path.join(SOURCE_PROJECT, 'src', 'data', 'wizardContext.ts');

  try {
    // Import dinámico
    const { WIZARD_STAGES } = await import(source);

    await fs.writeFile(
      path.join(TARGET_DIR, 'wizard', 'wizard-context.json'),
      JSON.stringify(WIZARD_STAGES, null, 2)
    );

    const stageCount = Object.keys(WIZARD_STAGES).length;
    console.log(`  - ${stageCount} etapas serializadas`);
  } catch (error) {
    console.warn('  ⚠️  No se pudo importar directamente, copiando archivo completo...');

    // Fallback: copiar el archivo completo
    await fs.copyFile(
      source,
      path.join(TARGET_DIR, 'wizard', 'wizardContext.ts')
    );

    console.log('  - Archivo copiado (procesar manualmente)');
  }
}

main();
