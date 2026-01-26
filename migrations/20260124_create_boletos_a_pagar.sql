-- Migration para criar a tabela boletos_a_pagar
create table if not exists boletos_a_pagar (
  id serial primary key,
  descricao varchar(120) not null,
  fornecedor_id integer references fornecedores(id),
  valor numeric(12,2) not null,
  vencimento date not null,
  pago boolean default false,
  data_pagamento date,
  observacao varchar(255),
  created_at timestamp default now()
);
