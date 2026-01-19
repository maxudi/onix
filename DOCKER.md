# 🐳 Docker - Guia de Uso

Este guia explica como executar o sistema Onix usando Docker.

## 📋 Pré-requisitos

- Docker Desktop instalado ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (já incluído no Docker Desktop)

## 🚀 Iniciando o Sistema

### Modo Produção (Recomendado)

Build e inicia o container com a aplicação otimizada:

```bash
docker-compose up -d
```

A aplicação estará disponível em: **http://localhost:3000**

### Modo Desenvolvimento

Para desenvolvimento com hot-reload, edite o `docker-compose.yml` e descomente a seção `onix-dev`, depois:

```bash
docker-compose up onix-dev -d
```

## 📦 Comandos Úteis

### Ver logs do container
```bash
docker-compose logs -f
```

### Parar o sistema
```bash
docker-compose down
```

### Parar e remover volumes
```bash
docker-compose down -v
```

### Rebuild da imagem
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Entrar no container
```bash
docker exec -it onix-condominio sh
```

### Ver status dos containers
```bash
docker-compose ps
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações.

### Customizar Porta

Para mudar a porta (ex: 8080), edite `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # ao invés de "3000:80"
```

## 🏗️ Estrutura Docker

- **Dockerfile** - Build multi-stage (otimizado para produção)
- **docker-compose.yml** - Orquestração dos serviços
- **nginx.conf** - Configuração do servidor web
- **.dockerignore** - Arquivos excluídos do build

## 🔍 Troubleshooting

### Porta já em uso

Se a porta 3000 estiver ocupada:

```bash
# Verificar o que está usando a porta
netstat -ano | findstr :3000

# Ou mude a porta no docker-compose.yml
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs

# Rebuild limpo
docker-compose down
docker system prune -a
docker-compose up --build
```

### Aplicação não atualiza após mudanças

```bash
# Rebuild forçado
docker-compose build --no-cache
docker-compose up -d
```

## 🚀 Deploy em Produção

### Build local e push para registry

```bash
# Build da imagem
docker build -t onix-condominio:latest .

# Tag para seu registry
docker tag onix-condominio:latest seu-registry/onix-condominio:latest

# Push
docker push seu-registry/onix-condominio:latest
```

### Usando Docker Hub

```bash
# Login
docker login

# Tag
docker tag onix-condominio:latest seu-usuario/onix-condominio:latest

# Push
docker push seu-usuario/onix-condominio:latest
```

## 📊 Monitoramento

### Health Check

O container possui health check configurado. Verifique:

```bash
docker inspect onix-condominio | grep -A 10 Health
```

### Endpoint de Health

```bash
curl http://localhost:3000/health
```

## 🔐 Segurança

- Imagem base: `node:18-alpine` (leve e segura)
- Nginx com headers de segurança configurados
- Multi-stage build (código fonte não vai para produção)
- .dockerignore configurado para excluir arquivos sensíveis

## 📝 Notas

- A aplicação usa localStorage, então os dados são salvos no navegador
- Quando migrar para Supabase, configure as variáveis no `.env`
- O modo desenvolvimento com hot-reload é opcional

---

Para mais informações, consulte a [documentação do Docker](https://docs.docker.com/).
