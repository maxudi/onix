-- ============================================
-- ONIX - Sistema de Condomínio
-- Migration Script - Criação Completa do Banco
-- ============================================

-- ============================================
-- 1. LIMPEZA (caso precise recriar)
-- ============================================
-- Descomente as linhas abaixo se precisar recriar tudo do zero
-- DROP TABLE IF EXISTS notices CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;
-- DROP TABLE IF EXISTS bills CASCADE;
-- DROP TABLE IF EXISTS units CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================
-- 2. FUNCTION PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 3. TABELA: users
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- ATENÇÃO: Use hash bcrypt em produção!
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  unit TEXT,
  role TEXT DEFAULT 'resident' CHECK (role IN ('admin', 'resident')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_unit ON users(unit);

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. TABELA: units
-- ============================================
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
CREATE INDEX idx_units_number ON units(number);
CREATE INDEX idx_units_block ON units(block);

-- Trigger
CREATE TRIGGER update_units_updated_at 
  BEFORE UPDATE ON units
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABELA: bills
-- ============================================
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('condominium', 'water', 'gas', 'electricity', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
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
CREATE INDEX idx_bills_competence ON bills(competence);

-- Trigger
CREATE TRIGGER update_bills_updated_at 
  BEFORE UPDATE ON bills
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABELA: bookings
-- ============================================
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Índices
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Trigger
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TABELA: notices
-- ============================================
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'info' CHECK (category IN ('info', 'maintenance', 'meeting', 'rules', 'general', 'urgent')),
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
CREATE INDEX idx_notices_priority ON notices(priority);

-- Trigger
CREATE TRIGGER update_notices_updated_at 
  BEFORE UPDATE ON notices
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true); -- Temporário: todos podem ver (ajuste conforme necessário)

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Políticas para UNITS
CREATE POLICY "Anyone authenticated can view units" ON units
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage units" ON units
  FOR ALL USING (true);

-- Políticas para BILLS
CREATE POLICY "Users can view bills" ON bills
  FOR SELECT USING (true);

CREATE POLICY "Users can update bills" ON bills
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert bills" ON bills
  FOR INSERT WITH CHECK (true);

-- Políticas para BOOKINGS
CREATE POLICY "Users can view bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update bookings" ON bookings
  FOR UPDATE USING (true);

-- Políticas para NOTICES
CREATE POLICY "Anyone authenticated can view notices" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Users can manage notices" ON notices
  FOR ALL USING (true);

-- ============================================
-- 9. DADOS INICIAIS
-- ============================================

-- Inserir usuário ADMIN padrão
INSERT INTO users (id, email, password, name, role, phone, cpf, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'admin@onix.com',
  'admin123', -- ATENÇÃO: Troque por senha com hash em produção!
  'Admin Sistema',
  'admin',
  '(11) 99999-9999',
  '000.000.000-00',
  NOW()
);

-- Inserir usuários moradores de exemplo
INSERT INTO users (id, email, password, name, role, phone, cpf, unit, created_at)
VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    'joao@email.com',
    '123456',
    'João Silva',
    'resident',
    '(11) 98888-8888',
    '123.456.789-00',
    '101',
    NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
    'maria@email.com',
    '123456',
    'Maria Santos',
    'resident',
    '(11) 97777-7777',
    '987.654.321-00',
    '202',
    NOW()
  ),
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    'pedro@email.com',
    '123456',
    'Pedro Oliveira',
    'resident',
    '(11) 96666-6666',
    '456.789.123-00',
    '301',
    NOW()
  );

-- Inserir unidades
INSERT INTO units (number, block, floor, owner_id, owner_name, created_at)
VALUES 
  ('101', 'A', '1', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'João Silva', NOW()),
  ('102', 'A', '1', NULL, NULL, NOW()),
  ('201', 'A', '2', NULL, NULL, NOW()),
  ('202', 'A', '2', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'Maria Santos', NOW()),
  ('301', 'A', '3', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid, 'Pedro Oliveira', NOW()),
  ('302', 'A', '3', NULL, NULL, NOW()),
  ('101', 'B', '1', NULL, NULL, NOW()),
  ('102', 'B', '1', NULL, NULL, NOW()),
  ('201', 'B', '2', NULL, NULL, NOW()),
  ('202', 'B', '2', NULL, NULL, NOW());

-- Inserir boletos de exemplo
INSERT INTO bills (user_id, type, description, amount, due_date, status, barcode, competence, created_at)
VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    'condominium',
    'Condomínio - Janeiro 2026',
    850.00,
    '2026-01-10',
    'overdue',
    '23793.38128 60000.123456 78901.234567 8 12345678901234',
    '2026-01',
    NOW()
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    'condominium',
    'Condomínio - Fevereiro 2026',
    850.00,
    '2026-02-10',
    'pending',
    '23793.38128 60000.123456 78901.234567 8 12345678901235',
    '2026-02',
    NOW()
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    'water',
    'Água - Janeiro 2026',
    120.50,
    '2026-01-15',
    'paid',
    '23793.38128 60000.654321 12345.678901 2 98765432109876',
    '2026-01',
    NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
    'condominium',
    'Condomínio - Janeiro 2026',
    950.00,
    '2026-01-10',
    'paid',
    '23793.38128 60000.789012 34567.890123 4 56789012345678',
    '2026-01',
    NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
    'condominium',
    'Condomínio - Fevereiro 2026',
    950.00,
    '2026-02-10',
    'pending',
    '23793.38128 60000.789012 34567.890123 4 56789012345679',
    '2026-02',
    NOW()
  );

-- Atualizar paid_at para boletos pagos
UPDATE bills SET paid_at = '2026-01-14 10:30:00' WHERE status = 'paid' AND user_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid;
UPDATE bills SET paid_at = '2026-01-08 14:20:00' WHERE status = 'paid' AND user_id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid;

-- Inserir reservas de exemplo
INSERT INTO bookings (user_id, user_name, unit, date, start_time, end_time, event, guests, status, created_at)
VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    'João Silva',
    '101',
    '2026-01-25',
    '14:00',
    '18:00',
    'Aniversário',
    30,
    'approved',
    NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
    'Maria Santos',
    '202',
    '2026-02-14',
    '19:00',
    '23:00',
    'Confraternização',
    25,
    'pending',
    NOW()
  ),
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    'Pedro Oliveira',
    '301',
    '2026-03-10',
    '15:00',
    '20:00',
    'Festa de Família',
    40,
    'approved',
    NOW()
  );

-- Inserir avisos de exemplo
INSERT INTO notices (title, content, author, author_id, category, priority, is_pinned, created_at)
VALUES 
  (
    'Manutenção do Elevador',
    'Informamos que no dia 25/01/2026 o elevador do Bloco A passará por manutenção preventiva das 8h às 12h. Pedimos a compreensão de todos os moradores.',
    'Admin Sistema',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'maintenance',
    'high',
    true,
    NOW()
  ),
  (
    'Assembleia Ordinária',
    'Fica convocada assembleia ordinária para o dia 10/02/2026 às 19h no salão de festas. Pauta: aprovação de contas e eleição do síndico.',
    'Admin Sistema',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'meeting',
    'high',
    true,
    NOW()
  ),
  (
    'Nova Regra de Uso da Churrasqueira',
    'A partir de fevereiro, o uso da churrasqueira deverá ser agendado com antecedência mínima de 48h. Favor entrar em contato com a portaria para reservas.',
    'Admin Sistema',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'rules',
    'medium',
    false,
    NOW()
  ),
  (
    'Coleta Seletiva',
    'Lembramos que a coleta seletiva acontece às terças e quintas-feiras. Por favor, separe corretamente seu lixo reciclável.',
    'Admin Sistema',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'info',
    'low',
    false,
    NOW()
  );

-- ============================================
-- 10. VERIFICAÇÃO
-- ============================================

-- Contar registros criados
SELECT 
  'users' as tabela, 
  COUNT(*) as total 
FROM users
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'notices', COUNT(*) FROM notices;

-- ============================================
-- MIGRATION COMPLETA! ✅
-- ============================================
-- 
-- CREDENCIAIS DE ACESSO:
-- 
-- Admin:
--   Email: admin@onix.com
--   Senha: admin123
-- 
-- Moradores:
--   Email: joao@email.com / Senha: 123456
--   Email: maria@email.com / Senha: 123456
--   Email: pedro@email.com / Senha: 123456
-- 
-- ⚠️ IMPORTANTE:
-- - Troque as senhas em produção!
-- - Use bcrypt ou Supabase Auth
-- - Configure RLS adequadamente
-- - Revise as políticas de segurança
-- 
-- ============================================
