# 🗄️ Guia de Migration do Banco de Dados

## 🚀 Execução Rápida (Recomendado)

### Passo 1: Acessar Supabase
Acesse: https://condominio-supabase.zm83gd.easypanel.host

### Passo 2: SQL Editor
1. No painel lateral, clique em **SQL Editor**
2. Clique em **New Query**

### Passo 3: Executar Migration
1. Abra o arquivo `database/migration.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 4: Verificar
Você verá no final uma tabela com a contagem de registros:

| tabela | total |
|--------|-------|
| users | 4 |
| units | 10 |
| bills | 5 |
| bookings | 3 |
| notices | 4 |

✅ **Pronto! Banco de dados criado com sucesso!**

---

## 📊 O que foi criado?

### 1️⃣ **Estrutura Completa**
- ✅ 5 Tabelas (users, units, bills, bookings, notices)
- ✅ Índices otimizados para performance
- ✅ Triggers para atualização automática de timestamps
- ✅ Constraints para validação de dados
- ✅ RLS (Row Level Security) habilitado

### 2️⃣ **Dados Iniciais**

#### 👤 **Usuários:**

**Admin:**
- Email: `admin@onix.com`
- Senha: `admin123`
- Acesso total ao sistema

**Moradores:**
1. João Silva (`joao@email.com` / `123456`) - Unidade 101
2. Maria Santos (`maria@email.com` / `123456`) - Unidade 202
3. Pedro Oliveira (`pedro@email.com` / `123456`) - Unidade 301

#### 🏢 **Unidades:**
- 10 unidades criadas (Blocos A e B)
- 3 ocupadas, 7 disponíveis

#### 💰 **Boletos:**
- 5 boletos de exemplo
- Status variados: pendente, pago, atrasado

#### 📅 **Reservas:**
- 3 reservas do salão
- Status: aprovado e pendente

#### 📢 **Avisos:**
- 4 avisos de exemplo
- Categorias e prioridades variadas

---

## 🔐 Credenciais de Teste

### Para Testar o Sistema:

**Administrador:**
```
Email: admin@onix.com
Senha: admin123
```

**Morador 1:**
```
Email: joao@email.com
Senha: 123456
Unidade: 101
```

**Morador 2:**
```
Email: maria@email.com
Senha: 123456
Unidade: 202
```

**Morador 3:**
```
Email: pedro@email.com
Senha: 123456
Unidade: 301
```

---

## ⚠️ IMPORTANTE - Segurança

### 🔴 Antes de ir para produção:

1. **Trocar todas as senhas:**
   ```sql
   UPDATE users SET password = 'nova_senha_hash' WHERE email = 'admin@onix.com';
   ```

2. **Usar hash de senhas (bcrypt):**
   - O sistema atual usa senhas em texto plano
   - Em produção, use Supabase Auth ou bcrypt
   
3. **Revisar políticas RLS:**
   - As políticas atuais são permissivas para desenvolvimento
   - Ajuste conforme suas necessidades de segurança

4. **Configurar CORS e Rate Limiting:**
   - Configure no painel do Supabase

---

## 🔄 Recriar o Banco (Reset)

Se precisar começar do zero:

1. Descomente as linhas de DROP no início do arquivo:
   ```sql
   DROP TABLE IF EXISTS notices CASCADE;
   DROP TABLE IF EXISTS bookings CASCADE;
   DROP TABLE IF EXISTS bills CASCADE;
   DROP TABLE IF EXISTS units CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

2. Execute novamente o script completo

---

## 📝 Estrutura das Tabelas

### **users**
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- password (TEXT) -- ⚠️ Hash em produção
- name (TEXT)
- phone, cpf, unit (TEXT)
- role (admin | resident)
- created_at, updated_at (TIMESTAMP)
```

### **units**
```sql
- id (UUID, PK)
- number, block, floor (TEXT)
- owner_id (UUID, FK → users)
- owner_name (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### **bills**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- type (condominium | water | gas | electricity | other)
- description (TEXT)
- amount (DECIMAL)
- due_date (DATE)
- status (pending | paid | overdue | cancelled)
- barcode, competence (TEXT)
- paid_at, created_at, updated_at (TIMESTAMP)
```

### **bookings**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- user_name, unit (TEXT)
- date (DATE)
- start_time, end_time (TIME)
- event (TEXT)
- guests (INTEGER)
- status (pending | approved | rejected | cancelled)
- created_at, updated_at (TIMESTAMP)
```

### **notices**
```sql
- id (UUID, PK)
- title, content (TEXT)
- author (TEXT)
- author_id (UUID, FK → users)
- category (info | maintenance | meeting | rules | general | urgent)
- priority (low | medium | high)
- is_pinned (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

---

## 🔍 Verificar Instalação

Execute no SQL Editor:

```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver total de registros
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'notices', COUNT(*) FROM notices;

-- Ver usuários criados
SELECT id, email, name, role, unit FROM users;
```

---

## 🆘 Problemas Comuns

### Erro: "relation already exists"
→ Tabela já existe. Execute os comandos DROP primeiro.

### Erro: "permission denied"
→ Verifique se você está usando a chave correta do Supabase.

### Dados não aparecem no app
→ Reinicie o servidor: `npm run dev`

### RLS bloqueando acesso
→ Desabilite temporariamente:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## ✅ Checklist de Conclusão

- [ ] Migration executada com sucesso
- [ ] Contagem de registros correta
- [ ] Login com admin@onix.com funciona
- [ ] Login com moradores funciona
- [ ] Dados aparecem no dashboard
- [ ] Boletos visíveis na página Financeiro
- [ ] Reservas visíveis na página Reservas
- [ ] Avisos visíveis na página Avisos

---

## 🎉 Próximos Passos

Após executar a migration:

1. ✅ Reinicie o app: `npm run dev`
2. ✅ Faça login: http://localhost:3000
3. ✅ Teste todas as funcionalidades
4. ✅ Configure RLS para produção
5. ✅ Troque senhas padrão

**Tudo pronto para usar! 🚀**
