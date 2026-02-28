/**
 * Script para sincronizar todo desde el proyecto original
 *
 * Uso: npm run sync
 */

import { execSync } from 'child_process';
import * as path from 'path';

const SOURCE_PROJECT = 'C:\\Users\\Hernan Soto\\App calculo estructural\\structcalc-pro';

console.log('🔄 Sincronizando datos desde proyecto original...\n');

try {
  // 1. Re-exportar datos del proyecto original
  console.log('📦 Exportando datos del proyecto original...');
  execSync('npx tsx export-data.ts', {
    cwd: SOURCE_PROJECT,
    stdio: 'inherit',
  });

  console.log('\n🔨 Recompilando servidor MCP...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n✅ Sincronización completa!');
  console.log('\n📋 Cambios aplicados:');
  console.log('   ✓ Perfiles actualizados');
  console.log('   ✓ Normas actualizadas');
  console.log('   ✓ Contextos wizard actualizados');
  console.log('   ✓ Servidor recompilado');
  console.log('\n⚡ Próximos pasos:');
  console.log('   - Los cambios están disponibles inmediatamente');
  console.log('   - Si Claude Code está abierto, los cambios se aplican automáticamente');
  console.log('   - Prueba con: List available resources');

} catch (error: any) {
  console.error('\n❌ Error durante la sincronización:', error.message);
  process.exit(1);
}
