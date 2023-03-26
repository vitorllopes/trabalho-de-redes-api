FROM node:18-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . . 

RUN npm run build 

COPY . .

ARG PORT=${PORT}
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["node", "dist/app.js"]