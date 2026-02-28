/**
 * Tool: buscar_perfil
 *
 * Búsqueda avanzada de perfiles estructurales
 */

import { PERFILES } from '../data/loader.js';
import type { PerfilEstructural } from '../types/perfiles.js';

export const buscarPerfilSchema = {
  name: 'buscar_perfil',
  description: 'Busca perfiles estructurales según criterios específicos (módulo resistente, momento de inercia, peso, altura, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      tipo: {
        type: 'string',
        enum: ['IPN', 'IPE', 'UPN', 'HEB', 'HEA'],
        description: 'Tipo de perfil',
      },
      minWx: {
        type: 'number',
        description: 'Módulo resistente elástico mínimo en eje X (cm³)',
      },
      minIx: {
        type: 'number',
        description: 'Momento de inercia mínimo en eje X (cm⁴)',
      },
      maxPeso: {
        type: 'number',
        description: 'Peso máximo por metro (kg/m)',
      },
      minAltura: {
        type: 'number',
        description: 'Altura mínima del perfil (mm)',
      },
      maxAltura: {
        type: 'number',
        description: 'Altura máxima del perfil (mm)',
      },
      ordenarPor: {
        type: 'string',
        enum: ['peso', 'Wx', 'Ix', 'h'],
        description: 'Campo por el cual ordenar los resultados',
      },
      limite: {
        type: 'number',
        description: 'Número máximo de resultados a retornar',
        default: 10,
      },
    },
  },
};

interface BusquedaPerfilArgs {
  tipo?: string;
  minWx?: number;
  minIx?: number;
  maxPeso?: number;
  minAltura?: number;
  maxAltura?: number;
  ordenarPor?: 'peso' | 'Wx' | 'Ix' | 'h';
  limite?: number;
}

export function buscarPerfilTool(args: BusquedaPerfilArgs) {
  let resultados = [...PERFILES];
  const criterios: string[] = [];

  // Filtrar por tipo
  if (args.tipo) {
    resultados = resultados.filter(p => p.tipo === args.tipo);
    criterios.push(`Tipo: ${args.tipo}`);
  }

  // Filtrar por Wx mínimo
  if (args.minWx !== undefined) {
    resultados = resultados.filter(p => p.Wx >= args.minWx!);
    criterios.push(`Wx ≥ ${args.minWx} cm³`);
  }

  // Filtrar por Ix mínimo
  if (args.minIx !== undefined) {
    resultados = resultados.filter(p => p.Ix >= args.minIx!);
    criterios.push(`Ix ≥ ${args.minIx} cm⁴`);
  }

  // Filtrar por peso máximo
  if (args.maxPeso !== undefined) {
    resultados = resultados.filter(p => p.peso <= args.maxPeso!);
    criterios.push(`Peso ≤ ${args.maxPeso} kg/m`);
  }

  // Filtrar por altura mínima
  if (args.minAltura !== undefined) {
    resultados = resultados.filter(p => p.h >= args.minAltura!);
    criterios.push(`Altura ≥ ${args.minAltura} mm`);
  }

  // Filtrar por altura máxima
  if (args.maxAltura !== undefined) {
    resultados = resultados.filter(p => p.h <= args.maxAltura!);
    criterios.push(`Altura ≤ ${args.maxAltura} mm`);
  }

  // Ordenar
  if (args.ordenarPor) {
    const campo = args.ordenarPor;
    resultados.sort((a, b) => (a[campo] as number) - (b[campo] as number));
    criterios.push(`Ordenado por: ${campo}`);
  }

  // Limitar resultados
  const limite = args.limite || 10;
  const totalEncontrados = resultados.length;
  resultados = resultados.slice(0, limite);

  return {
    perfiles: resultados,
    count: resultados.length,
    totalEncontrados,
    criterios,
  };
}
