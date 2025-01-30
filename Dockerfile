FROM node:20-slim

WORKDIR /app

COPY package.json ./

RUN npm install --package-lock-only

RUN npm install --omit=dev

COPY . .

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
