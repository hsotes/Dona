/**
 * Script para agregar PDFs al MCP fácilmente
 *
 * Uso: npm run add-pdf <ruta-al-pdf>
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = process.argv[2];
const pdfDir = path.join(__dirname, '..', 'knowledge', 'normas', 'pdfs');

if (!pdfPath) {
  console.error('❌ Error: Debes especificar la ruta al PDF');
  console.error('\nUso:');
  console.error('  npm run add-pdf <ruta-al-pdf>');
  console.error('\nEjemplo:');
  console.error('  npm run add-pdf "C:\\Descargas\\cirsoc-201.pdf"');
  process.exit(1);
}

async function addPDF() {
  try {
    // Verificar que el archivo existe
    await fs.access(pdfPath);

    const filename = path.basename(pdfPath);
    const target = path.join(pdfDir, filename);

    // Verificar que es un PDF
    if (!filename.toLowerCase().endsWith('.pdf')) {
      throw new Error('El archivo debe ser un PDF');
    }

    // Copiar PDF
    await fs.copyFile(pdfPath, target);

    // Generar URI
    const id = filename
      .replace('.pdf', '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    console.log('✅ PDF agregado exitosamente!');
    console.log(`\n📄 Archivo: ${filename}`);
    console.log(`🔗 URI: pdf://${id}`);
    console.log(`📍 Ubicación: ${target}`);
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Ejecuta: npm run build');
    console.log('   2. Reinicia Claude Code (si está abierto)');
    console.log('   3. Verifica con: List available resources');

  } catch (error: any) {
    console.error('❌ Error al agregar PDF:', error.message);
    process.exit(1);
  }
}

addPDF();
