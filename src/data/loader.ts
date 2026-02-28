/**
 * Loader de Datos
 *
 * Carga todos los assets en memoria al iniciar el servidor
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { PerfilEstructural } from '../types/perfiles.js';
import type { NormaInfo } from '../types/normas.js';
import type { WizardStageContext } from '../types/wizard.js';
import type { MaterialCosto } from '../types/costos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datos en memoria
export let PERFILES: PerfilEstructural[] = [];
export let NORMAS: NormaInfo[] = [];
export let WIZARD_STAGES: Record<number, WizardStageContext> = {};
export let COSTOS: MaterialCosto[] = [];
export let PDF_METADATA: Array<{
  id: string;
  titulo: string;
  ruta: string;
  descripcion: string;
}> = [];

export async function initializeData() {
  const knowledgeDir = path.join(__dirname, '..', '..', 'knowledge');

  // Cargar perfiles
  const perfilesPath = path.join(knowledgeDir, 'perfiles', 'perfiles.json');
  const perfilesData = await fs.readFile(perfilesPath, 'utf-8');
  PERFILES = JSON.parse(perfilesData);

  // Cargar normas
  const normasPath = path.join(knowledgeDir, 'normas', 'contextos.json');
  const normasData = await fs.readFile(normasPath, 'utf-8');
  NORMAS = JSON.parse(normasData);

  // Cargar wizard
  const wizardPath = path.join(knowledgeDir, 'wizard', 'wizard-context.json');
  const wizardData = await fs.readFile(wizardPath, 'utf-8');
  WIZARD_STAGES = JSON.parse(wizardData);

  // Cargar costos CSV
  const costosPath = path.join(knowledgeDir, 'costos', 'materiales-hierro.csv');
  COSTOS = await parseCostosCSV(costosPath);

  // Cargar metadata de PDFs
  const pdfsDir = path.join(knowledgeDir, 'normas', 'pdfs');
  PDF_METADATA = await loadPDFMetadata(pdfsDir);

  console.error(`  - ${PERFILES.length} perfiles cargados`);
  console.error(`  - ${NORMAS.length} normas cargadas`);
  console.error(`  - ${Object.keys(WIZARD_STAGES).length} etapas wizard cargadas`);
  console.error(`  - ${COSTOS.length} materiales cargados`);
  console.error(`  - ${PDF_METADATA.length} PDFs indexados`);
}

async function parseCostosCSV(filePath: string): Promise<MaterialCosto[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  return lines.slice(1).map(line => {
    const parts = line.split(',');
    const codigo = parts[0]?.trim() || '';
    const descripcion = parts[1]?.trim() || '';
    const rubro = parts[2]?.trim() || '';
    const tipo = parts[3]?.trim() || '';
    const presentacion = parts[4]?.trim() || '';
    const costoStr = parts[5]?.trim() || '0';

    // Parsear formato argentino: "16.292,19" → 16292.19
    const costo = parseFloat(
      costoStr.replace(/"/g, '').replace(/\./g, '').replace(',', '.')
    );

    return {
      codigo,
      descripcion,
      rubro,
      tipo,
      presentacion,
      costoUnitario: isNaN(costo) ? 0 : costo,
    };
  });
}

async function loadPDFMetadata(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    return [];
  }
  const files = await fs.readdir(dir);

  return files
    .filter(f => f.endsWith('.pdf'))
    .map(filename => {
      const id = filename.replace('.pdf', '').toLowerCase().replace(/\s+/g, '-');
      return {
        id,
        titulo: normalizarTitulo(filename),
        ruta: path.join(dir, filename),
        descripcion: getDescripcionPorNombre(filename),
      };
    });
}

function normalizarTitulo(filename: string): string {
  return filename
    .replace('.pdf', '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
}

function getDescripcionPorNombre(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('cirsoc') && lower.includes('301')) {
    return 'Reglamento Argentino de Estructuras de Acero';
  }
  if (lower.includes('cirsoc') && lower.includes('102')) {
    return 'Acción del Viento sobre las Construcciones';
  }
  if (lower.includes('une') && lower.includes('76')) {
    return 'Aparatos de Elevación - Puentes Grúa';
  }
  if (lower.includes('ahmsa')) {
    return 'Manual de Perfiles Estructurales AHMSA';
  }
  if (lower.includes('memoria')) {
    return 'Ejemplo de Memoria de Cálculo de Nave Industrial';
  }
  if (lower.includes('astm')) {
    return 'Norma ASTM - Especificaciones de Acero';
  }

  return 'Documento técnico';
}
