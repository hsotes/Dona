import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialized } from './_lib/init.js';
import { sugerirPerfilesTool } from '../src/tools/sugerir-perfiles.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();

    const body = req.body || {};
    const args = {
      momentoRequerido: Number(body.momentoRequerido),
      cortanteRequerido: body.cortanteRequerido ? Number(body.cortanteRequerido) : undefined,
      luzViga: body.luzViga ? Number(body.luzViga) : undefined,
      margen: body.margen ? Number(body.margen) : undefined,
      preferencia: body.preferencia as 'liviano' | 'economico' | 'rigido' | undefined,
      maxResultados: body.maxResultados ? Number(body.maxResultados) : undefined,
    };

    if (!args.momentoRequerido || isNaN(args.momentoRequerido)) {
      return res.status(400).json({ error: 'momentoRequerido es obligatorio y debe ser un numero' });
    }

    const result = sugerirPerfilesTool(args);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
