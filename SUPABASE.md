# Instruções para criar as tabelas no Supabase

Execute estes comandos SQL no Supabase SQL Editor para criar a estrutura do banco de dados.

## 1. Tabela de Usuários (users)

```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  unit TEXT,
  role TEXT DEFAULT 'resident' CHECK (role IN ('admin', 'resident')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
```

## 2. Tabela de Unidades (units)

```sql
-- Criar tabela de unidades
CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  block TEXT NOT NULL,
  floor TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(number, block)
);

-- Índices
CREATE INDEX idx_units_owner ON units(owner_id);

-- RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view units" ON units
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage units" ON units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
```

## 3. Tabela de Boletos (bills)

```sql
-- Criar tabela de boletos
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('condominium', 'water', 'gas', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  barcode TEXT,
  competence TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bills_user ON bills(user_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all bills" ON bills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all bills" ON bills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
```

## 4. Tabela de Reservas (bookings)

```sql
-- Criar tabela de reservas
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event TEXT NOT NULL,
  guests INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
```

## 5. Tabela de Avisos (notices)

```sql
-- Criar tabela de avisos
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'info' CHECK (category IN ('info', 'maintenance', 'meeting', 'rules', 'general')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notices_author ON notices(author_id);
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_pinned ON notices(is_pinned);
CREATE INDEX idx_notices_created ON notices(created_at DESC);

-- RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view notices" ON notices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
```

## 6. Triggers para updated_at

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 7. Inserir Dados Iniciais (Opcional)

```sql
-- Inserir usuário admin (senha: admin123)
-- IMPORTANTE: Use hash bcrypt real em produção!
INSERT INTO users (email, password, name, role, phone, cpf)
VALUES (
  'admin@onix.com',
  'admin123',
  'Admin Sistema',
  'admin',
  '(11) 99999-9999',
  '123.456.789-00'
);

-- Inserir usuário morador (senha: 123456)
INSERT INTO users (email, password, name, role, phone, cpf, unit)
VALUES (
  'joao@email.com',
  '123456',
  'João Silva',
  'resident',
  '(11) 98888-8888',
  '987.654.321-00',
  '101'
);
```

## 8. Habilitar Realtime (Opcional)

```sql
-- Habilitar realtime para todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE bills;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notices;
```

## 📝 Notas Importantes

1. **Autenticação**: Este setup usa a tabela `users` personalizada. Para produção, considere usar o Supabase Auth nativo.

2. **Senhas**: As senhas estão em texto plano neste exemplo. Em produção, use bcrypt ou o Supabase Auth.

3. **RLS**: As políticas de segurança (RLS) estão configuradas. Teste cuidadosamente antes de ir para produção.

4. **Índices**: Os índices estão otimizados para as queries mais comuns. Ajuste conforme necessário.

## 🔐 Segurança

Para ambiente de produção:
- Use Supabase Auth ao invés de tabela personalizada
- Implemente rate limiting
- Configure CORS adequadamente
- Use prepared statements
- Implemente logs de auditoria

## 🚀 Próximos Passos

Após criar as tabelas:
1. Execute o app: `npm run dev`
2. Faça login com as credenciais de teste
3. Os dados serão sincronizados com Supabase automaticamente
