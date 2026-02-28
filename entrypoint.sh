#!/bin/bash
set -e

echo "[entrypoint] Verificando datos..."
vectors=$(ls /app/knowledge/vectordb/vectors/*.vec.json 2>/dev/null | wc -l)
chunks=$(ls /app/knowledge/vectordb/chunks/*.json 2>/dev/null | wc -l)
has_bm25="no"; [ -f /app/knowledge/vectordb/bm25-index.json ] && has_bm25="si"
echo "[entrypoint] Local: $vectors vectors, $chunks chunks, bm25=$has_bm25"

# Arrancar la app
exec node dist/web/server.js
