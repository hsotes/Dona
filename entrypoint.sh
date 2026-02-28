#!/bin/bash
set -e

VOLUME_DIR="/data/vectordb"
STAGING_DIR="/app/knowledge/vectordb"

# Si el volume existe, copiar archivos nuevos del staging al volume
if [ -d "$VOLUME_DIR" ]; then
  echo "[entrypoint] Volume detectado en $VOLUME_DIR"

  # Copiar subdirectorios (vectors/, chunks/)
  for subdir in vectors chunks; do
    if [ -d "$STAGING_DIR/$subdir" ]; then
      mkdir -p "$VOLUME_DIR/$subdir"
      echo "[entrypoint] Copiando $subdir/ al volume..."
      cp -n "$STAGING_DIR/$subdir/"* "$VOLUME_DIR/$subdir/" 2>/dev/null || true
      count=$(ls "$VOLUME_DIR/$subdir/" 2>/dev/null | wc -l)
      echo "[entrypoint] $subdir/: $count archivos en volume"
    fi
  done

  # Copiar archivos sueltos (manifest.json, bm25-index.json)
  for file in manifest.json bm25-index.json; do
    if [ -f "$STAGING_DIR/$file" ] && [ ! -f "$VOLUME_DIR/$file" ]; then
      echo "[entrypoint] Copiando $file al volume..."
      cp "$STAGING_DIR/$file" "$VOLUME_DIR/$file"
    fi
  done

  total_vectors=$(ls "$VOLUME_DIR/vectors/" 2>/dev/null | wc -l)
  total_chunks=$(ls "$VOLUME_DIR/chunks/" 2>/dev/null | wc -l)
  echo "[entrypoint] Volume tiene: $total_vectors vectors, $total_chunks chunks"
else
  echo "[entrypoint] Sin volume, usando datos locales"
fi

# Arrancar la app
exec node dist/web/server.js
