import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialized } from './_lib/init.js';
import { buscarDocumentosTool } from '../src/tools/buscar-documentos.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();

    const body = req.body || {};
    const args = {
      consulta: body.consulta as string,
      tipoFuente: body.tipoFuente as 'pdf' | 'manual' | 'norma' | 'todos' | undefined,
      limite: body.limite ? Number(body.limite) : undefined,
      normaOrigen: body.normaOrigen as string | undefined,
      tema: body.tema as string | undefined,
      coleccion: body.coleccion as 'norma' | 'libro' | 'memoria' | 'software' | 'material' | 'pliego' | 'todos' | undefined,
    };

    if (!args.consulta) {
      return res.status(400).json({ error: 'consulta es obligatoria' });
    }

    const result = await buscarDocumentosTool(args);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
