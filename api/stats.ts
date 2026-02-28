import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureInitialized } from './_lib/init.js';
import { estadisticasVectorStoreTool } from '../src/tools/buscar-documentos.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();
    const result = await estadisticasVectorStoreTool();
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
