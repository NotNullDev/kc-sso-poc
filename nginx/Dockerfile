FROM node:24-alpine AS app1-build
WORKDIR /app
ENV CI=1
ENV NO_COLOR=1
COPY apps/app1/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY apps/app1/ ./
RUN npm run build

FROM node:24-alpine AS app2-build
WORKDIR /app
ENV CI=1
ENV NO_COLOR=1
COPY apps/app2/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY apps/app2/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/sso-app.conf /etc/nginx/snippets/sso-app.conf
COPY --from=app1-build /app/dist/app1/browser /usr/share/nginx/app1
COPY --from=app2-build /app/dist/app2/browser /usr/share/nginx/app2
