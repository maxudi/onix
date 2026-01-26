import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  Users, Building2, Plus, Search, Camera, Phone, 
  X, Trash2, CheckCircle2, Loader2, UserMinus, AlertTriangle 
} from "lucide-react";

// Configuração das unidades fixas (12 unidades)
const unidadesFixas = [
  "AP101", "AP102", "AP103", "AP104", 
  "AP201", "AP202", "AP203", "AP204", 
  "AP301", "AP302", "AP303", "AP304"
];

// Máscara para telefone (XX) XXXXX-XXXX
const maskPhone = (v) => {
  const r = v.replace(/\D/g, "");
  if (r.length > 10) return r.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3").slice(0, 15);
  return r.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").slice(0, 14);
};

export default function Administracao() {
  const [moradores, setMoradores] = useState([]);
  const [activeTab, setActiveTab] = useState('residents');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create', 'delete', 'success'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Formulário
  const [form, setForm] = useState({ nome: "", nascimento: "", telefone: "", unidade: "" });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  async function fetchData() {
    const { data } = await supabase.from("moradores").select("*").order("nome");
    setMoradores(data || []);
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let foto_url = null;

    try {
      // 1. Upload da Foto (se houver) com limpeza de nome de arquivo
      if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; // Evita erro de caracteres especiais no fetch

        const { data: storageData, error: storageErr } = await supabase.storage
          .from("fotos-moradores")
          .upload(fileName, foto, { upsert: true });
        
        if (storageErr) throw storageErr;
        foto_url = storageData.path;
      }

      // 2. Inserção no Banco de Dados
      const { error: dbError } = await supabase.from("moradores").insert([{
        nome: form.nome.toUpperCase(),
        nascimento: form.nascimento,
        telefone: form.telefone.replace(/\D/g, ""),
        unidade: form.unidade,
        foto_url: foto_url
      }]);

      if (dbError) throw dbError;

      // Sucesso
      setModalMode('success');
      setForm({ nome: "", nascimento: "", telefone: "", unidade: "" });
      setFoto(null);
      setPreview(null);
      setTimeout(() => setModalMode(null), 2000);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("ERRO NO CADASTRO: " + (err.message || "Verifique as políticas de RLS ou conexão."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      if (selectedUser.foto_url) {
        await supabase.storage.from("fotos-moradores").remove([selectedUser.foto_url]);
      }
      await supabase.from("moradores").delete().eq("id", selectedUser.id);
      setModalMode(null);
      fetchData();
    } catch (err) { 
      alert(err.message); 
    }
  };

  const filteredResidents = moradores.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.unidade.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900 uppercase">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 tracking-tighter">Administração</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Controle de Moradores e Unidades</p>
          </div>
          <button onClick={() => setModalMode('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black transition-all active:scale-95">
            <Plus size={20} /> CADASTRAR MORADOR
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Total Moradores</p>
              <p className="text-4xl font-black text-indigo-950">{moradores.length}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><Users size={32} /></div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Unidades Ativas</p>
              <p className="text-4xl font-black text-indigo-950">12</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Building2 size={32} /></div>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-50">
            {['residents', 'units'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 py-6 text-xs font-black tracking-[0.2em] transition-all uppercase ${activeTab === tab ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/30' : 'text-slate-400'}`}
              >
                {tab === 'residents' ? 'LISTA DE MORADORES' : 'MAPA DE UNIDADES'}
              </button>
            ))}
          </div>

          <div className="p-8">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="BUSCAR POR NOME OU APTO..." 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 uppercase" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {activeTab === 'residents' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResidents.map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 transition-all">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shadow-inner flex-shrink-0">
                      {m.foto_url ? (
                        <img src={supabase.storage.from("fotos-moradores").getPublicUrl(m.foto_url).data.publicUrl} className="w-full h-full object-cover" />
                      ) : ( 
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Camera size={20} /></div> 
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm">{m.nome}</p>
                      <p className="text-[10px] font-bold text-indigo-500 tracking-tighter">UNIDADE {m.unidade} • {maskPhone(m.telefone)}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedUser(m); setModalMode('delete'); }} 
                      className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {unidadesFixas.map(un => (
                  <div 
                    key={un} 
                    onClick={() => { setSearchTerm(un); setActiveTab('residents'); }} 
                    className="p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <Building2 className="text-slate-200 group-hover:text-indigo-400 mb-3" size={24} />
                    <p className="font-black text-slate-800 text-lg">{un}</p>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      {moradores.filter(m => m.unidade === un).length} CADASTRADOS
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE CADASTRO */}
        {modalMode === 'create' && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <h2 className="font-black text-indigo-950 tracking-tighter text-xl uppercase">Novo Morador</h2>
                <button onClick={() => setModalMode(null)} className="text-slate-300 hover:text-red-500"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-28 h-28 rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                    {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" size={32} />}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFotoChange} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">FOTO DO MORADOR</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">NOME COMPLETO</label>
                    <input className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">DATA NASCIMENTO</label>
                    <input type="date" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold" value={form.nascimento} onChange={e => setForm({...form, nascimento: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">TELEFONE</label>
                    <input className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold" value={form.telefone} onChange={e => setForm({...form, telefone: maskPhone(e.target.value)})} required />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">UNIDADE</label>
                    <select className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-black text-indigo-600" value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} required>
                      <option value="">SELECIONAR</option>
                      {unidadesFixas.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR CADASTRO'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE EXCLUSÃO ELEGANTE */}
        {modalMode === 'delete' && selectedUser && (
          <div className="fixed inset-0 bg-red-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-sm p-12 text-center shadow-2xl animate-in zoom-in duration-200 border border-white">
              <div className="bg-red-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-red-500">
                <UserMinus size={48} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">REMOVER MORADOR?</h2>
              <p className="text-slate-400 text-[10px] mt-2 mb-8 font-bold leading-relaxed uppercase">
                VOCÊ ESTÁ REMOVENDO <span className="text-red-500">{selectedUser.nome}</span>.<br/>ESTA AÇÃO NÃO PODE SER DESFEITA.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalMode(null)} className="flex-1 py-4 font-black text-[10px] text-slate-400 tracking-widest uppercase">CANCELAR</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-600 transition-all uppercase">REMOVER AGORA</button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK DE SUCESSO (NOTIFICAÇÃO) */}
        {modalMode === 'success' && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-indigo-950 text-white px-12 py-10 rounded-[3rem] shadow-2xl flex flex-col items-center border-2 border-indigo-500/20 backdrop-blur-xl">
              <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
                <CheckCircle2 size={50} className="text-emerald-400" />
              </div>
              <span className="font-black text-sm tracking-[0.3em] uppercase">CADASTRADO COM SUCESSO!</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}