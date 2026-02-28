#!/usr/bin/env tsx
/**
 * Script para cargar datos al RAG de Estructuras
 *
 * Uso:
 *   npx tsx scripts/cargar-datos.ts perfiles <archivo.json>
 *   npx tsx scripts/cargar-datos.ts costos <archivo.csv>
 *   npx tsx scripts/cargar-datos.ts pdf <archivo.pdf>
 *   npx tsx scripts/cargar-datos.ts norma <archivo.json>
 *
 * Opciones:
 *   --merge     Combina con datos existentes (default para perfiles y costos)
 *   --replace   Reemplaza todos los datos existentes
 *   --validate  Solo valida sin guardar
 *   --dry-run   Muestra qué haría sin ejecutar cambios
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Rutas base
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const PERFILES_PATH = path.join(KNOWLEDGE_DIR, 'perfiles', 'perfiles.json');
const COSTOS_PATH = path.join(KNOWLEDGE_DIR, 'costos', 'materiales-hierro.csv');
const NORMAS_PATH = path.join(KNOWLEDGE_DIR, 'normas', 'contextos.json');
const PDFS_DIR = path.join(KNOWLEDGE_DIR, 'normas', 'pdfs');
const MANUALES_DIR = path.join(KNOWLEDGE_DIR, 'manuales');

// Tipos válidos de perfiles
const TIPOS_PERFIL = ['IPN', 'IPE', 'UPN', 'HEB', 'HEA', 'HEM'] as const;
type TipoPerfil = typeof TIPOS_PERFIL[number];

// Interface para perfiles
interface PerfilEstructural {
  nombre: string;
  tipo: TipoPerfil;
  designacion: string;
  h: number;
  b: number;
  tw: number;
  tf: number;
  r: number;
  A: number;
  peso: number;
  Ix: number;
  Iy: number;
  Wx: number;
  Wy: number;
  Zx: number;
  Zy: number;
  ix: number;
  iy: number;
  It?: number;
  Iw?: number;
}

// Interface para costos
interface MaterialCosto {
  codigo: string;
  descripcion: string;
  rubro: string;
  tipo: string;
  presentacion: string;
  costoUnitario: number;
}

// Interface para normas
interface NormaInfo {
  codigo: string;
  nombre: string;
  descripcion: string;
  tablasClave?: Record<string, unknown>;
  formulasClave?: Record<string, unknown>;
  valoresNumericos?: Record<string, unknown>;
}

// Colores para la consola
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

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'cyan');
}

// Validar un perfil estructural
function validarPerfil(perfil: unknown, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const p = perfil as Record<string, unknown>;

  // Campos requeridos
  const camposRequeridos = ['nombre', 'tipo', 'designacion', 'h', 'b', 'tw', 'tf', 'r', 'A', 'peso', 'Ix', 'Iy', 'Wx', 'Wy', 'Zx', 'Zy', 'ix', 'iy'];

  for (const campo of camposRequeridos) {
    if (p[campo] === undefined || p[campo] === null) {
      errors.push(`Perfil[${index}]: Campo requerido '${campo}' faltante`);
    }
  }

  // Validar tipo
  if (p.tipo && !TIPOS_PERFIL.includes(p.tipo as TipoPerfil)) {
    errors.push(`Perfil[${index}]: Tipo '${p.tipo}' no válido. Debe ser uno de: ${TIPOS_PERFIL.join(', ')}`);
  }

  // Validar que los valores numéricos sean positivos
  const camposNumericos = ['h', 'b', 'tw', 'tf', 'r', 'A', 'peso', 'Ix', 'Iy', 'Wx', 'Wy', 'Zx', 'Zy', 'ix', 'iy'];
  for (const campo of camposNumericos) {
    if (p[campo] !== undefined && (typeof p[campo] !== 'number' || p[campo] as number <= 0)) {
      errors.push(`Perfil[${index}]: Campo '${campo}' debe ser un número positivo`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Validar un material/costo
function validarMaterial(material: MaterialCosto, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!material.descripcion || material.descripcion.trim() === '') {
    errors.push(`Material[${index}]: Descripción vacía o faltante`);
  }

  if (!material.rubro || material.rubro.trim() === '') {
    errors.push(`Material[${index}]: Rubro vacío o faltante`);
  }

  if (material.costoUnitario !== undefined && (typeof material.costoUnitario !== 'number' || material.costoUnitario < 0)) {
    errors.push(`Material[${index}]: Costo unitario debe ser un número no negativo`);
  }

  return { valid: errors.length === 0, errors };
}

// Parsear CSV de costos
function parsearCSVCostos(contenido: string): MaterialCosto[] {
  const lineas = contenido.split('\n').filter(l => l.trim() !== '');
  const materiales: MaterialCosto[] = [];

  // Saltar header si existe
  const startIndex = lineas[0]?.toLowerCase().includes('codigo') ? 1 : 0;

  for (let i = startIndex; i < lineas.length; i++) {
    const linea = lineas[i];
    // Parsear CSV respetando comillas
    const campos = parsearLineaCSV(linea);

    if (campos.length >= 6) {
      const costoStr = campos[5].replace(/"/g, '').replace(/\./g, '').replace(',', '.');
      const costo = parseFloat(costoStr) || 0;

      materiales.push({
        codigo: campos[0].replace(/"/g, '').trim(),
        descripcion: campos[1].replace(/"/g, '').trim(),
        rubro: campos[2].replace(/"/g, '').trim(),
        tipo: campos[3].replace(/"/g, '').trim(),
        presentacion: campos[4].replace(/"/g, '').trim(),
        costoUnitario: costo,
      });
    }
  }

  return materiales;
}

// Parsear una línea CSV respetando comillas
function parsearLineaCSV(linea: string): string[] {
  const campos: string[] = [];
  let campo = '';
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"') {
      dentroComillas = !dentroComillas;
    } else if (char === ',' && !dentroComillas) {
      campos.push(campo);
      campo = '';
    } else {
      campo += char;
    }
  }
  campos.push(campo);

  return campos;
}

// Generar CSV desde materiales
function generarCSVCostos(materiales: MaterialCosto[]): string {
  const header = 'codigo,descripcion,rubro,tipo,presentacion,costo_presentacion';
  const lineas = materiales.map(m => {
    const costo = m.costoUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${m.codigo},"${m.descripcion}",${m.rubro},${m.tipo},${m.presentacion},"${costo}"`;
  });
  return [header, ...lineas].join('\n');
}

// Cargar perfiles
async function cargarPerfiles(archivoEntrada: string, opciones: { merge: boolean; validate: boolean; dryRun: boolean }) {
  logInfo(`Cargando perfiles desde: ${archivoEntrada}`);

  // Leer archivo de entrada
  if (!fs.existsSync(archivoEntrada)) {
    logError(`Archivo no encontrado: ${archivoEntrada}`);
    process.exit(1);
  }

  let nuevosPerfiles: unknown[];
  try {
    const contenido = fs.readFileSync(archivoEntrada, 'utf-8');
    nuevosPerfiles = JSON.parse(contenido);

    if (!Array.isArray(nuevosPerfiles)) {
      // Si es un objeto único, convertirlo a array
      nuevosPerfiles = [nuevosPerfiles];
    }
  } catch (error) {
    logError(`Error al parsear JSON: ${(error as Error).message}`);
    process.exit(1);
  }

  logInfo(`Encontrados ${nuevosPerfiles.length} perfiles en el archivo`);

  // Validar perfiles
  let erroresTotal = 0;
  for (let i = 0; i < nuevosPerfiles.length; i++) {
    const { valid, errors } = validarPerfil(nuevosPerfiles[i], i);
    if (!valid) {
      erroresTotal++;
      errors.forEach(e => logError(e));
    }
  }

  if (erroresTotal > 0) {
    logError(`Se encontraron errores en ${erroresTotal} perfiles`);
    if (opciones.validate) {
      process.exit(1);
    }
    const continuar = await preguntarUsuario('¿Desea continuar ignorando los perfiles con errores? (s/n): ');
    if (continuar.toLowerCase() !== 's') {
      process.exit(1);
    }
  }

  if (opciones.validate) {
    logSuccess('Validación completada sin errores críticos');
    return;
  }

  // Filtrar perfiles válidos
  const perfilesValidos = nuevosPerfiles.filter((p, i) => validarPerfil(p, i).valid) as PerfilEstructural[];

  // Cargar perfiles existentes si es merge
  let perfilesFinales: PerfilEstructural[] = [];

  if (opciones.merge && fs.existsSync(PERFILES_PATH)) {
    const existentes = JSON.parse(fs.readFileSync(PERFILES_PATH, 'utf-8')) as PerfilEstructural[];
    logInfo(`Perfiles existentes: ${existentes.length}`);

    // Crear mapa de existentes por nombre
    const mapaExistentes = new Map(existentes.map(p => [p.nombre, p]));

    // Agregar nuevos o actualizar existentes
    let agregados = 0;
    let actualizados = 0;

    for (const nuevo of perfilesValidos) {
      if (mapaExistentes.has(nuevo.nombre)) {
        mapaExistentes.set(nuevo.nombre, nuevo);
        actualizados++;
      } else {
        mapaExistentes.set(nuevo.nombre, nuevo);
        agregados++;
      }
    }

    perfilesFinales = Array.from(mapaExistentes.values());
    logInfo(`Perfiles agregados: ${agregados}, actualizados: ${actualizados}`);
  } else {
    perfilesFinales = perfilesValidos;
  }

  // Ordenar por tipo y designación
  perfilesFinales.sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
    return parseInt(a.designacion) - parseInt(b.designacion);
  });

  if (opciones.dryRun) {
    logWarning('Modo dry-run: No se guardarán cambios');
    logInfo(`Se guardarían ${perfilesFinales.length} perfiles`);
    console.log('\nPrimeros 3 perfiles:');
    console.log(JSON.stringify(perfilesFinales.slice(0, 3), null, 2));
    return;
  }

  // Guardar
  fs.writeFileSync(PERFILES_PATH, JSON.stringify(perfilesFinales, null, 2));
  logSuccess(`Guardados ${perfilesFinales.length} perfiles en ${PERFILES_PATH}`);
}

// Cargar costos
async function cargarCostos(archivoEntrada: string, opciones: { merge: boolean; validate: boolean; dryRun: boolean }) {
  logInfo(`Cargando costos desde: ${archivoEntrada}`);

  if (!fs.existsSync(archivoEntrada)) {
    logError(`Archivo no encontrado: ${archivoEntrada}`);
    process.exit(1);
  }

  const extension = path.extname(archivoEntrada).toLowerCase();
  let nuevosMateriales: MaterialCosto[];

  if (extension === '.csv') {
    const contenido = fs.readFileSync(archivoEntrada, 'utf-8');
    nuevosMateriales = parsearCSVCostos(contenido);
  } else if (extension === '.json') {
    const contenido = fs.readFileSync(archivoEntrada, 'utf-8');
    nuevosMateriales = JSON.parse(contenido);
    if (!Array.isArray(nuevosMateriales)) {
      nuevosMateriales = [nuevosMateriales];
    }
  } else {
    logError('Formato no soportado. Use .csv o .json');
    process.exit(1);
  }

  logInfo(`Encontrados ${nuevosMateriales.length} materiales en el archivo`);

  // Validar
  let erroresTotal = 0;
  for (let i = 0; i < nuevosMateriales.length; i++) {
    const { valid, errors } = validarMaterial(nuevosMateriales[i], i);
    if (!valid) {
      erroresTotal++;
      errors.forEach(e => logError(e));
    }
  }

  if (erroresTotal > 0 && opciones.validate) {
    logError(`Se encontraron ${erroresTotal} errores de validación`);
    process.exit(1);
  }

  if (opciones.validate) {
    logSuccess('Validación completada');
    return;
  }

  // Merge o reemplazar
  let materialesFinales: MaterialCosto[] = [];

  if (opciones.merge && fs.existsSync(COSTOS_PATH)) {
    const contenidoExistente = fs.readFileSync(COSTOS_PATH, 'utf-8');
    const existentes = parsearCSVCostos(contenidoExistente);
    logInfo(`Materiales existentes: ${existentes.length}`);

    // Usar descripción como clave única
    const mapaExistentes = new Map(existentes.map(m => [m.descripcion.toLowerCase(), m]));

    let agregados = 0;
    let actualizados = 0;

    for (const nuevo of nuevosMateriales) {
      const clave = nuevo.descripcion.toLowerCase();
      if (mapaExistentes.has(clave)) {
        mapaExistentes.set(clave, nuevo);
        actualizados++;
      } else {
        mapaExistentes.set(clave, nuevo);
        agregados++;
      }
    }

    materialesFinales = Array.from(mapaExistentes.values());
    logInfo(`Materiales agregados: ${agregados}, actualizados: ${actualizados}`);
  } else {
    materialesFinales = nuevosMateriales;
  }

  if (opciones.dryRun) {
    logWarning('Modo dry-run: No se guardarán cambios');
    logInfo(`Se guardarían ${materialesFinales.length} materiales`);
    return;
  }

  // Guardar como CSV
  const csvContenido = generarCSVCostos(materialesFinales);
  fs.writeFileSync(COSTOS_PATH, csvContenido);
  logSuccess(`Guardados ${materialesFinales.length} materiales en ${COSTOS_PATH}`);
}

// Cargar PDF
async function cargarPDF(archivoEntrada: string, opciones: { dryRun: boolean }) {
  logInfo(`Cargando PDF: ${archivoEntrada}`);

  if (!fs.existsSync(archivoEntrada)) {
    logError(`Archivo no encontrado: ${archivoEntrada}`);
    process.exit(1);
  }

  const extension = path.extname(archivoEntrada).toLowerCase();
  if (extension !== '.pdf') {
    logError('El archivo debe ser un PDF');
    process.exit(1);
  }

  const nombreArchivo = path.basename(archivoEntrada);
  const destino = path.join(PDFS_DIR, nombreArchivo);

  // Verificar si ya existe
  if (fs.existsSync(destino)) {
    const sobrescribir = await preguntarUsuario(`El archivo ${nombreArchivo} ya existe. ¿Sobrescribir? (s/n): `);
    if (sobrescribir.toLowerCase() !== 's') {
      logWarning('Operación cancelada');
      return;
    }
  }

  if (opciones.dryRun) {
    logWarning('Modo dry-run: No se copiarán archivos');
    logInfo(`Se copiaría: ${archivoEntrada} → ${destino}`);
    return;
  }

  // Asegurar que el directorio existe
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
  }

  // Copiar archivo
  fs.copyFileSync(archivoEntrada, destino);

  const stats = fs.statSync(destino);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  logSuccess(`PDF copiado: ${destino} (${sizeMB} MB)`);
  logInfo('El PDF será indexado automáticamente al reiniciar el servidor MCP');
}

// Cargar norma
async function cargarNorma(archivoEntrada: string, opciones: { merge: boolean; validate: boolean; dryRun: boolean }) {
  logInfo(`Cargando norma desde: ${archivoEntrada}`);

  if (!fs.existsSync(archivoEntrada)) {
    logError(`Archivo no encontrado: ${archivoEntrada}`);
    process.exit(1);
  }

  let nuevasNormas: NormaInfo[];
  try {
    const contenido = fs.readFileSync(archivoEntrada, 'utf-8');
    const parsed = JSON.parse(contenido);
    nuevasNormas = Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    logError(`Error al parsear JSON: ${(error as Error).message}`);
    process.exit(1);
  }

  logInfo(`Encontradas ${nuevasNormas.length} normas en el archivo`);

  // Validar normas
  for (let i = 0; i < nuevasNormas.length; i++) {
    const norma = nuevasNormas[i];
    if (!norma.codigo || !norma.nombre) {
      logError(`Norma[${i}]: Debe tener 'codigo' y 'nombre'`);
      if (opciones.validate) process.exit(1);
    }
  }

  if (opciones.validate) {
    logSuccess('Validación completada');
    return;
  }

  // Merge o reemplazar
  let normasFinales: NormaInfo[] = [];

  if (opciones.merge && fs.existsSync(NORMAS_PATH)) {
    const existentes = JSON.parse(fs.readFileSync(NORMAS_PATH, 'utf-8')) as NormaInfo[];
    logInfo(`Normas existentes: ${existentes.length}`);

    const mapaExistentes = new Map(existentes.map(n => [n.codigo, n]));

    let agregadas = 0;
    let actualizadas = 0;

    for (const nueva of nuevasNormas) {
      if (mapaExistentes.has(nueva.codigo)) {
        mapaExistentes.set(nueva.codigo, nueva);
        actualizadas++;
      } else {
        mapaExistentes.set(nueva.codigo, nueva);
        agregadas++;
      }
    }

    normasFinales = Array.from(mapaExistentes.values());
    logInfo(`Normas agregadas: ${agregadas}, actualizadas: ${actualizadas}`);
  } else {
    normasFinales = nuevasNormas;
  }

  if (opciones.dryRun) {
    logWarning('Modo dry-run: No se guardarán cambios');
    logInfo(`Se guardarían ${normasFinales.length} normas`);
    return;
  }

  fs.writeFileSync(NORMAS_PATH, JSON.stringify(normasFinales, null, 2));
  logSuccess(`Guardadas ${normasFinales.length} normas en ${NORMAS_PATH}`);
}

// Cargar manual (archivos .md, .txt)
async function cargarManual(archivoEntrada: string, opciones: { dryRun: boolean }) {
  logInfo(`Cargando manual: ${archivoEntrada}`);

  if (!fs.existsSync(archivoEntrada)) {
    logError(`Archivo no encontrado: ${archivoEntrada}`);
    process.exit(1);
  }

  const extension = path.extname(archivoEntrada).toLowerCase();
  if (!['.md', '.txt', '.markdown'].includes(extension)) {
    logError('El archivo debe ser .md, .markdown o .txt');
    process.exit(1);
  }

  const nombreArchivo = path.basename(archivoEntrada);
  const destino = path.join(MANUALES_DIR, nombreArchivo);

  // Verificar si ya existe
  if (fs.existsSync(destino)) {
    const sobrescribir = await preguntarUsuario(`El archivo ${nombreArchivo} ya existe. ¿Sobrescribir? (s/n): `);
    if (sobrescribir.toLowerCase() !== 's') {
      logWarning('Operación cancelada');
      return;
    }
  }

  // Leer y mostrar info del archivo
  const contenido = fs.readFileSync(archivoEntrada, 'utf-8');
  const lineas = contenido.split('\n').length;
  const palabras = contenido.split(/\s+/).length;
  const sizeKB = (Buffer.byteLength(contenido, 'utf-8') / 1024).toFixed(2);

  logInfo(`Archivo: ${nombreArchivo}`);
  logInfo(`Líneas: ${lineas} | Palabras: ${palabras} | Tamaño: ${sizeKB} KB`);

  if (opciones.dryRun) {
    logWarning('Modo dry-run: No se copiarán archivos');
    logInfo(`Se copiaría: ${archivoEntrada} → ${destino}`);
    return;
  }

  // Asegurar que el directorio existe
  if (!fs.existsSync(MANUALES_DIR)) {
    fs.mkdirSync(MANUALES_DIR, { recursive: true });
  }

  // Copiar archivo
  fs.copyFileSync(archivoEntrada, destino);

  logSuccess(`Manual copiado: ${destino}`);
  logInfo('El manual estará disponible en knowledge/manuales/');
}

// Preguntar al usuario
function preguntarUsuario(pregunta: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolve(respuesta);
    });
  });
}

// Mostrar ayuda
function mostrarAyuda() {
  console.log(`
${colors.bold}RAG Estructuras - Script de Carga de Datos${colors.reset}

${colors.cyan}Uso:${colors.reset}
  npx tsx scripts/cargar-datos.ts <comando> <archivo> [opciones]

${colors.cyan}Comandos:${colors.reset}
  perfiles <archivo.json>    Cargar perfiles estructurales
  costos <archivo.csv|json>  Cargar materiales y costos
  pdf <archivo.pdf>          Agregar un PDF de normativa
  norma <archivo.json>       Cargar contextos de normas
  manual <archivo.md|txt>    Agregar un manual o documentación

${colors.cyan}Opciones:${colors.reset}
  --merge      Combina con datos existentes (default)
  --replace    Reemplaza todos los datos existentes
  --validate   Solo valida el archivo sin guardar
  --dry-run    Muestra qué haría sin ejecutar cambios
  --help       Muestra esta ayuda

${colors.cyan}Ejemplos:${colors.reset}
  # Agregar nuevos perfiles HEM
  npx tsx scripts/cargar-datos.ts perfiles ./mis-perfiles-hem.json

  # Validar un archivo CSV de costos
  npx tsx scripts/cargar-datos.ts costos ./precios-2024.csv --validate

  # Agregar un PDF
  npx tsx scripts/cargar-datos.ts pdf ./norma-nueva.pdf

  # Reemplazar todas las normas
  npx tsx scripts/cargar-datos.ts norma ./normas-completas.json --replace

${colors.cyan}Formato de archivos:${colors.reset}

  ${colors.yellow}Perfiles (JSON):${colors.reset}
  [
    {
      "nombre": "HEM 100",
      "tipo": "HEM",
      "designacion": "100",
      "h": 120, "b": 106, "tw": 12, "tf": 20, "r": 12,
      "A": 53.2, "peso": 41.8,
      "Ix": 1143, "Iy": 399,
      "Wx": 190, "Wy": 75.3,
      "Zx": 218, "Zy": 116,
      "ix": 4.63, "iy": 2.74
    }
  ]

  ${colors.yellow}Costos (CSV):${colors.reset}
  codigo,descripcion,rubro,tipo,presentacion,costo_presentacion
  ,ANGULO 1X1/8,Metalúrgica,Angulos,Barra 6m,"5.230,50"

  ${colors.yellow}Norma (JSON):${colors.reset}
  {
    "codigo": "CIRSOC_301",
    "nombre": "Reglamento Argentino de Estructuras de Acero",
    "descripcion": "Norma para diseño de estructuras metálicas",
    "tablasClave": { ... },
    "formulasClave": { ... }
  }
`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    mostrarAyuda();
    process.exit(0);
  }

  const comando = args[0];
  const archivo = args[1];

  const opciones = {
    merge: !args.includes('--replace'),
    validate: args.includes('--validate'),
    dryRun: args.includes('--dry-run'),
  };

  if (!archivo) {
    logError('Debe especificar un archivo');
    mostrarAyuda();
    process.exit(1);
  }

  // Resolver ruta absoluta
  const archivoAbsoluto = path.isAbsolute(archivo) ? archivo : path.resolve(process.cwd(), archivo);

  console.log('');
  log(`${'═'.repeat(50)}`, 'cyan');
  log('  RAG Estructuras - Cargador de Datos', 'bold');
  log(`${'═'.repeat(50)}`, 'cyan');
  console.log('');

  switch (comando) {
    case 'perfiles':
      await cargarPerfiles(archivoAbsoluto, opciones);
      break;
    case 'costos':
      await cargarCostos(archivoAbsoluto, opciones);
      break;
    case 'pdf':
      await cargarPDF(archivoAbsoluto, opciones);
      break;
    case 'norma':
    case 'normas':
      await cargarNorma(archivoAbsoluto, opciones);
      break;
    case 'manual':
    case 'manuales':
    case 'doc':
      await cargarManual(archivoAbsoluto, opciones);
      break;
    default:
      logError(`Comando desconocido: ${comando}`);
      mostrarAyuda();
      process.exit(1);
  }

  console.log('');
}

main().catch((error) => {
  logError(`Error fatal: ${error.message}`);
  process.exit(1);
});
