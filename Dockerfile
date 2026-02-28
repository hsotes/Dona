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

EXPOSE 3000

CMD ["node", "dist/web/server.js"]
