import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { 
  Eye, Pencil, Trash2, X, Plus, CheckCircle2, XCircle, Loader2, 
  Phone, MessageCircle, User, Mail, Hash, ShieldCheck, Users 
} from "lucide-react";

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
  const [modalDelete, setModalDelete] = useState({ open: false, user: null });

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  const unidadesFixas = ["AP101", "AP102", "AP103", "AP104", "AP201", "AP202", "AP203", "AP204", "AP301", "AP302", "AP303", "AP304"];

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase.from("perfis").select("*").order("nome_completo");
      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error("Erro ao carregar lista:", err.message);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const onSubmit = async (data) => {
    try {
      let userId = selectedUser?.id;
      const cpfLimpo = data.cpf.replace(/\D/g, "");
      const telefoneLimpo = data.telefone.replace(/\D/g, "");
      const passwordAuth = cpfLimpo.length >= 6 ? cpfLimpo : `${cpfLimpo}000000`.slice(0, 6);

      if (modalMode === 'create') {
        // 1. CRIAR NO AUTH (Define o perfil nos metadados do login)
        const { data: authRes, error: authErr } = await supabase.auth.signUp({
          email: data.email.toLowerCase().trim(),
          password: passwordAuth,
          options: {
            data: {
              nome_completo: data.nome_completo.toUpperCase(),
              tipo_usuario: data.tipo_usuario,
              unidade: data.unidade_numero
            }
          }
        });

        if (authErr) {
          if (authErr.message.includes("already registered")) {
            const { data: userExistente } = await supabase.from("perfis").select("id").eq("email", data.email.toLowerCase().trim()).single();
            userId = userExistente?.id;
          } else throw authErr;
        } else {
          userId = authRes?.user?.id;
        }
      }

      // 2. SALVAR NA TABELA PERFIS, incluindo endereço fixo
      const enderecoFixo = {
        cep: '38400-015',
        logradouro: 'Avenida Rondon Pacheco',
        numero: '3333',
        bairro: 'Cazeca',
        cidade: 'Uberlândia',
        uf: 'MG',
        complemento: data.unidade_numero.toUpperCase(), // mesmo valor da unidade_numero
      };

      const payload = {
        id: userId,
        nome_completo: data.nome_completo.toUpperCase(),
        email: data.email.toLowerCase().trim(),
        cpf: cpfLimpo,
        telefone: telefoneLimpo,
        unidade_numero: data.unidade_numero.toUpperCase(),
        tipo_usuario: data.tipo_usuario,
        status: true,
        ...enderecoFixo
      };

      const { error: dbErr } = await supabase.from("perfis").upsert(payload, { onConflict: 'id' });
      if (dbErr) throw dbErr;

      setMensagemSucesso("CONCLUÍDO!");
      setModalMode('success');
      setTimeout(() => setModalMode(null), 2000);
      reset();
      fetchUsuarios();
    } catch (err) {
      alert("ERRO: " + err.message);
    }
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    reset();
    Object.keys(u).forEach(key => {
        if(key === 'cpf') setValue(key, maskCPF(u[key] || ""));
        else if(key === 'telefone') setValue(key, maskPhone(u[key] || ""));
        else setValue(key, u[key]);
    });
    setModalMode('edit');
  };

  // Função para deletar usuário
  const handleDelete = async () => {
    if (!modalDelete.user) return;
    try {
      const { error } = await supabase.from("perfis").delete().eq("id", modalDelete.user.id);
      if (error) throw error;
      setMensagemSucesso("Usuário excluído com sucesso!");
      setModalDelete({ open: false, user: null });
      fetchUsuarios();
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">Condôminos</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Painel de Controle de Acessos</p>
          </div>
          <button onClick={() => { setSelectedUser(null); reset(); setModalMode('create'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl transition-all active:scale-95">
             NOVO CADASTRO
          </button>
        </div>

        {/* TABELA DE USUÁRIOS */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 font-black text-slate-400 uppercase text-[10px]">Morador</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase text-[10px]">Perfil de Acesso</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase text-[10px]">Unidade</th>
                <th className="px-8 py-6 font-black text-slate-400 uppercase text-[10px] text-center">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-800 text-[14px] uppercase">{u.nome_completo}</div>
                    <div className="text-slate-400 text-[11px] font-bold">{u.email}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      u.tipo_usuario === 'sindico' ? 'bg-amber-100 text-amber-700' : 
                      u.tipo_usuario === 'proprietario' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {u.tipo_usuario}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-700">{u.unidade_numero}</td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-3 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all"><Pencil size={18} /></button>
                      <button onClick={() => setModalDelete({ open: true, user: u })} className="p-3 bg-slate-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all" title="Excluir usuário"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CADASTRO (O CAMPO DE PERFIL ESTÁ AQUI) */}
        {(modalMode === 'create' || modalMode === 'edit') && (
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-8 border-b flex justify-between items-center">
                <h2 className="font-black text-indigo-950 uppercase tracking-tighter text-xl">
                  {modalMode === 'create' ? 'Novo Cadastro' : 'Editar Dados'}
                </h2>
                <button onClick={() => setModalMode(null)} className="p-2 text-slate-300 hover:text-red-500"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-6">
                
                {/* SELETOR DE PERFIL (ESSENCIAL) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">
                    <Users size={12} /> Perfil do Usuário no Sistema
                  </label>
                  <select 
                    {...register("tipo_usuario", { required: true })} 
                    className="w-full p-4 bg-slate-100 border-none rounded-2xl font-black text-slate-700 uppercase focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="morador">🏠 Morador (Acesso Padrão)</option>
                    <option value="sindico">🔑 Síndico (Administrador)</option>
                    <option value="proprietario">🏢 Proprietário</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Unidade</label>
                    <select {...register("unidade_numero", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500">
                      <option value="">---</option>
                      {unidadesFixas.map(un => <option key={un} value={un}>{un}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">CPF (Senha)</label>
                    <input {...register("cpf", { required: true })} onChange={(e) => e.target.value = maskCPF(e.target.value)} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" placeholder="000.000.000-00" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome Completo</label>
                    <input {...register("nome_completo", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-bold uppercase focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">E-mail</label>
                    <input type="email" {...register("email", { required: true })} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">WhatsApp</label>
                    <input {...register("telefone", { required: true })} onChange={(e) => e.target.value = maskPhone(e.target.value)} className="w-full mt-1.5 p-4 bg-slate-100 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Cadastro'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        {/* MODAL SUCESSO */}
        {modalMode === 'success' && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="bg-indigo-950 text-white px-10 py-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center animate-bounce">
              <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
              <span className="font-black text-sm uppercase tracking-[0.3em]">{mensagemSucesso}</span>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {modalDelete.open && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-200">
              <Trash2 className="text-red-500 mx-auto mb-4" size={48} />
              <h3 className="font-black text-slate-800 mb-2 uppercase text-lg">Excluir usuário?</h3>
              <p className="text-xs text-slate-500 mb-6 font-bold uppercase">Esta ação não pode ser desfeita.<br/>Tem certeza que deseja excluir <span className='text-red-600'>{modalDelete.user?.nome_completo}</span>?</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setModalDelete({ open: false, user: null })} className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-600 transition-all">Sim, excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}