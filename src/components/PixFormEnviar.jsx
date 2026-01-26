import React, { useState } from 'react';

export default function PixFormEnviar({ onSubmit }) {
  const [chavePix, setChavePix] = useState('');
  const [tipoChave, setTipoChave] = useState('CPF');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [favorecidoNome, setFavorecidoNome] = useState('');
  const [favorecidoDocumento, setFavorecidoDocumento] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return alert('Informe um valor válido!');
    if (!chavePix) return alert('Informe a chave Pix!');
    onSubmit && onSubmit({ chavePix, tipoChave, valor, descricao, favorecidoNome, favorecidoDocumento });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-bold mb-1">Chave Pix *</label>
        <input type="text" className="input" value={chavePix} onChange={e => setChavePix(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Tipo da Chave *</label>
        <select className="input" value={tipoChave} onChange={e => setTipoChave(e.target.value)}>
          <option value="CPF">CPF</option>
          <option value="CNPJ">CNPJ</option>
          <option value="EMAIL">E-mail</option>
          <option value="TELEFONE">Telefone</option>
          <option value="ALEATORIA">Aleatória</option>
        </select>
      </div>
      <div>
        <label className="block font-bold mb-1">Valor *</label>
        <input type="number" min="0.01" step="0.01" className="input" value={valor} onChange={e => setValor(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Descrição *</label>
        <input type="text" className="input" value={descricao} onChange={e => setDescricao(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Nome do Favorecido *</label>
        <input type="text" className="input" value={favorecidoNome} onChange={e => setFavorecidoNome(e.target.value)} required />
      </div>
      <div>
        <label className="block font-bold mb-1">Documento do Favorecido *</label>
        <input type="text" className="input" value={favorecidoDocumento} onChange={e => setFavorecidoDocumento(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary">Enviar Pix</button>
    </form>
  );
}
