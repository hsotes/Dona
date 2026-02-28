FROM node:20-slim

WORKDIR /app

# Instalar TODAS las dependencias (incluyendo dev para compilar)
COPY package.json package-lock.json ./
RUN npm ci

# Compilar TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Eliminar devDependencies después de compilar
RUN npm prune --omit=dev

# Copiar frontend y datos
COPY public/ ./public/
COPY knowledge/ ./knowledge/

# Re-ensamblar archivos grandes que fueron divididos en partes
RUN cd /app/knowledge/vectordb && \
    if [ -d vectors/parts ]; then \
      echo "Re-ensamblando archivos divididos..." && \
      for base in $(ls vectors/parts/*.part_aa 2>/dev/null | sed 's/.part_aa$//'); do \
        filename=$(basename "$base"); \
        if echo "$filename" | grep -q "bm25-index"; then \
          cat ${base}.part_* > "$filename" && \
          echo "  -> $filename re-ensamblado"; \
        else \
          cat ${base}.part_* > "vectors/$filename" && \
          echo "  -> vectors/$filename re-ensamblado"; \
        fi; \
      done && \
      rm -rf vectors/parts && \
      echo "Partes eliminadas."; \
    fi

# Script de inicio
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
