#!/bin/bash
set -e

VOLUME_DIR="/data/vectordb"
STAGING_DIR="/app/knowledge/vectordb"

# Si el volume existe, sincronizar archivos del staging al volume
if [ -d "$VOLUME_DIR" ]; then
  echo "[entrypoint] Volume detectado en $VOLUME_DIR"

  # Verificar si necesita re-sync (comparar conteo de vectors)
  staging_count=$(ls "$STAGING_DIR/vectors/"*.vec.json 2>/dev/null | wc -l)
  volume_count=$(ls "$VOLUME_DIR/vectors/"*.vec.json 2>/dev/null | wc -l)

  # FORCE_RESYNC=1 para limpiar volume de archivos corruptos (quitar después)
  FORCE_RESYNC=1
  if [ "$FORCE_RESYNC" = "1" ] || [ "$staging_count" != "$volume_count" ] || [ ! -f "$VOLUME_DIR/bm25-index.json" ]; then
    echo "[entrypoint] Re-sincronizando volume ($volume_count -> $staging_count vectors)..."
    # Limpiar y copiar todo fresco
    rm -rf "$VOLUME_DIR/vectors" "$VOLUME_DIR/chunks"
    cp -r "$STAGING_DIR/vectors" "$VOLUME_DIR/vectors"
    cp -r "$STAGING_DIR/chunks" "$VOLUME_DIR/chunks"
    cp "$STAGING_DIR/manifest.json" "$VOLUME_DIR/manifest.json"
    [ -f "$STAGING_DIR/bm25-index.json" ] && cp "$STAGING_DIR/bm25-index.json" "$VOLUME_DIR/bm25-index.json"
    echo "[entrypoint] Volume re-sincronizado."
  else
    echo "[entrypoint] Volume actualizado, no necesita sync."
  fi

  total_vectors=$(ls "$VOLUME_DIR/vectors/"*.vec.json 2>/dev/null | wc -l)
  total_chunks=$(ls "$VOLUME_DIR/chunks/" 2>/dev/null | wc -l)
  has_bm25="no"; [ -f "$VOLUME_DIR/bm25-index.json" ] && has_bm25="si"
  echo "[entrypoint] Volume: $total_vectors vectors, $total_chunks chunks, bm25=$has_bm25"
else
  echo "[entrypoint] Sin volume, usando datos locales"
fi

# Arrancar la app
exec node dist/web/server.js
