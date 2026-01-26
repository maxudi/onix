import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { Eye, Pencil, Trash2, X, Plus, CheckCircle2, XCircle, Loader2, Phone, MessageCircle, User, MapPin, Mail, Hash } from "lucide-react";

// Máscaras Visuais
const maskCPF = (v) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
const maskPhone = (v) => {
  const r = v.replace(/\D/g, "");
  if (r.length > 10) return r.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3").slice(0, 15);
  return r.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").slice(0, 14);
};

export default function CadastroCondomino() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalMode, setModalMode] = useState(null); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  const unidadesFixas = ["AP101", "AP102", "AP103", "AP104", "AP201", "AP202", "AP203", "AP204", "AP301", "AP302", "AP303", "AP304"];

  const fetchUsuarios = async () => {
    const { data } = await supabase.from("perfis").select("*").order("nome_completo");
    setUsuarios(data || []);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  // FUNÇÃO EXCLUIR
  const handleDeleteUser = async () => {
    try {
      const { error } = await supabase.from("perfis").delete().eq("id", selectedUser.id);
      if (error) throw error;
      
      setMensagemSucesso("REMOVIDO!");
      setModalMode('success');
      setTimeout(() => setModalMode(null), 2000);
      fetchUsuarios();
    } catch (err) {
      alert("ERRO AO EXCLUIR: " + err.message);
    }
  };

  const onSubmit = async (data) => {
    try {
      let userId = selectedUser?.id;
      const cpfLimpo = data.cpf.replace(/\D/g, "");
      const telefoneLimpo = data.telefone.replace(/\D/g, "");

      if (modalMode === 'create') {
        const { data: authRes, error: authErr } = await supabase.auth.signUp({
          email: data.email.toLowerCase(), 
          password: cpfLimpo,
        });
        if (authErr && authErr.message !== "User already registered") throw authErr;
        userId = authRes?.user?.id || (await supabase.from("perfis").select("id").eq("email", data.email.toLowerCase()).single()).data?.id;
      }

      const payload = {
        id: userId,
        nome_completo: data.nome_completo.toUpperCase(),
        email: data.email.toLowerCase(),
        cpf: cpfLimpo,
        telefone: telefoneLimpo,
        unidade_numero: data.unidade_numero.toUpperCase(),
        complemento: data.unidade_numero.toUpperCase(),
        tipo_usuario: data.tipo_usuario,
        status: true,
        logradouro: "AVENIDA RONDON PACHECO",
        numero: "3333", bairro: "CAZECA", cidade: "UBERLÂNDIA", uf: "MG", cep: "38400015"
      };

      const { error: dbErr } = await supabase.from("perfis").upsert(payload, { onConflict: 'id' });
      if (dbErr) throw dbErr;

      setMensagemSucesso("DADOS PROCESSADOS!");
      setModalMode('success');
      setTimeout(() => setModalMode(null), 2000);
      reset();
      fetchUsuarios();
    } catch (err) { alert("ERRO: " + err.message); }
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    Object.keys(u).forEach(key => {
        if(key === 'cpf') setValue(key, maskCPF(u[key]));
        else if(key === 'telefone') setValue(key, maskPhone(u[key]));
        else setValue(key, u[key]);
    });
    setModalMode('edit');
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">Cadastro de Condomínos</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Gestão de Moradores Responsáveis</p>
          </div>
          <button onClick={() => { setSelectedUser(null); reset(); setModalMode('create'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl transition-all active:scale-95">
             NOVO CADASTRO
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Status</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Morador & Unidade</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Contato Direto</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] text-center font-bold">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-5">
                    {u.status ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-slate-200" size={24} />}
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-800 text-[14px] uppercase">{u.nome_completo}</div>
                    <div className="text-indigo-600 font-bold text-[11px] mt-0.5 tracking-wider">UNIDADE: {u.unidade_numero} • {u.tipo_usuario.toUpperCase()}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap min-w-[200px]">
                    <a 
                      href={`https://wa.me/55${u.telefone?.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700 transition-all group"
                    >
                      <div className="bg-emerald-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <MessageCircle size={18} fill="currentColor" className="text-emerald-600" />
                      </div>
                      <span className="font-black text-[14px] tracking-tight">{u.telefone ? maskPhone(u.telefone) : 'SEM NÚMERO'}</span>
                    </a>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelectedUser(u); setModalMode('view'); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Visualizar"><Eye size={20} /></button>
                      <button onClick={() => openEdit(u)} className="p-3 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all" title="Editar"><Pencil size={20} /></button>
                      <button onClick={() => { setSelectedUser(u); setModalMode('delete'); }} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Excluir"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL PRINCIPAL (CREATE/EDIT) */}
        {(modalMode === 'create' || modalMode === 'edit') && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white animate-in zoom-in duration-200">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <h2 className="font-black text-indigo-950 uppercase tracking-tighter text-xl">{modalMode === 'create' ? 'Novo Cadastro' : 'Editar Dados'}</h2>
                <button onClick={() => setModalMode(null)} className="p-2 hover:bg-red-50 rounded-full text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Perfil de Acesso</label>
                    <select {...register("tipo_usuario", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-700 uppercase focus:ring-2 focus:ring-indigo-500">
                      <option value="morador">Morador</option>
                      <option value="sindico">Síndico</option>
                      <option value="proprietario">Proprietário</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Unidade</label>
                    <select {...register("unidade_numero", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500">
                      <option value="">SELECIONAR</option>
                      {unidadesFixas.map(un => <option key={un} value={un}>{un}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nome Completo</label>
                    <input {...register("nome_completo", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-bold uppercase focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">CPF</label>
                    <input {...register("cpf", { required: true })} onChange={(e) => e.target.value = maskCPF(e.target.value)} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Telefone</label>
                    <input {...register("telefone", { required: true })} onChange={(e) => e.target.value = maskPhone(e.target.value)} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">E-mail</label>
                    <input type="email" {...register("email", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar e Gravar'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VISUALIZAR (VIEW) */}
        {modalMode === 'view' && selectedUser && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-white">
              <div className="bg-indigo-600 p-8 text-white relative">
                <button onClick={() => setModalMode(null)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4"><User size={32} /></div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedUser.nome_completo}</h2>
                <p className="text-indigo-100 font-bold text-xs tracking-widest mt-1 uppercase">{selectedUser.tipo_usuario} • UNIDADE {selectedUser.unidade_numero}</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl text-slate-400"><Mail size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail de Acesso</p>
                    <p className="font-bold text-slate-700">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl text-slate-400"><Hash size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento CPF</p>
                    <p className="font-bold text-slate-700">{maskCPF(selectedUser.cpf)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl text-slate-400"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone Principal</p>
                    <p className="font-bold text-slate-700">{maskPhone(selectedUser.telefone)}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t flex justify-center">
                 <button onClick={() => setModalMode(null)} className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all">Fechar Detalhes</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EXCLUIR (DELETE) */}
        {modalMode === 'delete' && selectedUser && (
          <div className="fixed inset-0 bg-red-950/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 text-center shadow-2xl animate-in zoom-in duration-200">
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={40} /></div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Excluir Morador?</h2>
              <p className="text-slate-400 text-xs mt-2 mb-8 font-medium">Você está prestes a remover <span className="text-slate-700 font-bold">{selectedUser.nome_completo}</span>. Esta ação é permanente.</p>
              <div className="flex gap-3">
                <button onClick={() => setModalMode(null)} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button onClick={handleDeleteUser} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100">Sim, Remover</button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK SUCESSO */}
        {modalMode === 'success' && (
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <div className="bg-indigo-950 text-white px-10 py-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center animate-bounce border-2 border-indigo-500/20 backdrop-blur-xl">
              <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
              <span className="font-black text-sm uppercase tracking-[0.3em]">{mensagemSucesso}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}