FROM node:20-slim

WORKDIR /app

# Copiar dependencias primero (cache de Docker)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Copiar frontend y datos
COPY public/ ./public/
COPY knowledge/ ./knowledge/

EXPOSE 3000

CMD ["node", "dist/web/server.js"]
