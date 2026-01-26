create table manutencao_servicos (
  id serial primary key,
  descricao varchar(100) not null,
  data_agendamento date,
  periodicidade varchar(30),
  status varchar(20) not null,
  icone varchar(30),
  card boolean default false,
  observacao text,
  profissional_empresa varchar(100),
  telefone varchar(20),
  criado_em timestamp default now(),
  atualizado_em timestamp default now()
);

-- Popula com cards fixos
insert into manutencao_servicos (descricao, data_agendamento, periodicidade, status, icone, card, observacao, profissional_empresa, telefone) values
('Bombas de Recalque', '2026-01-10', 'Semestral', 'Em dia', 'water', true, null, null, null),
('Limpeza de Caixas d’Água', '2026-02-15', 'Quinquenal', 'Agendado', 'droplet', true, null, null, null),
('Dedetização', '2026-01-20', 'Anual', 'Em dia', 'bug', true, null, null, null),
('Extintores e AVCB', '2025-12-05', 'Anual', 'Atrasado', 'flame', true, null, null, null),
('Jardim', '2026-01-05', 'Mensal', 'Em dia', 'leaf', true, null, null, null),
('Cerca elétrica/Portão/Câmeras', '2026-01-12', 'Mensal', 'Em dia', 'shield', true, null, null, null),
('Seguro', '2025-12-01', 'Anual', 'Em dia', 'shield-check', true, null, null, null),
('Elétrica', '2026-01-18', 'Semestral', 'Em dia', 'zap', true, null, null, null);
