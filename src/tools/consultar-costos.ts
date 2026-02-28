/**
 * Tool: consultar_costos
 *
 * Consulta de precios de materiales
 */

import { COSTOS } from '../data/loader.js';

export const consultarCostosSchema = {
  name: 'consultar_costos',
  description: 'Consulta precios de materiales en el catálogo argentino',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Texto a buscar en la descripción del material',
      },
      tipo: {
        type: 'string',
        description: 'Tipo de material (ej: HEB, IPE, Angulos, Planchuela)',
      },
      rubro: {
        type: 'string',
        description: 'Rubro del material',
      },
      maxResultados: {
        type: 'number',
        description: 'Número máximo de resultados',
        default: 10,
      },
    },
  },
};

interface ConsultarCostosArgs {
  query?: string;
  tipo?: string;
  rubro?: string;
  maxResultados?: number;
}

export function consultarCostosTool(args: ConsultarCostosArgs) {
  let resultados = [...COSTOS];
  const criterios: string[] = [];

  // Filtrar por query
  if (args.query) {
    const queryLower = args.query.toLowerCase();
    resultados = resultados.filter(c =>
      c.descripcion.toLowerCase().includes(queryLower)
    );
    criterios.push(`Query: "${args.query}"`);
  }

  // Filtrar por tipo
  if (args.tipo) {
    const tipoLower = args.tipo.toLowerCase();
    resultados = resultados.filter(c =>
      c.tipo.toLowerCase().includes(tipoLower)
    );
    criterios.push(`Tipo: ${args.tipo}`);
  }

  // Filtrar por rubro
  if (args.rubro) {
    const rubroLower = args.rubro.toLowerCase();
    resultados = resultados.filter(c =>
      c.rubro.toLowerCase().includes(rubroLower)
    );
    criterios.push(`Rubro: ${args.rubro}`);
  }

  // Limitar resultados
  const limite = args.maxResultados || 10;
  const totalEncontrados = resultados.length;
  resultados = resultados.slice(0, limite);

  return {
    resultados: resultados.map(c => ({
      codigo: c.codigo,
      descripcion: c.descripcion,
      tipo: c.tipo,
      rubro: c.rubro,
      presentacion: c.presentacion,
      costoUnitario: c.costoUnitario,
      costoFormateado: `ARS ${c.costoUnitario.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    })),
    count: resultados.length,
    totalEncontrados,
    criterios,
    moneda: 'ARS',
    advertencia: 'Precios sujetos a variación. Consultar disponibilidad.',
  };
}
