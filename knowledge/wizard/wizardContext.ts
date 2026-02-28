/**
 * Sistema de Contexto del Wizard
 *
 * Define:
 * - Contexto específico para cada etapa
 * - Tareas que el AI debe ejecutar automáticamente
 * - Datos requeridos de etapas anteriores
 * - Outputs esperados de cada etapa
 */

// =====================================================
// TIPOS
// =====================================================

export interface WizardStageContext {
  id: number;
  nombre: string;
  descripcion: string;

  // Contexto para el AI
  aiContext: string;
  aiTasks: string[];
  aiConstraints: string[];

  // Datos
  requiredFromPrevious: string[];
  outputData: string[];

  // Normas relevantes
  normasRelevantes: string[];

  // Acciones automáticas del AI
  autoActions?: {
    trigger: string;
    action: 'generate_script' | 'calculate' | 'verify' | 'recommend';
    template?: string;
  }[];
}

// =====================================================
// CONTEXTO POR ETAPA
// =====================================================

export const WIZARD_STAGES: Record<number, WizardStageContext> = {
  1: {
    id: 1,
    nombre: 'Geometría y Datos',
    descripcion: 'Dimensiones de la nave y datos del puente grúa',

    aiContext: `El usuario está ingresando las dimensiones de una nave industrial con puente grúa.

DATOS QUE SE INGRESAN:
- Capacidad nominal del puente grúa (toneladas)
- Luz del puente (distancia entre rieles)
- Luz libre de la nave
- Longitud total de la nave
- Luz de la viga carrilera (separación entre columnas)
- Altura de la nave
- Grupo de clasificación (UNE 76-201)

TU ROL EN ESTA ETAPA:
- Ayudar a interpretar planos si el usuario tiene dudas
- Recomendar dimensiones según normativas
- Explicar qué significa el grupo de clasificación
- Validar que las dimensiones sean coherentes`,

    aiTasks: [
      'Validar coherencia de dimensiones ingresadas',
      'Explicar clasificación de grupos según UNE 76-201',
      'Recomendar relaciones altura/luz típicas',
      'Alertar sobre dimensiones fuera de rango usual',
    ],

    aiConstraints: [
      'No recomendar perfiles todavía - eso es en la etapa 2',
      'No calcular cargas - eso es en la etapa 3',
      'Usar unidades del Sistema Internacional',
    ],

    requiredFromPrevious: [],
    outputData: ['datosGeometria'],

    normasRelevantes: [
      'UNE 76-201-88 (Clasificación de grúas)',
      'CIRSOC 102 (Cargas de servicio)',
    ],
  },

  2: {
    id: 2,
    nombre: 'Predimensionamiento',
    descripcion: 'Selección de perfiles estructurales',

    aiContext: `El usuario está seleccionando perfiles para la estructura.

DATOS DISPONIBLES:
- Geometría de la nave (del paso anterior)
- Base de datos de perfiles (IPN, IPE, UPN, HEB, HEA)
- Propiedades geométricas e inerciales de cada perfil

TU ROL EN ESTA ETAPA:
- Recomendar perfiles según las cargas estimadas
- Explicar criterios de selección (flexión, deflexión, esbeltez)
- Comparar opciones y justificar elección
- Calcular propiedades geométricas si se necesitan

PERFILES A SELECCIONAR:
1. Viga carrilera (recibe cargas del puente grúa)
2. Columnas principales
3. Vigas de arriostramiento (opcional)`,

    aiTasks: [
      'Calcular momento estimado en viga carrilera',
      'Recomendar perfil mínimo para viga',
      'Verificar esbeltez de columnas',
      'Sugerir arriostramientos si es necesario',
    ],

    aiConstraints: [
      'Usar perfiles comerciales disponibles en Argentina',
      'Considerar disponibilidad de perfiles importados',
      'No sobredimensionar innecesariamente',
    ],

    requiredFromPrevious: ['datosGeometria'],
    outputData: ['perfilesSeleccionados'],

    normasRelevantes: [
      'CIRSOC 301 (Estructuras de acero)',
      'AISC 360 (Especificación para acero)',
    ],
  },

  3: {
    id: 3,
    nombre: 'Cálculo de Pesos',
    descripcion: 'Peso propio de la estructura',

    aiContext: `El usuario necesita calcular el peso de la estructura basado en los perfiles seleccionados.

DATOS DISPONIBLES:
- Geometría completa de la nave
- Perfiles seleccionados con sus pesos (kg/m)
- Longitudes de cada elemento

TU ROL EN ESTA ETAPA:
- Calcular peso de cada tipo de elemento
- Sumar peso total de la estructura
- Calcular peso por metro cuadrado de nave
- Identificar elementos que más contribuyen al peso

ELEMENTOS A CONSIDERAR:
- Vigas carrileras (2 unidades × longitud nave)
- Columnas principales
- Ménsulas de apoyo
- Arriostramientos
- Placas de anclaje y conexiones (estimado 10-15%)`,

    aiTasks: [
      'Calcular longitud total de vigas carrileras',
      'Calcular peso de columnas',
      'Estimar peso de conexiones',
      'Generar tabla resumen de pesos',
    ],

    aiConstraints: [
      'Usar pesos reales de perfiles de catálogo',
      'Incluir factor de conexiones (10-15%)',
      'Expresar resultados en kN para cargas',
    ],

    requiredFromPrevious: ['datosGeometria', 'perfilesSeleccionados'],
    outputData: ['pesosCalculados'],

    normasRelevantes: [
      'CIRSOC 101 (Cargas permanentes)',
    ],
  },

  4: {
    id: 4,
    nombre: 'Estados de Carga',
    descripcion: 'Definición de cargas y combinaciones',

    aiContext: `El usuario debe definir los estados de carga y combinaciones.

CARGAS A CONSIDERAR:
1. CARGA MUERTA (D):
   - Peso propio estructura (calculado en paso 3)
   - Peso de cubierta y cerramientos

2. CARGA VIVA DE TECHO (Lr):
   - Según CIRSOC 101: 0.5-1.0 kN/m²

3. CARGAS DE GRÚA (Cr):
   - Cargas verticales (con coef. dinámico φ)
   - Fuerzas horizontales transversales
   - Fuerzas horizontales longitudinales

4. VIENTO (W):
   - Presión según zona y altura

5. SISMO (E):
   - Si aplica según zona sísmica

COMBINACIONES CIRSOC 101:
- 1.2D + 1.6L + 1.6Cr
- 1.2D + 1.6Cr + 0.5L + 0.8W
- 0.9D + 1.6Cr ± 0.8W
- etc.`,

    aiTasks: [
      'Calcular coeficiente dinámico según grupo',
      'Calcular cargas de rueda con φ',
      'Calcular fuerzas de frenado',
      'Definir combinaciones críticas',
      'Generar diagrama de cuerpo libre',
    ],

    aiConstraints: [
      'Usar factores de carga de CIRSOC 101',
      'Aplicar coeficientes dinámicos de UNE 76-201',
      'Considerar excentricidad de cargas',
    ],

    requiredFromPrevious: ['datosGeometria', 'perfilesSeleccionados', 'pesosCalculados'],
    outputData: ['estadosCarga', 'combinaciones'],

    normasRelevantes: [
      'CIRSOC 101 (Combinaciones de carga)',
      'UNE 76-201 (Coeficientes dinámicos)',
      'CIRSOC 102 (Acciones sobre estructuras)',
    ],
  },

  5: {
    id: 5,
    nombre: 'Script SAP2000',
    descripcion: 'Generación de modelo estructural',

    aiContext: `ESTA ES UNA ETAPA DE ACCIÓN AUTOMÁTICA.

Cuando el usuario llegue a esta etapa, DEBES generar automáticamente un script Python
para SAP2000 usando la OAPI (Open Application Programming Interface).

DATOS DISPONIBLES:
- Geometría completa de la nave
- Perfiles seleccionados
- Estados de carga definidos
- Combinaciones de carga

EL SCRIPT DEBE INCLUIR:
1. Conexión a SAP2000
2. Creación de modelo nuevo
3. Definición de materiales (Acero F24)
4. Definición de secciones (perfiles seleccionados)
5. Creación de nodos (coordenadas)
6. Creación de elementos frame
7. Asignación de apoyos
8. Definición de patrones de carga
9. Aplicación de cargas
10. Definición de combinaciones
11. Correr análisis
12. Exportar resultados`,

    aiTasks: [
      'GENERAR script Python completo para SAP2000',
      'Incluir comentarios explicativos',
      'Crear funciones modulares',
      'Agregar manejo de errores',
    ],

    aiConstraints: [
      'Usar SAP2000 OAPI versión 23+',
      'Script debe ser ejecutable sin modificaciones',
      'Incluir verificación de conexión a SAP2000',
      'Generar archivo descargable .py',
    ],

    requiredFromPrevious: ['datosGeometria', 'perfilesSeleccionados', 'pesosCalculados', 'estadosCarga', 'combinaciones'],
    outputData: ['scriptSAP2000'],

    normasRelevantes: [],

    autoActions: [
      {
        trigger: 'stage_enter',
        action: 'generate_script',
        template: 'sap2000_puente_grua',
      },
    ],
  },

  6: {
    id: 6,
    nombre: 'Verificación',
    descripcion: 'Análisis de resultados y ajustes',

    aiContext: `El usuario ha corrido el análisis en SAP2000 y necesita verificar resultados.

VERIFICACIONES A REALIZAR:
1. FLEXIÓN:
   - Ratio Mu/φMn ≤ 1.0 para todas las vigas

2. CORTE:
   - Ratio Vu/φVn ≤ 1.0

3. DEFLEXIÓN:
   - Viga carrilera: L/600 (grúas)
   - Otras vigas: L/360

4. COMPRESIÓN (columnas):
   - Verificar pandeo
   - Ratio Pu/φPn ≤ 1.0

5. CONEXIONES:
   - Verificar soldaduras
   - Verificar pernos

SI NO CUMPLE:
- Identificar elementos que fallan
- Recomendar perfil mayor
- Volver al paso 2 para ajustar`,

    aiTasks: [
      'Analizar resultados de SAP2000 (CSV)',
      'Verificar ratios de demanda/capacidad',
      'Identificar elementos críticos',
      'Recomendar ajustes si no cumple',
    ],

    aiConstraints: [
      'Todos los ratios deben ser ≤ 1.0',
      'Preferir soluciones económicas',
      'Si hay que cambiar perfil, mantener familia (ej: HEB)',
    ],

    requiredFromPrevious: ['datosGeometria', 'perfilesSeleccionados', 'pesosCalculados', 'estadosCarga', 'combinaciones', 'scriptSAP2000'],
    outputData: ['verificacionFinal', 'reporteResultados'],

    normasRelevantes: [
      'CIRSOC 301 (Verificaciones)',
      'AISC 360 (Criterios de diseño)',
    ],
  },
};

// =====================================================
// FUNCIÓN PARA OBTENER PROMPT DEL AI
// =====================================================

export function getAIPromptForStage(stageId: number, wizardData: Record<string, unknown>): string {
  const stage = WIZARD_STAGES[stageId];
  if (!stage) return '';

  let prompt = `# ETAPA ACTUAL: ${stage.nombre}

## CONTEXTO
${stage.aiContext}

## TAREAS EN ESTA ETAPA
${stage.aiTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## RESTRICCIONES
${stage.aiConstraints.map(c => `- ${c}`).join('\n')}

## NORMAS RELEVANTES
${stage.normasRelevantes.map(n => `- ${n}`).join('\n')}
`;

  // Agregar datos de etapas anteriores
  if (stage.requiredFromPrevious.length > 0) {
    prompt += `\n## DATOS DE ETAPAS ANTERIORES\n`;
    for (const dataKey of stage.requiredFromPrevious) {
      if (wizardData[dataKey]) {
        prompt += `\n### ${dataKey}:\n\`\`\`json\n${JSON.stringify(wizardData[dataKey], null, 2)}\n\`\`\`\n`;
      }
    }
  }

  return prompt;
}

// =====================================================
// TEMPLATES DE ACCIONES AUTOMÁTICAS
// =====================================================

export const AUTO_ACTION_TEMPLATES = {
  sap2000_puente_grua: `
# Script SAP2000 - Modelo de Nave Industrial con Puente Grúa
# Generado automáticamente por StructCalc Pro
#
# INSTRUCCIONES:
# 1. Abrir SAP2000 antes de ejecutar
# 2. Ejecutar este script desde Python
# 3. Revisar el modelo generado
# 4. Correr análisis y exportar resultados

import comtypes.client
import sys

def connect_to_sap2000():
    """Conecta a SAP2000 existente o abre nuevo"""
    try:
        helper = comtypes.client.CreateObject('SAP2000v1.Helper')
        helper = helper.QueryInterface(comtypes.gen.SAP2000v1.cHelper)
        sap_object = helper.GetObject("CSI.SAP2000.API.SapObject")
        return sap_object
    except:
        print("Error: SAP2000 no está abierto o no se puede conectar")
        sys.exit(1)

# ... (template continúa con funciones específicas)
`,
};
