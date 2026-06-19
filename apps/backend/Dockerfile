FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY server.js ./

ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["node", "server.js"]
