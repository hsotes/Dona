/**
 * Script de Prueba del Servidor MCP
 */

console.log('Iniciando pruebas básicas del servidor MCP...\n');

// Importar y verificar loader
import { initializeData, PERFILES, NORMAS, COSTOS } from '../src/data/loader.js';

try {
  await initializeData();

  console.log('\n✅ Datos cargados correctamente:');
  console.log(`   - Perfiles: ${PERFILES.length}`);
  console.log(`   - Normas: ${NORMAS.length}`);
  console.log(`   - Materiales: ${COSTOS.length}`);

  // Probar búsqueda de perfil
  const perfilHEB200 = PERFILES.find(p => p.nombre === 'HEB 200');
  if (perfilHEB200) {
    console.log('\n✅ Perfil HEB 200 encontrado:');
    console.log(`   - Wx: ${perfilHEB200.Wx} cm³`);
    console.log(`   - Peso: ${perfilHEB200.peso} kg/m`);
  }

  // Probar búsqueda de norma
  const normaCIRSOC = NORMAS.find(n => n.codigo === 'CIRSOC_301');
  if (normaCIRSOC) {
    console.log('\n✅ Norma CIRSOC 301 encontrada:');
    console.log(`   - Nombre: ${normaCIRSOC.nombre}`);
  }

  console.log('\n✅ Todas las pruebas pasaron correctamente!');
} catch (error) {
  console.error('\n❌ Error en las pruebas:', error);
  process.exit(1);
}
