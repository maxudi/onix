# Estágio de Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install   # npm ci às vezes falha se o lock for antigo
COPY . .
RUN npm run build

# Estágio de Produção
FROM nginx:alpine
# Verifique se o seu build realmente gera a pasta "dist"
COPY --from=builder /app/dist /usr/share/nginx/html

# Remova ou comente o Healthcheck abaixo para testar
# HEALTHCHECK ... 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]