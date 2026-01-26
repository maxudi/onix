import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { 
  Plus, Eye, Edit2, Trash2, X, Save, CheckCircle, XCircle, 
  AlertCircle, ArrowLeftRight 
} from 'lucide-react';

// Função de máscara
function maskValor(v) {
  if (!v) return '0,00';
  v = v.replace(/\D/g, '');
  v = (parseInt(v, 10) / 100).toFixed(2) + '';
  v = v.replace('.', ',');
  v = v.replace(/(\d)(\d{3},)/, '$1.$2');
  return v.replace(/(\d)(\d{3})\./, '$1.$2');
}

export default function BoletosAPagar() {
  const [boletos, setBoletos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modais: 'novo' | {tipo: 'editar'} | {tipo: 'visualizar'} | {tipo: 'confirmar_pagamento'}
  const [modal, setModal] = useState(null);
  
  const [form, setForm] = useState({ descricao: '', fornecedor_id: '', valor: '', vencimento: '', pago: false, data_pagamento: '', observacao: '' });
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    fetchBoletos();
    fetchFornecedores();
  }, []);

  async function fetchBoletos() {
    setLoading(true);
    const { data } = await supabase.from('boletos_a_pagar').select('*,fornecedores(id,nome)').order('vencimento');
    setBoletos(data || []);
    setLoading(false);
  }

  async function fetchFornecedores() {
    const { data } = await supabase.from('fornecedores').select('id,nome').order('nome');
    setFornecedores(data || []);
  }

  async function alternarStatusPagamento(boleto) {
    const novoStatus = !boleto.pago;
    const dataPagamento = novoStatus ? new Date().toISOString().split('T')[0] : null;

    try {
      const { error } = await supabase
        .from('boletos_a_pagar')
        .update({ 
          pago: novoStatus, 
          data_pagamento: dataPagamento 
        })
        .eq('id', boleto.id);

      if (error) throw error;
      
      setModal(null);
      fetchBoletos();
    } catch (err) {
      alert("Erro ao atualizar status: " + err.message);
    }
  }

  async function salvarBoleto() {
    const valorLimpo = (form.valor + '').replace(/\./g, '').replace(',', '.');
    const payload = {
      descricao: form.descricao,
      fornecedor_id: form.fornecedor_id ? parseInt(form.fornecedor_id, 10) : null,
      valor: parseFloat(valorLimpo) || 0,
      vencimento: form.vencimento || null,
      pago: form.pago || false,
      data_pagamento: form.data_pagamento || null,
      observacao: form.observacao || null
    };

    try {
      let error;
      if (modal === 'novo') {
        const res = await supabase.from('boletos_a_pagar').insert([payload]);
        error = res.error;
      } else if (modal?.tipo === 'editar') {
        const res = await supabase.from('boletos_a_pagar').update(payload).eq('id', modal.boleto.id);
        error = res.error;
      }
      if (error) throw error;
      setModal(null);
      fetchBoletos();
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Boletos a Pagar</h1>
          <input
            type="text"
            className="w-full md:w-80 mt-2 p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="Buscar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <button onClick={() => { 
          setForm({ descricao: '', fornecedor_id: '', valor: '0,00', vencimento: '', pago: false, data_pagamento: '', observacao: '' });
          setModal('novo');
        }} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition-all">
          <Plus size={18}/> Novo Boleto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
            <tr>
              <th className="p-4">Descrição</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4 text-center">Status Pago</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-300 italic">Carregando...</td></tr>
            ) : (
              boletos.filter(b => b.descricao.toLowerCase().includes(busca.toLowerCase())).map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{b.descricao}</td>
                  <td className="p-4 text-gray-600">{b.fornecedores?.nome || '-'}</td>
                  <td className="p-4 font-mono font-bold">R$ {Number(b.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-4">{b.vencimento ? new Date(b.vencimento + 'T12:00:00').toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setModal({ tipo: 'confirmar_pagamento', boleto: b })}
                      className={`flex items-center gap-1 mx-auto px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                        b.pago 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {b.pago ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                      {b.pago ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="p-4 text-center flex gap-2 justify-center">
                    <button onClick={() => setModal({ tipo: 'visualizar', boleto: b })} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={16}/></button>
                    <button onClick={() => {
                      setForm({ ...b, valor: maskValor((b.valor * 100).toFixed(0)), fornecedor_id: b.fornecedor_id || '' });
                      setModal({ tipo: 'editar', boleto: b });
                    }} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={async () => { if(window.confirm('Excluir?')) { await supabase.from('boletos_a_pagar').delete().eq('id', b.id); fetchBoletos(); } }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE PAGAMENTO (O NOVO) */}
      {modal?.tipo === 'confirmar_pagamento' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-t-4 border-primary-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-3 rounded-full ${modal.boleto.pago ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                <ArrowLeftRight size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                {modal.boleto.pago ? 'Estornar Pagamento?' : 'Confirmar Pagamento?'}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Deseja alterar o status do boleto <br/>
                <span className="font-bold text-gray-800">"{modal.boleto.descricao}"</span> para 
                <span className={`ml-1 font-bold ${modal.boleto.pago ? 'text-red-600' : 'text-green-600'}`}>
                  {modal.boleto.pago ? 'PENDENTE' : 'PAGO'}
                </span>?
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => alternarStatusPagamento(modal.boleto)}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${
                  modal.boleto.pago ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Sim, Alterar
              </button>
              <button 
                onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demais Modais (Novo/Editar/Visualizar) - Mantenha como estão */}
      {(modal === 'novo' || modal?.tipo === 'editar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          {/* ... Conteúdo do modal de formulário que já enviamos antes ... */}
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
               <h3 className="font-black text-gray-800 uppercase text-sm">{modal === 'novo' ? 'Novo Boleto' : 'Editar Boleto'}</h3>
               <button onClick={() => setModal(null)} className="text-gray-400"><X size={20}/></button>
             </div>
             <div className="space-y-4">
               <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} />
               <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" value={form.fornecedor_id} onChange={e => setForm(f => ({...f, fornecedor_id: e.target.value}))}>
                 <option value="">Fornecedor</option>
                 {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
               </select>
               <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 font-mono" value={form.valor} onChange={e => setForm(f => ({...f, valor: maskValor(e.target.value)}))} />
               <input type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" value={form.vencimento} onChange={e => setForm(f => ({...f, vencimento: e.target.value}))} />
               <textarea className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Observação" value={form.observacao} onChange={e => setForm(f => ({...f, observacao: e.target.value}))} />
             </div>
             <div className="flex gap-3 mt-6">
               <button onClick={salvarBoleto} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 active:scale-95 transition-all">
                 <Save size={18}/> Salvar
               </button>
               <button onClick={() => setModal(null)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}