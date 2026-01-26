-- Pasta Digital: Tabela para arquivos enviados
CREATE TABLE public.arquivos_pasta_digital (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
