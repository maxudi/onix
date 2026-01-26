import { useState, useEffect } from 'react';
const RAMOS = [
  'Limpeza', 'Manutenção', 'Segurança', 'Jardinagem', 'Elétrica', 'Hidráulica', 'TI', 'Consultoria', 'Outros'
];
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Plus, Eye, Edit2, Trash2, X, Save } from 'lucide-react';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'novo' | { tipo: 'visualizar'|'editar', fornecedor }
  const [form, setForm] = useState({ nome: '', ramo: '', telefone: '', endereco: '', chave_pix: '' });
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    fetchFornecedores();
  }, []);

  async function fetchFornecedores() {
    setLoading(true);
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    setFornecedores(data || []);
    setLoading(false);
  }

  // Busca inteligente
  const fornecedoresFiltrados = busca.trim().length === 0 ? fornecedores : fornecedores.filter(f => {
    const b = busca.toLowerCase();
    return (
      f.nome?.toLowerCase().includes(b) ||
      f.ramo?.toLowerCase().includes(b) ||
      f.telefone?.toLowerCase().includes(b) ||
      f.endereco?.toLowerCase().includes(b) ||
      f.chave_pix?.toLowerCase().includes(b)
    );
  });

  // Máscara telefone (celular BR + fixo)
  function maskTelefone(v) {
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
      // Fixo: (99) 9999-9999
      return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      // Celular: (99) 99999-9999
      return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
  }

  function openNovo() {
    setForm({ nome: '', ramo: '', telefone: '', endereco: '', chave_pix: '' });
    setModal('novo');
  }

  function openVisualizar(fornecedor) {
    setModal({ tipo: 'visualizar', fornecedor });
  }

  function openEditar(fornecedor) {
    setForm(fornecedor);
    setModal({ tipo: 'editar', fornecedor });
  }

  async function salvarFornecedor() {
    if (modal === 'novo') {
      await supabase.from('fornecedores').insert([form]);
    } else if (modal?.tipo === 'editar') {
      await supabase.from('fornecedores').update(form).eq('id', form.id);
    }
    setModal(null);
    fetchFornecedores();
  }

  async function excluirFornecedor(id) {
    if (window.confirm('Deseja realmente excluir este fornecedor?')) {
      await supabase.from('fornecedores').delete().eq('id', id);
      fetchFornecedores();
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Fornecedores</h1>
          <input
            type="text"
            className="w-full md:w-80 p-2 rounded-lg border bg-white font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="Buscar por nome, ramo, telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <button onClick={openNovo} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition-all h-fit">
          <Plus size={18}/> Novo Fornecedor
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Ramo</th>
              <th className="p-4">Telefone</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-300 italic font-medium">Carregando...</td></tr>
            ) : fornecedoresFiltrados.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-300 italic font-medium">Nenhum fornecedor encontrado.</td></tr>
            ) : (
              fornecedoresFiltrados.map(f => (
                <tr key={f.id}>
                  <td className="p-4 font-bold text-gray-900">{f.nome}</td>
                  <td className="p-4">{f.ramo}</td>
                  <td className="p-4">{f.telefone}</td>
                  <td className="p-4 text-center flex gap-2 justify-center">
                    <button onClick={() => openVisualizar(f)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Visualizar"><Eye size={16}/></button>
                    <button onClick={() => openEditar(f)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg" title="Editar"><Edit2 size={16}/></button>
                    <button onClick={() => excluirFornecedor(f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo/Editar */}
      {(modal === 'novo' || modal?.tipo === 'editar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">{modal === 'novo' ? 'Novo Fornecedor' : 'Editar Fornecedor'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} />
              <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" value={form.ramo} onChange={e => setForm(f => ({...f, ramo: e.target.value}))}>
                <option value="">Selecione o ramo</option>
                {RAMOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Telefone" value={form.telefone} onChange={e => setForm(f => ({...f, telefone: maskTelefone(e.target.value)}))} maxLength={15} />
              <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Endereço" value={form.endereco} onChange={e => setForm(f => ({...f, endereco: e.target.value}))} />
              <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50" placeholder="Chave Pix" value={form.chave_pix} onChange={e => setForm(f => ({...f, chave_pix: e.target.value}))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={salvarFornecedor} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-200 active:scale-95 transition-all">
                <Save size={18}/> Salvar
              </button>
              <button onClick={() => setModal(null)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {modal?.tipo === 'visualizar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-widest">Fornecedor</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <div className="space-y-2">
              <div className="font-black text-lg text-primary-700">{modal.fornecedor.nome}</div>
              <div className="text-gray-500 text-sm">Ramo: <span className="font-bold text-gray-700">{modal.fornecedor.ramo}</span></div>
              <div className="text-gray-500 text-sm">Telefone: <span className="font-bold text-gray-700">{modal.fornecedor.telefone}</span></div>
              <div className="text-gray-500 text-sm">Endereço: <span className="font-bold text-gray-700">{modal.fornecedor.endereco}</span></div>
              <div className="text-gray-500 text-sm">Chave Pix: <span className="font-bold text-gray-700">{modal.fornecedor.chave_pix}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-200 active:scale-95 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}