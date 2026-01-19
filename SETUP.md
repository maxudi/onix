# 🚀 Guia Rápido - Setup Completo

## ✅ Configuração do Supabase (5 minutos)

### Passo 1: Configuração já feita! ✨

As credenciais do Supabase já estão configuradas no arquivo `.env`:

```bash
VITE_SUPABASE_URL=https://condominio-supabase.zm83gd.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 2: Criar Tabelas no Banco de Dados

1. **Acesse seu Supabase:**
   - URL: https://condominio-supabase.zm83gd.easypanel.host

2. **Vá para SQL Editor**
   - No painel lateral, clique em "SQL Editor"

3. **Execute os comandos do SUPABASE.md**
   - Abra o arquivo `SUPABASE.md`
   - Copie e execute TODOS os comandos SQL em ordem:
     1. Criar tabela users
     2. Criar tabela units
     3. Criar tabela bills
     4. Criar tabela bookings
     5. Criar tabela notices
     6. Criar triggers
     7. Inserir dados iniciais (opcional)

4. **Pronto!** 🎉
   - O sistema agora usa Supabase automaticamente
   - Todos os dados são salvos na nuvem

### Passo 3: Testar

```bash
npm run dev
```

Acesse http://localhost:3000 e faça login:
- **Admin:** admin@onix.com / admin123
- **Morador:** joao@email.com / 123456

## 🐳 Deploy com Docker (2 minutos)

### Opção 1: Docker Compose (Mais fácil)

```bash
# Build e iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

Acesse: http://localhost:3000

### Opção 2: Docker puro

```bash
# Build
docker build -t onix-condominio .

# Run
docker run -d -p 3000:80 --name onix onix-condominio

# Ver logs
docker logs -f onix

# Parar
docker stop onix
docker rm onix
```

## 📦 Git - Subir para GitHub (3 minutos)

### 1. Criar repositório no GitHub
- Vá em https://github.com/new
- Nome: `onix-condominio`
- Deixe VAZIO (sem README, sem .gitignore)

### 2. Comandos no terminal

```bash
# Inicializar Git
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "🎉 Initial commit - Sistema Onix"

# Conectar com GitHub (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/onix-condominio.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

### 3. Pronto! ✨
Seu código está no GitHub em:
`https://github.com/SEU-USUARIO/onix-condominio`

## 🌐 Deploy Online (Grátis)

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Opção 2: Netlify

1. Conecte seu repositório GitHub no Netlify
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Adicione as variáveis de ambiente do `.env`

### Opção 3: Docker Hub + Cloud

```bash
# Login no Docker Hub
docker login

# Tag
docker tag onix-condominio seu-usuario/onix-condominio:latest

# Push
docker push seu-usuario/onix-condominio:latest
```

Depois use em qualquer servidor:
```bash
docker pull seu-usuario/onix-condominio:latest
docker run -d -p 80:80 seu-usuario/onix-condominio:latest
```

## 🎯 Checklist Completo

### Backend/Banco de Dados
- [x] Supabase configurado
- [ ] Tabelas criadas no SQL Editor
- [ ] Dados de teste inseridos
- [ ] RLS (segurança) habilitado

### Desenvolvimento
- [x] Dependências instaladas (`npm install`)
- [x] Servidor rodando (`npm run dev`)
- [ ] Login funcionando
- [ ] Dados sendo salvos no Supabase

### Docker
- [ ] Docker instalado
- [ ] `docker-compose up -d` funcionando
- [ ] App acessível em localhost:3000

### Git/GitHub
- [ ] Repositório criado no GitHub
- [ ] Código enviado (`git push`)
- [ ] README visível no GitHub

### Deploy (Opcional)
- [ ] Deploy em Vercel/Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] App online e funcionando

## 🆘 Problemas Comuns

### "Supabase not configured"
→ Execute os comandos SQL do SUPABASE.md

### "Port 3000 already in use"
→ Mude a porta no vite.config.js ou mate o processo:
```bash
netstat -ano | findstr :3000
taskkill /PID [número] /F
```

### Docker não inicia
```bash
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Git push rejeitado
```bash
git pull origin main --rebase
git push
```

## 📚 Documentação Completa

- **[README.md](README.md)** - Documentação principal
- **[SUPABASE.md](SUPABASE.md)** - Setup do banco de dados
- **[DOCKER.md](DOCKER.md)** - Guia Docker completo
- **[GIT.md](GIT.md)** - Guia Git completo

## 🎉 Pronto!

Seu sistema está configurado e pronto para uso! 

**Próximos passos:**
1. Customizar cores e logo
2. Adicionar mais funcionalidades
3. Implementar notificações
4. Criar app mobile

Boa sorte com seu projeto! 🚀
