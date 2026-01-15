FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js .
COPY public ./public

RUN mkdir -p slides

EXPOSE 8080

CMD ["node", "server.js"]