FROM node:18-alpine
WORKDIR /opt/app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci
RUN npm install --save-dev @types/express @types/debug @types/node @types/pg @types/uuid @types/axios

COPY . .
RUN npm run build
CMD ["npm", "run", "start"]