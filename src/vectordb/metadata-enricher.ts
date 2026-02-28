/**
 * Metadata Enricher - Enriquece chunks con metadata determinística
 *
 * Todo se resuelve por filename, sin llamadas a LLM.
 * - normaOrigen: qué norma/estándar es el documento
 * - idioma: 'es' o 'en'
 * - tema: categoría temática
 * - coleccion: tipo de documento (norma, libro, memoria, software, material, pliego)
 */

export type Coleccion = 'norma' | 'libro' | 'memoria' | 'software' | 'material' | 'pliego';

export interface EnrichedMetadata {
  normaOrigen: string;
  idioma: 'es' | 'en';
  tema: string;
  coleccion: Coleccion;
}

/**
 * Mapeo de filename → normaOrigen.
 * Indica de qué norma/estándar proviene el documento.
 */
const NORMA_ORIGEN_MAP: Record<string, string> = {
  'reglamento_cirsoc_301.pdf': 'CIRSOC 301',
  'CIRSOC-308-Reglamento.pdf': 'CIRSOC 308',
  'CIRSOC-308-Comentarios.pdf': 'CIRSOC 308',
  'Cirsoc 308 ejemplo de uso.pdf': 'CIRSOC 308',
  'Curso_Cirsoc_ 301_2008_Uniones_1.pdf': 'CIRSOC 301',
  'ReglamentoCirsoc_102_1_82.pdf': 'CIRSOC 102',
  'Proyecto-CIRSOC-102-24-Discusion-Publica-Nacional.pdf': 'CIRSOC 102',
  'AISC_Steel_construction_manual_fourteenth_edi.pdf': 'AISC 360',
  'AISC Design Guide 01 - Base Plate And Anchor Rod Design 2nd Ed.pdf': 'AISC DG01',
  'a360-22w.pdf': 'ASTM A360',
  'a370-21w.pdf': 'ASTM A370',
  'a313-21w.pdf': 'ASTM A313',
  'AISI-S100-16-2020-wS3-22.pdf': 'AISI S100',
  'AISI_Acero_Conformado_en_Frio.pdf': 'AISI',
  'cold formed steel structures to the aisi specification.pdf': 'AISI',
  'aws.d1.1.2000.pdf': 'AWS D1.1',
  'MANUAL_AHMSA_2013-2.pdf': 'AHMSA',
  'tekla-structural-designer-2024-engineers-handbooks.pdf': 'Tekla SD',
  'TS_MOD_2022_en_Create_models.pdf': 'Tekla Structures',
  'TS_MGE_2018_en_Manage_Tekla_Structures.pdf': 'Tekla Structures',
  'Lesson 02_CreatingSystemComponents_steel.pdf': 'Tekla Structures',
  'Lesson 04_CustomComponents_steel.pdf': 'Tekla Structures',
  'MANUAL_SAP2000_PYTHON.md': 'SAP2000',
  'bases de soporte a flexocompresión-compresión y tracción.pdf': 'General',
  'MEMORIA_CALCULO_NAVE_INDUSTRIAL_PUENTE_GRUA.pdf': 'General',
  'memoria galpon minero.pdf': 'General',
  'tesis.pdf': 'General',
  'PLIEG-2025-26787713-GDEBA-DPTYLLOPISU.pdf': 'Pliego',
  'DISENO_DE_ESTRUCTURAS_DE_ACERO_McCORMAC (1).pdf': 'General',
  'SP47_1988_Lattice_Portal_Frames.pdf': 'General',
};

/**
 * Mapeo de filename → tema.
 */
const TEMA_MAP: Record<string, string> = {
  'reglamento_cirsoc_301.pdf': 'diseño acero',
  'CIRSOC-308-Reglamento.pdf': 'soldadura',
  'CIRSOC-308-Comentarios.pdf': 'soldadura',
  'Cirsoc 308 ejemplo de uso.pdf': 'soldadura',
  'Curso_Cirsoc_ 301_2008_Uniones_1.pdf': 'conexiones',
  'ReglamentoCirsoc_102_1_82.pdf': 'cargas viento',
  'Proyecto-CIRSOC-102-24-Discusion-Publica-Nacional.pdf': 'cargas viento',
  'AISC_Steel_construction_manual_fourteenth_edi.pdf': 'diseño acero',
  'AISC Design Guide 01 - Base Plate And Anchor Rod Design 2nd Ed.pdf': 'placas base',
  'a360-22w.pdf': 'materiales acero',
  'a370-21w.pdf': 'ensayos materiales',
  'a313-21w.pdf': 'materiales acero',
  'AISI-S100-16-2020-wS3-22.pdf': 'conformado frio',
  'AISI_Acero_Conformado_en_Frio.pdf': 'conformado frio',
  'cold formed steel structures to the aisi specification.pdf': 'conformado frio',
  'aws.d1.1.2000.pdf': 'soldadura',
  'MANUAL_AHMSA_2013-2.pdf': 'diseño acero',
  'tekla-structural-designer-2024-engineers-handbooks.pdf': 'software',
  'TS_MOD_2022_en_Create_models.pdf': 'software',
  'TS_MGE_2018_en_Manage_Tekla_Structures.pdf': 'software',
  'Lesson 02_CreatingSystemComponents_steel.pdf': 'software',
  'Lesson 04_CustomComponents_steel.pdf': 'software',
  'MANUAL_SAP2000_PYTHON.md': 'software',
  'bases de soporte a flexocompresión-compresión y tracción.pdf': 'placas base',
  'MEMORIA_CALCULO_NAVE_INDUSTRIAL_PUENTE_GRUA.pdf': 'calculo estructural',
  'memoria galpon minero.pdf': 'calculo estructural',
  'tesis.pdf': 'calculo estructural',
  'PLIEG-2025-26787713-GDEBA-DPTYLLOPISU.pdf': 'pliego',
  'DISENO_DE_ESTRUCTURAS_DE_ACERO_McCORMAC (1).pdf': 'diseño acero',
  'SP47_1988_Lattice_Portal_Frames.pdf': 'porticos reticulados',
};

/**
 * Mapeo de filename → colección.
 *
 * Colecciones:
 * - norma: Reglamentos y estándares normativos (CIRSOC, AISI S100, AWS D1.1)
 * - libro: Libros de texto y manuales de referencia (McCormac, AISC Manual, AHMSA)
 * - memoria: Memorias de cálculo, ejemplos, tesis, guías de diseño
 * - software: Manuales de software (Tekla, SAP2000)
 * - material: Especificaciones de materiales (ASTM)
 * - pliego: Pliegos de licitación
 */
const COLECCION_MAP: Record<string, Coleccion> = {
  // Normas
  'reglamento_cirsoc_301.pdf': 'norma',
  'CIRSOC-308-Reglamento.pdf': 'norma',
  'CIRSOC-308-Comentarios.pdf': 'norma',
  'ReglamentoCirsoc_102_1_82.pdf': 'norma',
  'Proyecto-CIRSOC-102-24-Discusion-Publica-Nacional.pdf': 'norma',
  'AISI-S100-16-2020-wS3-22.pdf': 'norma',
  'aws.d1.1.2000.pdf': 'norma',
  // Libros
  'DISENO_DE_ESTRUCTURAS_DE_ACERO_McCORMAC (1).pdf': 'libro',
  'AISC_Steel_construction_manual_fourteenth_edi.pdf': 'libro',
  'MANUAL_AHMSA_2013-2.pdf': 'libro',
  'AISI_Acero_Conformado_en_Frio.pdf': 'libro',
  'cold formed steel structures to the aisi specification.pdf': 'libro',
  'SP47_1988_Lattice_Portal_Frames.pdf': 'libro',
  'AISC Design Guide 01 - Base Plate And Anchor Rod Design 2nd Ed.pdf': 'libro',
  // Memorias / Ejemplos / Tesis / Guías
  'Cirsoc 308 ejemplo de uso.pdf': 'memoria',
  'Curso_Cirsoc_ 301_2008_Uniones_1.pdf': 'memoria',
  'MEMORIA_CALCULO_NAVE_INDUSTRIAL_PUENTE_GRUA.pdf': 'memoria',
  'memoria galpon minero.pdf': 'memoria',
  'tesis.pdf': 'memoria',
  'bases de soporte a flexocompresión-compresión y tracción.pdf': 'memoria',
  // Software
  'tekla-structural-designer-2024-engineers-handbooks.pdf': 'software',
  'TS_MOD_2022_en_Create_models.pdf': 'software',
  'TS_MGE_2018_en_Manage_Tekla_Structures.pdf': 'software',
  'Lesson 02_CreatingSystemComponents_steel.pdf': 'software',
  'Lesson 04_CustomComponents_steel.pdf': 'software',
  'MANUAL_SAP2000_PYTHON.md': 'software',
  // Materiales (especificaciones ASTM)
  'a360-22w.pdf': 'material',
  'a370-21w.pdf': 'material',
  'a313-21w.pdf': 'material',
  // Pliegos
  'PLIEG-2025-26787713-GDEBA-DPTYLLOPISU.pdf': 'pliego',
};

/**
 * Documentos que están en inglés (el resto se asume español).
 */
const ENGLISH_DOCS = new Set([
  'a360-22w.pdf',
  'a370-21w.pdf',
  'a313-21w.pdf',
  'AISC_Steel_construction_manual_fourteenth_edi.pdf',
  'AISC Design Guide 01 - Base Plate And Anchor Rod Design 2nd Ed.pdf',
  'AISI-S100-16-2020-wS3-22.pdf',
  'cold formed steel structures to the aisi specification.pdf',
  'aws.d1.1.2000.pdf',
  'tekla-structural-designer-2024-engineers-handbooks.pdf',
  'TS_MOD_2022_en_Create_models.pdf',
  'TS_MGE_2018_en_Manage_Tekla_Structures.pdf',
  'Lesson 02_CreatingSystemComponents_steel.pdf',
  'Lesson 04_CustomComponents_steel.pdf',
]);

/**
 * Enriquece metadata de un chunk basándose en el nombre del archivo fuente.
 */
export function enrichMetadata(source: string): EnrichedMetadata {
  return {
    normaOrigen: NORMA_ORIGEN_MAP[source] || 'Otro',
    idioma: ENGLISH_DOCS.has(source) ? 'en' : 'es',
    tema: TEMA_MAP[source] || 'general',
    coleccion: COLECCION_MAP[source] || 'libro',
  };
}

/**
 * Obtiene la lista de temas disponibles.
 */
export function getAvailableTemas(): string[] {
  return [...new Set(Object.values(TEMA_MAP))].sort();
}

/**
 * Obtiene la lista de normas disponibles.
 */
export function getAvailableNormas(): string[] {
  return [...new Set(Object.values(NORMA_ORIGEN_MAP))].sort();
}

/**
 * Obtiene la lista de colecciones disponibles.
 */
export function getAvailableColecciones(): Coleccion[] {
  return [...new Set(Object.values(COLECCION_MAP))].sort() as Coleccion[];
}
