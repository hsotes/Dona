import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialized } from './_lib/init.js';
import { buscarPerfilTool } from '../src/tools/buscar-perfil.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();

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

    const result = buscarPerfilTool(args);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
