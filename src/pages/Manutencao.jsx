import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import ManutencaoCardIcon from '../components/ManutencaoCardIcon';
import ManutencaoForm from '../components/ManutencaoForm';
import ManutencaoTable from '../components/ManutencaoTable';
import { supabase } from '../lib/supabase';


// Busca real do Supabase
const fetchServicos = async () => {
  const { data, error } = await supabase
    .from('manutencao_servicos')
    .select('*')
    .order('id', { ascending: true });
  if (error) {
    alert('Erro ao buscar serviços: ' + error.message);
    return [];
  }
  return data || [];
};

export default function Manutencao() {
  const [visualizacao, setVisualizacao] = useState('cards');
  const [servicos, setServicos] = useState([]);
  const [modal, setModal] = useState({ open: false, initial: null });


  useEffect(() => {
    fetchServicos().then(setServicos);
  }, []);

  // CRUD Handlers (mock)
  const handleAdd = () => setModal({ open: true, initial: null });
  const handleEdit = (s) => setModal({ open: true, initial: s });
  const handleDelete = (s) => {
    if (window.confirm('Excluir serviço?')) setServicos(servicos.filter(x => x.id !== s.id));
  };
  const handleView = (s) => alert(JSON.stringify(s, null, 2));
  const handleSave = (data) => {
    if (modal.initial) {
      setServicos(servicos.map(s => s.id === modal.initial.id ? { ...s, ...data } : s));
    } else {
      setServicos([{ ...data, id: Date.now() }, ...servicos]);
    }
    setModal({ open: false, initial: null });
  };

  // Cards fixos (card=true)
  const cards = servicos.filter(s => s.card);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Plano de Manutenção</h1>
          <p className="text-gray-500 text-sm">Controle preventivo das áreas técnicas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVisualizacao('cards')} className={`px-4 py-2 rounded-lg font-bold ${visualizacao==='cards' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Ver em Cards</button>
          <button onClick={() => setVisualizacao('tabela')} className={`px-4 py-2 rounded-lg font-bold ${visualizacao==='tabela' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Ver em Tabela</button>
          <button onClick={handleAdd} className="bg-gray-900 text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all font-bold">
            <Plus size={20} />
            <span className="hidden md:inline">Nova Ordem</span>
          </button>
        </div>
      </div>

      {visualizacao === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((m) => (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${
                  m.status === 'Em dia' ? 'bg-green-50 text-green-600' : 
                  m.status === 'Atrasado' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <ManutencaoCardIcon icone={m.icone} size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {m.periodicidade}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{m.descricao}</h3>
              <p className="text-xs text-gray-500 mb-4 text-pretty">Última/Próxima: {m.data_agendamento || '-'}</p>
              <div className={`text-xs font-bold ${
                m.status === 'Em dia' ? 'text-green-600' : 
                m.status === 'Atrasado' ? 'text-red-600' : 'text-blue-600'
              }`}>
                ● {m.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de ordens (todos os serviços) */}
      {visualizacao === 'tabela' && (
        <ManutencaoTable servicos={servicos} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
      )}

      {/* Modal de cadastro/edição */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100">
            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 border-b pb-2">{modal.initial ? 'Editar Serviço' : 'Nova Ordem'}</h3>
            <ManutencaoForm onSubmit={handleSave} initial={modal.initial} />
            <button onClick={() => setModal({ open: false, initial: null })} className="mt-4 px-6 py-3 text-gray-500 font-black text-xs uppercase hover:bg-gray-100 rounded-xl transition-colors w-full">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
