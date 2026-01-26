-- 1. Criar a tabela de Perfis (Condôminos)
CREATE TABLE public.perfis (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  telefone TEXT,
  
  -- Endereço Normalizado
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT, -- Ex: Bloco B, Apto 102
  bairro TEXT,
  cidade TEXT,
  uf CHAR(2),
  
  -- Dados de Condomínio
  bloco_torre TEXT,
  unidade_numero TEXT,
  tipo_usuario TEXT DEFAULT 'morador' CHECK (tipo_usuario IN ('proprietario', 'inquilino', 'sindico', 'funcionario')),
  status_aprovacao TEXT DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'ativo', 'bloqueado')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Policies)
-- O usuário pode ler apenas o próprio perfil
CREATE POLICY "Usuários podem ver o próprio perfil" 
ON public.perfis FOR SELECT 
USING (auth.uid() = id);

-- O usuário pode atualizar apenas o próprio perfil
CREATE POLICY "Usuários podem atualizar o próprio perfil" 
ON public.perfis FOR UPDATE 
USING (auth.uid() = id);

-- 4. Função para inserir automaticamente ao criar conta no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, tipo_usuario)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'tipo', 'morador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();