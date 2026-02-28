/**
 * Tool: sugerir_perfiles
 *
 * Sugerencias optimizadas de perfiles para condiciones específicas
 */

import { PERFILES } from '../data/loader.js';
import { COSTOS } from '../data/loader.js';
import type { PerfilEstructural } from '../types/perfiles.js';

export const sugerirPerfilesSchema = {
  name: 'sugerir_perfiles',
  description: 'Sugiere perfiles optimizados para un momento requerido, con opciones de preferencia (liviano, económico, rígido)',
  inputSchema: {
    type: 'object',
    properties: {
      momentoRequerido: {
        type: 'number',
        description: 'Momento último requerido Mu (kN·m)',
      },
      cortanteRequerido: {
        type: 'number',
        description: 'Cortante último requerido Vu (kN) [opcional]',
      },
      luzViga: {
        type: 'number',
        description: 'Luz de la viga (m) [opcional, para verificar deflexión]',
      },
      margen: {
        type: 'number',
        description: 'Factor de margen adicional (default: 1.2)',
        default: 1.2,
      },
      preferencia: {
        type: 'string',
        enum: ['liviano', 'economico', 'rigido'],
        description: 'Criterio de optimización: liviano (menor peso), economico (menor costo), rigido (mayor inercia)',
        default: 'economico',
      },
      maxResultados: {
        type: 'number',
        description: 'Número máximo de sugerencias',
        default: 5,
      },
    },
    required: ['momentoRequerido'],
  },
};

interface SugerirPerfilesArgs {
  momentoRequerido: number;
  cortanteRequerido?: number;
  luzViga?: number;
  margen?: number;
  preferencia?: 'liviano' | 'economico' | 'rigido';
  maxResultados?: number;
}

export function sugerirPerfilesTool(args: SugerirPerfilesArgs) {
  const { momentoRequerido, margen = 1.2, preferencia = 'economico', maxResultados = 5 } = args;

  // Calcular Wx mínimo requerido
  // Mu = φ * Fy * Wx
  // Wx = Mu / (φ * Fy)
  // Para acero F24: Fy = 240 MPa, φ = 0.9
  const phi = 0.9;
  const Fy = 240; // MPa
  const MuNmm = momentoRequerido * 1e6; // kN·m a N·mm
  const WxMinRequerido = (MuNmm / (phi * Fy)) / 1000; // cm³

  // Aplicar margen
  const WxMinConMargen = WxMinRequerido * margen;

  // Filtrar perfiles que cumplen
  let candidatos = PERFILES.filter(p => p.Wx >= WxMinConMargen);

  if (candidatos.length === 0) {
    return {
      sugerencias: [],
      mensaje: `No se encontraron perfiles que cumplan con Wx ≥ ${WxMinConMargen.toFixed(1)} cm³`,
      WxMinRequerido: WxMinRequerido.toFixed(1),
      WxMinConMargen: WxMinConMargen.toFixed(1),
    };
  }

  // Ordenar según preferencia
  switch (preferencia) {
    case 'liviano':
      candidatos.sort((a, b) => a.peso - b.peso);
      break;
    case 'economico':
      // Intentar ordenar por costo si está disponible
      candidatos.sort((a, b) => {
        const costoA = buscarCosto(a.nombre);
        const costoB = buscarCosto(b.nombre);
        if (costoA && costoB) {
          return costoA - costoB;
        }
        // Si no hay costo, usar peso como proxy
        return a.peso - b.peso;
      });
      break;
    case 'rigido':
      candidatos.sort((a, b) => b.Ix - a.Ix);
      break;
  }

  // Tomar solo los primeros N
  candidatos = candidatos.slice(0, maxResultados);

  // Generar sugerencias con verificaciones
  const sugerencias = candidatos.map(perfil => {
    const ratioWx = perfil.Wx / WxMinRequerido;
    const costo = buscarCosto(perfil.nombre);

    return {
      perfil: {
        nombre: perfil.nombre,
        tipo: perfil.tipo,
        designacion: perfil.designacion,
        h: perfil.h,
        b: perfil.b,
        peso: perfil.peso,
        Wx: perfil.Wx,
        Ix: perfil.Ix,
      },
      ratioOptimizacion: ratioWx,
      razon: generarRazon(perfil, preferencia, ratioWx),
      verificaciones: {
        flexion: ratioWx >= 1.0,
        sobrecapacidad: `${((ratioWx - 1.0) * 100).toFixed(1)}%`,
      },
      costoEstimado: costo ? `ARS ${costo.toLocaleString('es-AR')}` : 'No disponible',
    };
  });

  return {
    sugerencias,
    criterios: {
      momentoRequerido: `${momentoRequerido} kN·m`,
      WxMinRequerido: `${WxMinRequerido.toFixed(1)} cm³`,
      WxMinConMargen: `${WxMinConMargen.toFixed(1)} cm³`,
      margen,
      preferencia,
    },
  };
}

function buscarCosto(nombrePerfil: string): number | null {
  // Buscar en el catálogo de costos
  const material = COSTOS.find(c =>
    c.descripcion.toLowerCase().includes(nombrePerfil.toLowerCase())
  );

  return material ? material.costoUnitario : null;
}

function generarRazon(perfil: PerfilEstructural, preferencia: string, ratio: number): string {
  const sobrecapacidad = ((ratio - 1.0) * 100).toFixed(0);

  switch (preferencia) {
    case 'liviano':
      return `Perfil liviano (${perfil.peso} kg/m) con ${sobrecapacidad}% de sobrecapacidad`;
    case 'economico':
      return `Opción económica con ${sobrecapacidad}% de sobrecapacidad`;
    case 'rigido':
      return `Mayor rigidez (Ix=${perfil.Ix} cm⁴) con ${sobrecapacidad}% de sobrecapacidad`;
    default:
      return `${sobrecapacidad}% de sobrecapacidad`;
  }
}
