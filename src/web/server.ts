/**
 * Servidor Express para Dona — Chat + API REST
 */

import express from 'express';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeData } from '../data/loader.js';
import { processChat } from './chat.js';
import { buscarPerfilTool } from '../tools/buscar-perfil.js';
import { sugerirPerfilesTool } from '../tools/sugerir-perfiles.js';
import { consultarCostosTool } from '../tools/consultar-costos.js';
import { buscarDocumentosTool, estadisticasVectorStoreTool } from '../tools/buscar-documentos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Servir archivos estáticos desde public/
const publicDir = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicDir));

// ==========================================
// CHAT ENDPOINT (principal)
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message es obligatorio' });
    }
    const response = await processChat(message, history);
    res.json({ response });
  } catch (error: any) {
    console.error('Error en /api/chat:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// API REST directa (endpoints individuales)
// ==========================================
app.get('/api/perfiles', (req, res) => {
  try {
    const args = {
      tipo: req.query.tipo as string | undefined,
      minWx: req.query.minWx ? Number(req.query.minWx) : undefined,
      minIx: req.query.minIx ? Number(req.query.minIx) : undefined,
      maxPeso: req.query.maxPeso ? Number(req.query.maxPeso) : undefined,
      minAltura: req.query.minAltura ? Number(req.query.minAltura) : undefined,
      maxAltura: req.query.maxAltura ? Number(req.query.maxAltura) : undefined,
      ordenarPor: req.query.ordenarPor as 'peso' | 'Wx' | 'Ix' | 'h' | undefined,
      limite: req.query.limite ? Number(req.query.limite) : undefined,
    };
    res.json(buscarPerfilTool(args));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sugerir', (req, res) => {
  try {
    const args = req.body;
    if (!args.momentoRequerido) {
      return res.status(400).json({ error: 'momentoRequerido es obligatorio' });
    }
    res.json(sugerirPerfilesTool(args));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/costos', (req, res) => {
  try {
    const args = {
      query: req.query.query as string | undefined,
      tipo: req.query.tipo as string | undefined,
      rubro: req.query.rubro as string | undefined,
      maxResultados: req.query.maxResultados ? Number(req.query.maxResultados) : undefined,
    };
    res.json(consultarCostosTool(args));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documentos', async (req, res) => {
  try {
    const args = req.body;
    if (!args.consulta) {
      return res.status(400).json({ error: 'consulta es obligatoria' });
    }
    const result = await buscarDocumentosTool(args);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    const result = await estadisticasVectorStoreTool();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Iniciar servidor
// ==========================================
const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  console.log('Cargando datos...');
  await initializeData();
  console.log('Datos cargados.');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dona corriendo en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar Dona:', err);
  process.exit(1);
});
