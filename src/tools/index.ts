/**
 * Registro de Tools MCP
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { buscarPerfilTool, buscarPerfilSchema } from './buscar-perfil.js';
import { sugerirPerfilesTool, sugerirPerfilesSchema } from './sugerir-perfiles.js';
import { consultarCostosTool, consultarCostosSchema } from './consultar-costos.js';
import {
  buscarDocumentosTool,
  buscarDocumentosSchema,
  estadisticasVectorStoreTool,
  estadisticasVectorStoreSchema,
} from './buscar-documentos.js';

export function registerTools(server: Server) {
  // Handler para listar tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        buscarPerfilSchema,
        sugerirPerfilesSchema,
        consultarCostosSchema,
        buscarDocumentosSchema,
        estadisticasVectorStoreSchema,
      ],
    };
  });

  // Handler para ejecutar tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case 'buscar_perfil':
          result = buscarPerfilTool(args as any || {});
          break;
        case 'sugerir_perfiles':
          result = sugerirPerfilesTool(args as any || {});
          break;
        case 'consultar_costos':
          result = consultarCostosTool(args as any || {});
          break;
        case 'buscar_documentos':
          result = await buscarDocumentosTool(args as any || {});
          break;
        case 'estadisticas_vectorstore':
          result = await estadisticasVectorStoreTool();
          break;
        default:
          throw new Error(`Tool no reconocida: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });
}
