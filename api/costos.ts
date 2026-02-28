import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialized } from './_lib/init.js';
import { consultarCostosTool } from '../src/tools/consultar-costos.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();

    const args = {
      query: req.query.query as string | undefined,
      tipo: req.query.tipo as string | undefined,
      rubro: req.query.rubro as string | undefined,
      maxResultados: req.query.maxResultados ? Number(req.query.maxResultados) : undefined,
    };

    const result = consultarCostosTool(args);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
