FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY src ./src
COPY data/elections ./data/elections
COPY data/i18n/en/elections ./data/i18n/en/elections
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
