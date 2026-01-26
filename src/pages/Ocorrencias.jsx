import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { 
  Plus, X, Eye, Edit3, Loader2, CheckCircle2, 
  Copy, AlertTriangle, Trash2, ChevronLeft, ChevronRight, Search, LayoutDashboard
} from 'lucide-react';

function gerarProtocolo() {
  return 'ONX-' + Date.now().toString(36).toUpperCase();
}

export default function Ocorrencias() {
  const { user, isAdmin } = useAuth();
  
  // Estados de Dados
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // Estados de Interface
  const [showForm, setShowForm] = useState(false);
  const [verProtocolo, setVerProtocolo] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalSucesso, setModalSucesso] = useState(null);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  
  // Estado de Busca por Protocolo
  const [protocoloBusca, setProtocoloBusca] = useState('');
  const [buscando, setBuscando] = useState(false);

  // Estados de Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const [novaOcorrencia, setNovaOcorrencia] = useState({ titulo: '', descricao: '', categoria: '' });
  const [editando, setEditando] = useState({ protocol: null, status: '', retorno: '' });

  // --- BUSCAR DADOS (ADMIN) ---
  const fetchOcorrencias = useCallback(async () => {
    if (!isSupabaseEnabled() || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const ordenados = (data || []).sort((a, b) => {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return 0;
      });

      setOcorrencias(ordenados);
    } catch (error) {
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchOcorrencias();
  }, [fetchOcorrencias]);

  // --- CONSULTAR PROTOCOLO (USUÁRIO) ---
  async function consultarProtocolo(e) {
    if (e) e.preventDefault();
    if (!protocoloBusca.trim()) return;

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .eq('protocolo', protocoloBusca.trim().toUpperCase())
        .single();

      if (error || !data) {
        alert("Protocolo não encontrado. Verifique o código e tente novamente.");
      } else {
        // Aproveita o modal de visualização já existente
        setVerProtocolo(data.protocolo);
        setModoEdicao(false);
        // Se o admin não tiver carregado a lista, adicionamos esse item manualmente para o modal ler
        if (!isAdmin) setOcorrencias([data]); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
    }
  }

  // --- AÇÕES DE SALVAR E EXCLUIR ---
  async function salvarOcorrencia(e) {
    if (e) e.preventDefault();
    setEnviando(true);
    const protocolo = gerarProtocolo();
    try {
      const { error } = await supabase.from('ocorrencias').insert([{
        ...novaOcorrencia,
        protocolo,
        solicitante: user?.nome || user?.email || 'Anônimo',
        status: 'Pendente',
        data: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      setModalSucesso(protocolo);
      setShowForm(false);
      setNovaOcorrencia({ titulo: '', descricao: '', categoria: '' });
      if (isAdmin) fetchOcorrencias();
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setEnviando(false);
    }
  }

  async function excluirOcorrencia() {
    try {
      const { error } = await supabase.from('ocorrencias').delete().eq('protocolo', itemParaExcluir.protocolo);
      if (error) throw error;
      setItemParaExcluir(null);
      fetchOcorrencias();
    } catch (error) {
      alert("Erro ao excluir");
    }
  }

  const totalPaginas = Math.ceil(ocorrencias.length / porPagina);
  const paginadas = ocorrencias.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen font-sans text-gray-900">
      
      {/* SEÇÃO PRINCIPAL DE ACESSO (USUÁRIO E ADMIN) */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-indigo-950">Central de Ocorrências</h1>
          <p className="text-gray-500 font-medium text-sm">Registre novos chamados ou acompanhe um protocolo existente</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* CARD: NOVO REGISTRO */}
          <button 
            onClick={() => setShowForm(true)}
            className="group p-6 bg-indigo-600 rounded-[2rem] text-left hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-between"
          >
            <div>
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white">
                <Plus size={24} />
              </div>
              <h3 className="text-white font-black uppercase text-lg tracking-tight">Nova Ocorrência</h3>
              <p className="text-indigo-100 text-xs font-medium">Clique para abrir um chamado</p>
            </div>
          </button>

          {/* CARD: CONSULTAR PROTOCOLO */}
          <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="bg-gray-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-gray-600">
              <Search size={24} />
            </div>
            <h3 className="font-black uppercase text-lg tracking-tight text-gray-800">Consultar Protocolo</h3>
            <form onSubmit={consultarProtocolo} className="mt-4 flex gap-2">
              <input 
                required
                placeholder="ONX-..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 font-black text-sm uppercase placeholder:normal-case"
                value={protocoloBusca}
                onChange={e => setProtocoloBusca(e.target.value)}
              />
              <button 
                type="submit"
                disabled={buscando}
                className="bg-gray-900 text-white px-4 rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2"
              >
                {buscando ? <Loader2 className="animate-spin" size={14} /> : "Buscar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PAINEL DO ADMINISTRADOR (SÓ APARECE PARA ADMIN) */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto space-y-4 pt-8 border-t border-gray-200">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <LayoutDashboard size={20} />
            <h2 className="font-black uppercase tracking-widest text-xs">Painel Administrativo</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                    <th className="px-6 py-5">Protocolo</th>
                    <th className="px-6 py-5">Ocorrência</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 font-bold animate-pulse">CARREGANDO TABELA...</td></tr>
                  ) : paginadas.length === 0 ? (
                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 font-bold text-xs">NENHUM REGISTRO ENCONTRADO</td></tr>
                  ) : paginadas.map((item) => (
                    <tr key={item.protocolo} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-indigo-600 tracking-widest">{item.protocolo}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800">{item.titulo}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.categoria} • {item.data}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                          item.status === 'Concluído' ? 'bg-green-100 text-green-700' : 
                          item.status === 'Pendente' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setVerProtocolo(item.protocolo); setModoEdicao(false); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><Eye size={18} /></button>
                          <button onClick={() => { setVerProtocolo(item.protocolo); setModoEdicao(true); setEditando({ protocol: item.protocolo, status: item.status, retorno: item.retorno || '' }); }} className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-400"><Edit3 size={18} /></button>
                          <button onClick={() => setItemParaExcluir(item)} className="p-2 hover:bg-red-50 rounded-xl text-red-300"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase">Pág {pagina} de {totalPaginas}</span>
                <div className="flex gap-2">
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 disabled:opacity-30"><ChevronLeft size={16}/></button>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAIS (EXCLUSÃO, SUCESSO, FORM E DETALHES) --- */}
      {/* (Mantidos os modais elegantes do código anterior) */}

      {/* MODAL DETALHES/CONSULTA */}
      {verProtocolo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setVerProtocolo(null)} className="absolute top-6 right-6 text-gray-400"><X /></button>
            {(() => {
              const item = ocorrencias.find(o => o.protocolo === verProtocolo);
              if (!item) return null;
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase">{item.protocolo}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${item.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 uppercase leading-tight">{item.titulo}</h2>
                  <div className="bg-gray-50 p-4 rounded-2xl text-sm italic text-gray-600">"{item.descricao || 'Sem descrição.'}"</div>
                  
                  {modoEdicao && isAdmin ? (
                    <div className="space-y-3 pt-2 border-t">
                      <p className="text-[10px] font-black text-indigo-600 uppercase">Responder Ocorrência</p>
                      <select className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl font-bold text-xs" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}>
                        <option value="Pendente">Pendente</option>
                        <option value="Em análise">Em análise</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                      <textarea className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl text-xs h-24" placeholder="Escreva aqui..." value={editando.retorno} onChange={e => setEditando({...editando, retorno: e.target.value})} />
                      <button onClick={async () => {
                        const { error } = await supabase.from('ocorrencias').update({ status: editando.status, retorno: editando.retorno }).eq('protocolo', item.protocolo);
                        if(!error) { setVerProtocolo(null); fetchOcorrencias(); }
                      }} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-black uppercase text-[10px]">Salvar Resposta</button>
                    </div>
                  ) : (
                    <div className="pt-2">
                       <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
                          <p className="text-[9px] font-black uppercase text-indigo-500 mb-2">Retorno da Administração:</p>
                          <p className="text-sm font-bold text-indigo-900 leading-relaxed">{item.retorno || "Sua solicitação está sendo analisada por nossa equipe. Por favor, aguarde."}</p>
                       </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* (Restante dos modais: Sucesso, Formulário e Excluir seguem o mesmo padrão) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-gray-900 mb-6 uppercase">Novo Chamado</h2>
            <form onSubmit={salvarOcorrencia} className="space-y-3">
              <input required className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-sm" placeholder="O que está acontecendo?" value={novaOcorrencia.titulo} onChange={e => setNovaOcorrencia({...novaOcorrencia, titulo: e.target.value})} />
              <select required className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-sm" value={novaOcorrencia.categoria} onChange={e => setNovaOcorrencia({...novaOcorrencia, categoria: e.target.value})}>
                <option value="">Selecione o Assunto...</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Segurança">Segurança</option>
                <option value="Barulho">Barulho</option>
                <option value="Outro">Outro</option>
              </select>
              <textarea className="w-full p-4 bg-gray-50 rounded-xl border-none text-sm h-24" placeholder="Detalhes importantes..." value={novaOcorrencia.descricao} onChange={e => setNovaOcorrencia({...novaOcorrencia, descricao: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={enviando} className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-black uppercase text-[10px]">{enviando ? "Enviando..." : "Registrar Agora"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-400 p-3 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSucesso && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-sm shadow-2xl text-center">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-green-600" /></div>
            <h2 className="text-xl font-black text-gray-900 uppercase mb-4 tracking-tighter">Chamado Aberto!</h2>
            <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200 mb-6">
              <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Seu Protocolo</span>
              <span className="text-2xl font-black text-indigo-700 tracking-widest">{modalSucesso}</span>
            </div>
            <div className="flex items-start gap-2 text-left bg-amber-50 p-3 rounded-xl mb-6">
               <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-1" />
               <p className="text-[10px] font-bold text-amber-800 leading-tight">Anote este código. Ele será necessário para consultar a resposta da administração.</p>
            </div>
            <button onClick={() => setModalSucesso(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs">Entendi</button>
          </div>
        </div>
      )}

      {itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[210] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-500" /></div>
            <h3 className="text-lg font-black text-gray-900 uppercase mb-2">Excluir Registro?</h3>
            <p className="text-xs text-gray-500 font-medium mb-6">A ação apagará permanentemente o chamado {itemParaExcluir.protocolo}.</p>
            <div className="flex flex-col gap-2">
              <button onClick={excluirOcorrencia} className="w-full bg-red-500 text-white py-3 rounded-xl font-black uppercase text-[10px]">Sim, Excluir</button>
              <button onClick={() => setItemParaExcluir(null)} className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}