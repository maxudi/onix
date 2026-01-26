import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { 
  Upload, FileText, Plus, X, Calendar, 
  Download, Loader2, FolderOpen, Trash2,
  Music, Video, FileCode, Archive, FileSpreadsheet
} from "lucide-react";

const getFileConfig = (filename) => {
  const ext = filename?.split('.').pop().toLowerCase();
  const configs = {
    pdf: { icon: <FileText size={24} />, color: "text-red-500", bg: "bg-red-50", label: "PDF" },
    doc: { icon: <FileText size={24} />, color: "text-blue-600", bg: "bg-blue-50", label: "WORD" },
    docx: { icon: <FileText size={24} />, color: "text-blue-600", bg: "bg-blue-50", label: "WORD" },
    xls: { icon: <FileSpreadsheet size={24} />, color: "text-emerald-600", bg: "bg-emerald-50", label: "EXCEL" },
    xlsx: { icon: <FileSpreadsheet size={24} />, color: "text-emerald-600", bg: "bg-emerald-50", label: "EXCEL" },
    mp3: { icon: <Music size={24} />, color: "text-purple-600", bg: "bg-purple-50", label: "ÁUDIO" },
    mp4: { icon: <Video size={24} />, color: "text-indigo-600", bg: "bg-indigo-50", label: "VÍDEO" },
    zip: { icon: <Archive size={24} />, color: "text-amber-600", bg: "bg-amber-50", label: "ZIP" },
  };
  return configs[ext] || { icon: <FileCode size={24} />, color: "text-slate-400", bg: "bg-slate-50", label: "ARQ" };
};

export default function PastaDigital() {
  const [arquivos, setArquivos] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  useEffect(() => { fetchArquivos(); }, [mes, ano]);

  async function fetchArquivos() {
    try {
      let query = supabase.from("arquivos_pasta_digital").select("*").order("data_upload", { ascending: false });
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01 00:00:00`;
      const endDate = `${ano}-${String(mes).padStart(2, '0')}-31 23:59:59`;
      query = query.gte("data_upload", startDate).lte("data_upload", endDate);
      const { data, error } = await query;
      if (error) throw error;
      setArquivos(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !descricao) return alert("Preencha tudo!");
    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const path = `uploads/${fileName}`;
      await supabase.storage.from("arquivos-onix").upload(path, file);
      await supabase.from("arquivos_pasta_digital").insert({ descricao: descricao.toUpperCase(), caminho_arquivo: path });
      setDescricao(""); setFile(null); if(inputRef.current) inputRef.current.value = "";
      fetchArquivos();
    } catch (err) { alert("Erro no cadastro: " + err.message); } finally { setIsSubmitting(false); }
  }

  async function handleDelete(arquivo) {
    if (!window.confirm(`Excluir: ${arquivo.descricao}?`)) return;
    try {
      await supabase.storage.from("arquivos-onix").remove([arquivo.caminho_arquivo]);
      await supabase.from("arquivos_pasta_digital").delete().eq("id", arquivo.id);
      fetchArquivos();
    } catch (err) { alert("Erro ao excluir"); }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900 uppercase">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase">PASTA DIGITAL</h1>
          <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Gerenciamento de Arquivos</p>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400">MÊS:</span>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black text-indigo-600 focus:ring-0">
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'}).toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400">ANO:</span>
            <select value={ano} onChange={(e) => setAno(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black text-indigo-600 focus:ring-0">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* FORM UPLOAD */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 mb-10">
          <form className="flex flex-col md:flex-row gap-6 items-end" onSubmit={handleUpload}>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-slate-400 ml-2 mb-2 block tracking-widest">DESCRIÇÃO</label>
              <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold uppercase placeholder:text-slate-300" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="NOME DO DOCUMENTO..." required />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-slate-400 ml-2 mb-2 block tracking-widest">ARQUIVO</label>
              <label className="flex items-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-400 cursor-pointer">
                <Plus size={20} className="shrink-0" /> 
                <span className="truncate text-xs">{file ? file.name : "ANEXAR"}</span>
                <input type="file" ref={inputRef} onChange={e => setFile(e.target.files[0])} className="hidden" required />
              </label>
            </div>
            <button disabled={isSubmitting} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black tracking-widest hover:bg-indigo-700 transition-all flex gap-2 shrink-0">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Upload size={18} /> INSERIR</>}
            </button>
          </form>
        </div>

        {/* GRID DE CARDS CORRIGIDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {arquivos.map(arq => {
            const publicUrl = supabase.storage.from("arquivos-onix").getPublicUrl(arq.caminho_arquivo).data.publicUrl;
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(arq.caminho_arquivo);
            const fileConfig = getFileConfig(arq.caminho_arquivo);

            return (
              <div key={arq.id} className="relative group bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 hover:shadow-xl transition-all flex items-center min-h-[120px]">
                
                {/* LADO ESQUERDO: MINIATURA E TEXTO EMBAIXO */}
                <div className="flex flex-col items-center w-36 shrink-0">
                   <div className={`w-32 h-20 overflow-hidden rounded-[1.5rem] flex items-center justify-center border border-slate-50 shadow-inner ${!isImage ? fileConfig.bg : 'bg-slate-50'}`}>
                      {isImage ? (
                        <img src={publicUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className={`flex flex-col items-center ${fileConfig.color}`}>
                           {fileConfig.icon}
                           <span className="text-[6px] font-black mt-1 opacity-50 tracking-widest">{fileConfig.label}</span>
                        </div>
                      )}
                   </div>
                   {/* NOME ABAIXO DO SIMBOLO */}
                   <span className="text-[9px] font-black text-slate-800 text-center uppercase mt-2 line-clamp-1 w-32 px-1">
                     {arq.descricao}
                   </span>
                </div>

                {/* LADO DIREITO: DATA E BOTÕES */}
                <div className="flex flex-col justify-between h-20 flex-1 ml-4 pr-1">
                   <div className="text-[8px] text-slate-400 font-black tracking-widest uppercase">
                     {new Date(arq.data_upload).toLocaleDateString()}
                   </div>
                   
                   {/* BOTÕES ORGANIZADOS LADO A LADO */}
                   <div className="flex items-center gap-2 mt-auto self-end">
                      <a 
                        href={publicUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-3 bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"
                      >
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(arq)} 
                        className="p-3 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {arquivos.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-black text-[10px] tracking-[0.4em]">
            SEM REGISTROS
          </div>
        )}
      </div>
    </div>
  );
}