FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --chown=node:node . .

USER node

EXPOSE 3001

CMD ["node", "src/index.js"]