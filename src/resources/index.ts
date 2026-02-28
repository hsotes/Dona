/**
 * Registro de Resources MCP
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { handlePerfilResource, handlePerfilesResource, listPerfilesResources } from './perfiles-resource.js';
import { handleNormaResource, listNormasResources } from './normas-resource.js';
import { handleCostosResource } from './costos-resource.js';
import { handlePDFResource, listPDFsResources } from './pdfs-resource.js';

export function registerResources(server: Server) {
  // Handler para listar resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [
      ...listPerfilesResources(),
      ...listNormasResources(),
      { uri: 'costos://', name: 'Catálogo de Costos', mimeType: 'application/json' },
      ...listPDFsResources(),
    ];

    return { resources };
  });

  // Handler para leer resources
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri.startsWith('perfil://')) {
      return handlePerfilResource(uri);
    }
    if (uri.startsWith('perfiles://')) {
      return handlePerfilesResource(uri);
    }
    if (uri.startsWith('norma://')) {
      return handleNormaResource(uri);
    }
    if (uri.startsWith('costos://')) {
      return handleCostosResource(uri);
    }
    if (uri.startsWith('pdf://')) {
      return handlePDFResource(uri);
    }

    throw new Error(`URI no reconocida: ${uri}`);
  });
}
