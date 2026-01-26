import React, { useState } from 'react';
import InputMask from 'react-input-mask';

const icones = [
  { value: 'water', label: 'Bombas de Recalque' },
  { value: 'droplet', label: 'Limpeza de Caixa d’Água' },
  { value: 'bug', label: 'Dedetização' },
  { value: 'flame', label: 'Extintores/AVCB' },
  { value: 'leaf', label: 'Jardim' },
  { value: 'shield', label: 'Cerca elétrica/Portão/Câmeras' },
  { value: 'shield-check', label: 'Seguro' },
  { value: 'zap', label: 'Elétrica' },
  { value: 'wrench', label: 'Manutenção Geral' },
  { value: 'thermometer', label: 'Climatização' },
  { value: 'trash', label: 'Coleta de Lixo' },
  { value: 'lock', label: 'Portas/Fechaduras' },
  { value: 'camera', label: 'Câmeras' },
  { value: 'wifi', label: 'Internet/Wi-Fi' },
  { value: 'battery', label: 'Baterias' },
  { value: 'lightbulb', label: 'Iluminação' },
  { value: 'truck', label: 'Transporte' },
  { value: 'paintbrush', label: 'Pintura' },
  { value: 'hammer', label: 'Obras' },
  { value: 'cloud', label: 'Cobertura' },
  { value: 'fan', label: 'Ventilação' },
  { value: 'bell', label: 'Alarme' },
  { value: 'user', label: 'Serviço Pessoal' },
];


export default function ManutencaoForm({ onSubmit, initial }) {
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [dataAgendamento, setDataAgendamento] = useState(initial?.data_agendamento || '');
  const [periodicidade, setPeriodicidade] = useState(initial?.periodicidade || 'Mensal');
  const [status, setStatus] = useState(initial?.status || 'Em dia');
  const [icone, setIcone] = useState(initial?.icone || 'shield');
  const [card, setCard] = useState(initial?.card || false);
  const [observacao, setObservacao] = useState(initial?.observacao || '');
  const [profissionalEmpresa, setProfissionalEmpresa] = useState(initial?.profissional_empresa || '');
  const [telefone, setTelefone] = useState(initial?.telefone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!descricao) return alert('Descrição obrigatória!');
    onSubmit && onSubmit({
      descricao,
      data_agendamento: dataAgendamento,
      periodicidade,
      status,
      icone,
      card,
      observacao,
      profissional_empresa: profissionalEmpresa,
      telefone
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold mb-1">Descrição *</label>
        <input className="input" value={descricao} onChange={e => setDescricao(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Data de Agendamento</label>
        <input type="date" className="input" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} />
      </div>
      <div>
        <label className="block font-bold mb-1">Periodicidade</label>
        <select className="input" value={periodicidade} onChange={e => setPeriodicidade(e.target.value)}>
          <option>Mensal</option>
          <option>Trimestral</option>
          <option>Semestral</option>
          <option>Anual</option>
          <option>Bienal</option>
          <option>Quinquenal</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Status</label>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          <option>Em dia</option>
          <option>Atrasado</option>
          <option>Agendado</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Ícone</label>
        <select className="input" value={icone} onChange={e => setIcone(e.target.value)}>
          {icones.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="card" checked={card} onChange={e => setCard(e.target.checked)} />
        <label htmlFor="card" className="font-bold">Exibir como Card</label>
      </div>
      <div>
        <label className="block font-bold mb-1">Profissional/Empresa</label>
        <input className="input" value={profissionalEmpresa} onChange={e => setProfissionalEmpresa(e.target.value)} />
      </div>
      <div>
        <label className="block font-bold mb-1">Telefone</label>
        <InputMask
          className="input"
          mask={telefone.replace(/\D/g, '').length > 10 ? '(99) 99999-9999' : '(99) 9999-9999'}
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          placeholder="(99) 99999-9999"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">Observação</label>
        <textarea className="input" value={observacao} onChange={e => setObservacao(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary">Salvar</button>
    </form>
  );
}
