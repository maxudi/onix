import React, { useState } from 'react';

export default function PixFormReceber({ onSubmit }) {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cliente, setCliente] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido!');
    onSubmit && onSubmit({ valor, descricao, cliente, dataVencimento });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold mb-1">Valor *</label>
        <input type="number" min="0.01" step="0.01" className="input" value={valor} onChange={e => setValor(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Descrição *</label>
        <input type="text" className="input" value={descricao} onChange={e => setDescricao(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Cliente (opcional)</label>
        <input type="text" className="input" value={cliente} onChange={e => setCliente(e.target.value)} />
      </div>
      <div>
        <label className="block font-bold mb-1">Data de Vencimento (opcional)</label>
        <input type="date" className="input" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary">Gerar Pix</button>
    </form>
  );
}
