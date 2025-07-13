FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app

# Copiamos dependencias y el build de la fase anterior
COPY --from=build /usr/src/app/dist dist
COPY --from=build /usr/src/app/node_modules node_modules
COPY package*.json .
COPY tsconfig.json .
COPY .env .

ENV PORT=3000
EXPOSE $PORT

# Creamos usuario sin privilegios
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

# Actualizar permisos
RUN chown -R appuser:appuser /usr/src/app

# Cambiar a usuario sin privilegios
USER appuser

ENV NODE_ENV=production
CMD ["npm", "start"]