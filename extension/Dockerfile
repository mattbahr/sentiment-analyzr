FROM node:24.0.1-alpine3.21
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --silent
COPY . .