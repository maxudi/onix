create table pix_transacoes (
  id serial primary key,
  tipo varchar(20) not null, -- RECEBIMENTO | ENVIO
  valor numeric(14,2) not null,
  status varchar(20) not null,
  descricao text,
  txid varchar(100), -- para recebimentos
  end_to_end_id varchar(100), -- para envios
  chave_pix varchar(100),
  tipo_chave_pix varchar(20),
  pix_copia_cola text,
  qr_code_base64 text,
  favorecido_nome varchar(100),
  favorecido_documento varchar(30),
  cliente_id integer,
  data_vencimento date,
  data_confirmacao timestamp,
  banco_integracao varchar(50),
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);
