-- Migration para criar a tabela fornecedores
create table if not exists fornecedores (
  id serial primary key,
  nome varchar(120) not null,
  ramo varchar(60) not null,
  telefone varchar(20),
  endereco varchar(200),
  chave_pix varchar(80),
  created_at timestamp default now()
);
