# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# --- ADICIONE ESTAS LINHAS AQUI ---
# O Easypanel passará os valores da aba "Ambiente" para estes ARGs
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Torna as variáveis disponíveis para o processo 'npm run build'
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# ----------------------------------

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

COPY .env ./

# Agora o build terá acesso às variáveis reais
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]