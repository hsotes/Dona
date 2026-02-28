/**
 * CONTEXTO DE NORMAS PARA IA
 *
 * Este archivo contiene toda la información técnica de las normas
 * que la IA necesita para asistir en cálculos estructurales.
 *
 * La IA SIEMPRE debe tener este contexto cargado.
 */

export interface NormaInfo {
  codigo: string;
  nombre: string;
  descripcion: string;
  aplicacion: string;
  tablasClave: string[];
  formulasClave: string[];
  valores: Record<string, unknown>;
}

export const NORMAS_CONTEXT: NormaInfo[] = [
  // ==========================================
  // UNE 76-201-88 - APARATOS DE ELEVACIÓN
  // ==========================================
  {
    codigo: 'UNE_76201',
    nombre: 'UNE 76-201-88',
    descripcion: 'Aparatos de elevación. Condiciones de resistencia y seguridad de los equipos de manutención',
    aplicacion: 'Diseño de vigas carrileras y estructuras de soporte para puentes grúa',
    tablasClave: [
      'Tabla 1: Clasificación de aparatos según tipo (A1-A8)',
      'Tabla 2: Condiciones de utilización',
      'Tabla 3: Estado de carga',
      'Tabla 4: Clasificación de grupos de aparatos',
      'Tabla 5: Coeficientes dinámicos φ según grupo',
      'Tabla 6: Valores de aceleración',
    ],
    formulasClave: [
      'RTV = Rv × φ (Reacción vertical con coeficiente dinámico)',
      'FT = 0.1 × (Rv + Pc) (Fuerza transversal - frenado)',
      'FL = 0.1 × Rv (Fuerza longitudinal)',
      'φ = 1 + a × v / g (Coeficiente dinámico general)',
    ],
    valores: {
      coeficientesDinamicos: {
        grupo1: 1.10,
        grupo2: 1.15,
        grupo3: 1.20,
        grupo4: 1.25,
        grupo5: 1.30,
        grupo6: 1.35,
        grupo7: 1.35,
        grupo8: 1.35,
      },
      factorFrenado: 0.10,
      factorAceleracion: {
        lento: 0.05,
        medio: 0.10,
        rapido: 0.15,
      },
      clasificacionGrupos: {
        A1: { descripcion: 'Uso ocasional, carga ligera', grupo: 1 },
        A2: { descripcion: 'Uso regular, carga ligera', grupo: 2 },
        A3: { descripcion: 'Uso regular, carga media', grupo: 3 },
        A4: { descripcion: 'Uso intensivo, carga media', grupo: 4 },
        A5: { descripcion: 'Uso intensivo, carga pesada', grupo: 5 },
        A6: { descripcion: 'Uso muy intensivo', grupo: 6 },
        A7: { descripcion: 'Uso continuo', grupo: 7 },
        A8: { descripcion: 'Uso severo continuo', grupo: 8 },
      },
    },
  },

  // ==========================================
  // CIRSOC 301 - ESTRUCTURAS DE ACERO
  // ==========================================
  {
    codigo: 'CIRSOC_301',
    nombre: 'CIRSOC 301-2005',
    descripcion: 'Reglamento Argentino de Estructuras de Acero para Edificios',
    aplicacion: 'Diseño, cálculo y verificación de estructuras metálicas',
    tablasClave: [
      'Tabla 2.1: Propiedades del acero estructural',
      'Tabla 3.1: Factores de resistencia φ',
      'Tabla 4.1: Límites de esbeltez',
      'Tabla 5.1: Coeficientes para pandeo',
      'Tabla B.4: Perfiles laminados',
    ],
    formulasClave: [
      'φMn = φ × Fy × Zx (Momento nominal)',
      'φVn = φ × 0.6 × Fy × Aw (Corte nominal)',
      'φPn = φ × Fcr × Ag (Compresión nominal)',
      'λ = KL/r (Esbeltez)',
      'Fcr = (0.658^λc²) × Fy (Tensión crítica)',
    ],
    valores: {
      aceroF24: {
        Fy: 240, // MPa - Tensión de fluencia
        Fu: 370, // MPa - Tensión última
        E: 200000, // MPa - Módulo de elasticidad
        G: 77000, // MPa - Módulo de corte
      },
      aceroF36: {
        Fy: 250, // MPa
        Fu: 400, // MPa
        E: 200000,
        G: 77000,
      },
      factoresResistencia: {
        flexion: 0.90,
        corte: 0.90,
        compresion: 0.85,
        traccion: 0.90,
        conexiones: 0.75,
      },
      limitesEsbeltez: {
        columnas: 200,
        vigas: 300,
        arriostramientos: 200,
        tirantes: 300,
      },
    },
  },

  // ==========================================
  // CIRSOC 102 - ACCIÓN DEL VIENTO
  // ==========================================
  {
    codigo: 'CIRSOC_102',
    nombre: 'CIRSOC 102-2005',
    descripcion: 'Reglamento Argentino de Acción del Viento sobre las Construcciones',
    aplicacion: 'Determinación de cargas de viento en estructuras',
    tablasClave: [
      'Tabla 1: Velocidades de viento por zona',
      'Tabla 2: Coeficientes de exposición',
      'Tabla 3: Coeficientes de presión Cp',
      'Tabla 4: Coeficientes de forma',
      'Mapa de zonificación eólica Argentina',
    ],
    formulasClave: [
      'q = 0.613 × V² (Presión dinámica básica)',
      'qz = q × Kz × Kzt × Kd (Presión a altura z)',
      'p = qz × (GCp - GCpi) (Presión de diseño)',
      'F = p × A (Fuerza de viento)',
    ],
    valores: {
      zonasViento: {
        I: { V: 130, descripcion: 'Patagonia sur' },
        II: { V: 110, descripcion: 'Patagonia norte' },
        III: { V: 100, descripcion: 'Centro-sur' },
        IV: { V: 90, descripcion: 'Centro-norte' },
        V: { V: 80, descripcion: 'Norte' },
      },
      categoriaExposicion: {
        A: { descripcion: 'Centro de grandes ciudades', alpha: 5.0, zg: 457 },
        B: { descripcion: 'Áreas urbanas y suburbanas', alpha: 7.0, zg: 366 },
        C: { descripcion: 'Terreno abierto', alpha: 9.5, zg: 274 },
        D: { descripcion: 'Terreno plano sin obstrucciones', alpha: 11.5, zg: 213 },
      },
      coeficientesPresion: {
        paredBarlovento: 0.8,
        paredSotavento: -0.5,
        techoPlano: -0.7,
        techoPendiente: { barlovento: 0.3, sotavento: -0.6 },
      },
    },
  },

  // ==========================================
  // CIRSOC 101 - CARGAS Y SOBRECARGAS
  // ==========================================
  {
    codigo: 'CIRSOC_101',
    nombre: 'CIRSOC 101-2005',
    descripcion: 'Reglamento Argentino de Cargas Permanentes y Sobrecargas de Uso',
    aplicacion: 'Determinación de cargas gravitatorias en estructuras',
    tablasClave: [
      'Tabla 1: Pesos unitarios de materiales',
      'Tabla 2: Sobrecargas de uso por ocupación',
      'Tabla 3: Reducción de sobrecargas',
    ],
    formulasClave: [
      'Wu = 1.2D + 1.6L (Combinación básica)',
      'Wu = 1.2D + 1.0L + 1.6S (Con nieve)',
      'Wu = 1.2D + 1.0W + L (Con viento)',
    ],
    valores: {
      pesosUnitarios: {
        acero: 78.5, // kN/m³
        hormigon: 24.0, // kN/m³
        chapaTrapez: 0.10, // kN/m²
        cubiertas: 0.30, // kN/m²
        cielorrasos: 0.25, // kN/m²
      },
      sobrecargasUso: {
        industria_liviana: 3.0, // kN/m²
        industria_pesada: 6.0,
        depositos: 7.5,
        oficinas: 2.5,
        techos: 0.5,
      },
      factoresCarga: {
        muerta: 1.2,
        viva: 1.6,
        viento: 1.6,
        sismo: 1.0,
        grua: 1.6,
      },
    },
  },

  // ==========================================
  // AISC 360 - ESPECIFICACIÓN ACERO
  // ==========================================
  {
    codigo: 'AISC_360',
    nombre: 'AISC 360-16',
    descripcion: 'Specification for Structural Steel Buildings',
    aplicacion: 'Referencia internacional para diseño de acero (complementa CIRSOC)',
    tablasClave: [
      'Table B4.1: Límites de esbeltez elementos a compresión',
      'Table D3.1: Áreas efectivas',
      'Table J3.2: Resistencia de pernos',
    ],
    formulasClave: [
      'Mn = Mp = Fy × Zx (Secciones compactas)',
      'Mn = Fcr × Sx (Pandeo lateral-torsional)',
      'Pn = Fcr × Ag (Compresión)',
    ],
    valores: {
      astmA36: { Fy: 250, Fu: 400 },
      astmA572Gr50: { Fy: 345, Fu: 450 },
      astmA992: { Fy: 345, Fu: 450 },
    },
  },

  // ==========================================
  // ASCE 7 - CARGAS DE DISEÑO
  // ==========================================
  {
    codigo: 'ASCE_7',
    nombre: 'ASCE 7-22',
    descripcion: 'Minimum Design Loads and Associated Criteria for Buildings',
    aplicacion: 'Referencia para combinaciones de carga y cargas especiales',
    tablasClave: [
      'Table 4.3-1: Cargas vivas mínimas',
      'Table 7.3-1: Cargas de lluvia',
      'Chapter 26-31: Cargas de viento',
    ],
    formulasClave: [
      '1.4D (Solo carga muerta)',
      '1.2D + 1.6L + 0.5(Lr o S o R)',
      '1.2D + 1.6(Lr o S o R) + (L o 0.5W)',
      '1.2D + 1.0W + L + 0.5(Lr o S o R)',
      '0.9D + 1.0W',
    ],
    valores: {
      combinacionesCarga: {
        combo1: '1.4D',
        combo2: '1.2D + 1.6L + 0.5Lr',
        combo3: '1.2D + 1.6Lr + L',
        combo4: '1.2D + 1.0W + L + 0.5Lr',
        combo5: '0.9D + 1.0W',
      },
    },
  },
];

/**
 * Genera el prompt de contexto para la IA
 */
export function generateAIContext(): string {
  let context = `# CONTEXTO DE NORMAS PARA CÁLCULO ESTRUCTURAL

Eres un asistente experto en cálculo estructural de acero, especializado en:
- Diseño de vigas carrileras para puentes grúa
- Estructuras de naves industriales
- Verificación según normativa argentina e internacional

## NORMAS DE REFERENCIA DISPONIBLES:

`;

  for (const norma of NORMAS_CONTEXT) {
    context += `### ${norma.nombre}
**${norma.descripcion}**
Aplicación: ${norma.aplicacion}

Tablas clave:
${norma.tablasClave.map(t => `- ${t}`).join('\n')}

Fórmulas principales:
${norma.formulasClave.map(f => `- ${f}`).join('\n')}

Valores importantes:
\`\`\`json
${JSON.stringify(norma.valores, null, 2)}
\`\`\`

---

`;
  }

  context += `## INSTRUCCIONES PARA PREDIMENSIONAMIENTO

Cuando el usuario solicite predimensionar una viga o columna:

1. **Solicitar datos mínimos:**
   - Luz de la viga (m)
   - Carga del puente grúa (kN)
   - Clasificación del puente grúa (A1-A8)
   - Separación entre columnas

2. **Aplicar coeficientes:**
   - Usar φ según grupo de clasificación (Tabla 5 UNE)
   - Aplicar factores de carga según CIRSOC 101

3. **Sugerir perfil inicial:**
   - Para vigas carrileras: HEB o HEA
   - Para columnas: HEB o tubulares
   - Indicar momento requerido aproximado

4. **Verificaciones mínimas:**
   - Flexión: φMn ≥ Mu
   - Corte: φVn ≥ Vu
   - Deflexión: δ ≤ L/600 (vigas carrileras)
   - Fatiga: según ciclos de carga

## REGLAS DE RESPUESTA

- Siempre citar la norma y tabla/fórmula utilizada
- Indicar los factores de seguridad aplicados
- Proporcionar valores numéricos específicos
- Sugerir verificaciones adicionales necesarias
- Advertir sobre limitaciones del predimensionamiento
`;

  return context;
}

/**
 * Obtiene valores específicos de una norma
 */
export function getNormaValues(codigo: string): Record<string, unknown> | null {
  const norma = NORMAS_CONTEXT.find(n => n.codigo === codigo);
  return norma?.valores || null;
}

/**
 * Busca información en las normas
 */
export function searchNormas(query: string): NormaInfo[] {
  const lowerQuery = query.toLowerCase();
  return NORMAS_CONTEXT.filter(norma =>
    norma.nombre.toLowerCase().includes(lowerQuery) ||
    norma.descripcion.toLowerCase().includes(lowerQuery) ||
    norma.aplicacion.toLowerCase().includes(lowerQuery) ||
    norma.tablasClave.some(t => t.toLowerCase().includes(lowerQuery)) ||
    norma.formulasClave.some(f => f.toLowerCase().includes(lowerQuery))
  );
}
