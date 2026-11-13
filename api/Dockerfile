FROM node:24-alpine AS build
WORKDIR /project
COPY api/package*.json ./api/
RUN cd api && npm ci
COPY api ./api
COPY src/core/domain.ts ./src/core/domain.ts
RUN cd api && npm run build
WORKDIR /project/api
EXPOSE 3000
USER node
CMD ["sh","-c","node dist/api/src/migrate.js && exec node dist/api/src/main.js"]
