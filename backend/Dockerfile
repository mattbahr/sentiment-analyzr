FROM node:24.0.1-alpine3.21
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --silent
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start"]
