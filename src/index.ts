#!/usr/bin/env node

/**
 * RAG Estructuras MCP Server
 *
 * Servidor MCP que centraliza assets de cálculo estructural
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env si existe (para OPENAI_API_KEY) - usar ruta absoluta
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { initializeData } from './data/loader.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';

const server = new Server(
  {
    name: 'rag-estructuras-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

async function main() {
  try {
    // Inicializar datos
    console.error('🔄 Inicializando datos...');
    await initializeData();
    console.error('✓ Datos cargados en memoria');

    // Registrar handlers
    registerResources(server);
    registerTools(server);

    // Iniciar servidor
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('✅ RAG Estructuras MCP Server running on stdio');
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

main();
