/**
 * Singleton de inicialización para Vercel serverless functions.
 * Carga datos en memoria una sola vez por instancia.
 */

import { initializeData } from '../../src/data/loader.js';

let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    await initializeData();
    initialized = true;
  }
}
