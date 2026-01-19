# 📚 Git - Guia de Uso

Este guia explica como versionar e fazer deploy do projeto usando Git.

## 🎯 Inicialização do Repositório

### 1. Inicializar Git (se ainda não foi feito)

```bash
git init
```

### 2. Adicionar arquivos

```bash
# Adicionar todos os arquivos
git add .

# Ou adicionar arquivos específicos
git add src/ package.json
```

### 3. Primeiro commit

```bash
git commit -m "🎉 Initial commit - Sistema de Condomínio Onix"
```

## 🌐 Conectar com GitHub

### 1. Criar repositório no GitHub

1. Acesse [GitHub](https://github.com)
2. Clique em **New Repository**
3. Nome: `onix-condominio`
4. Deixe **vazio** (não adicione README, .gitignore ou license)
5. Clique em **Create repository**

### 2. Adicionar remote

```bash
# Substituir pelo seu usuário/repositório
git remote add origin https://github.com/seu-usuario/onix-condominio.git
```

### 3. Push inicial

```bash
# Definir branch principal
git branch -M main

# Enviar para o GitHub
git push -u origin main
```

## 📝 Workflow de Commits

### Commit simples

```bash
git add .
git commit -m "feat: adicionar página de relatórios"
git push
```

### Commits semânticos (recomendado)

```bash
# Nova funcionalidade
git commit -m "feat: adicionar sistema de notificações"

# Correção de bug
git commit -m "fix: corrigir erro no cálculo de boletos"

# Mudança na documentação
git commit -m "docs: atualizar README com instruções Docker"

# Refatoração
git commit -m "refactor: reorganizar estrutura de pastas"

# Melhoria de performance
git commit -m "perf: otimizar carregamento do dashboard"

# Estilo/formatação
git commit -m "style: ajustar espaçamento dos cards"

# Testes
git commit -m "test: adicionar testes para AuthContext"
```

## 🌿 Branches

### Criar nova branch

```bash
# Criar e mudar para nova branch
git checkout -b feature/chat-moradores

# Ou criar sem mudar
git branch feature/chat-moradores
```

### Trabalhar com branches

```bash
# Ver branches
git branch

# Mudar de branch
git checkout main

# Deletar branch
git branch -d feature/chat-moradores
```

### Merge de branches

```bash
# Voltar para main
git checkout main

# Fazer merge
git merge feature/chat-moradores

# Push
git push
```

## 🔄 Atualizações

### Puxar mudanças do remote

```bash
# Atualizar branch atual
git pull

# Ou fetch + merge
git fetch origin
git merge origin/main
```

### Ver histórico

```bash
# Log completo
git log

# Log resumido
git log --oneline

# Log gráfico
git log --graph --oneline --all
```

## 🔧 Comandos Úteis

### Ver status

```bash
git status
```

### Ver diferenças

```bash
# Mudanças não staged
git diff

# Mudanças staged
git diff --staged
```

### Desfazer mudanças

```bash
# Desfazer mudanças em arquivo (antes do add)
git checkout -- arquivo.js

# Remover do staging
git reset HEAD arquivo.js

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (descarta mudanças)
git reset --hard HEAD~1
```

### Stash (guardar mudanças temporárias)

```bash
# Guardar mudanças
git stash

# Ver stashes
git stash list

# Recuperar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}
```

## 🏷️ Tags (Versões)

### Criar tag

```bash
# Tag simples
git tag v1.0.0

# Tag com mensagem
git tag -a v1.0.0 -m "Versão 1.0.0 - Release inicial"
```

### Push de tags

```bash
# Push de uma tag
git push origin v1.0.0

# Push de todas as tags
git push --tags
```

## 🚀 Deploy Automático

### GitHub Pages (para frontend estático)

1. Build do projeto:
```bash
npm run build
```

2. Configure no repositório:
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → pasta `dist`

### Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Netlify

1. Conecte seu repositório no [Netlify](https://www.netlify.com)
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

## 📋 .gitignore

O arquivo `.gitignore` já está configurado para excluir:
- `node_modules/`
- `dist/`
- `.env` e variáveis de ambiente
- Arquivos de editor
- Logs

## 🔐 Segurança

### Nunca commitar:

- ❌ Senhas ou tokens
- ❌ Arquivos `.env`
- ❌ Chaves de API
- ❌ Credenciais de banco de dados

### Se commitou por engano:

```bash
# Remover do histórico (cuidado!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (perigoso - avise o time antes)
git push origin --force --all
```

## 👥 Colaboração

### Fork + Pull Request

1. Fork o repositório no GitHub
2. Clone seu fork:
```bash
git clone https://github.com/seu-usuario/onix-condominio.git
```

3. Crie uma branch:
```bash
git checkout -b minha-feature
```

4. Faça suas mudanças e commit

5. Push para seu fork:
```bash
git push origin minha-feature
```

6. Abra um Pull Request no GitHub original

## 📊 Comandos de Informação

```bash
# Ver remotes
git remote -v

# Ver configuração
git config --list

# Ver autores dos commits
git shortlog -sn

# Ver tamanho do repositório
git count-objects -vH
```

## 🔄 Workflow Recomendado

### Para features novas:

```bash
git checkout main
git pull
git checkout -b feature/nome-da-feature
# ... fazer mudanças ...
git add .
git commit -m "feat: descrição da feature"
git push -u origin feature/nome-da-feature
# ... abrir Pull Request no GitHub ...
```

### Para correções rápidas:

```bash
git checkout main
git pull
git checkout -b fix/nome-do-bug
# ... corrigir bug ...
git add .
git commit -m "fix: descrição da correção"
git push -u origin fix/nome-do-bug
```

---

Para mais informações, consulte a [documentação oficial do Git](https://git-scm.com/doc).
