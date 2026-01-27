import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, CheckCircle, Clock, AlertCircle, 
  QrCode, Barcode, FileText, X, FilterX,
  TrendingUp, TrendingDown, Loader2, Check, AlertTriangle
} from 'lucide-react';

export default function Financeiro() {
  const { user, loading } = useAuth();
  
  // Data Atual para Filtro Inicial
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentYear = String(today.getFullYear());

  const [bills, setBills] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState(currentMonth); // Inicia no mês atual
  const [filterYear, setFilterYear] = useState(currentYear);   // Inicia no ano atual
  
  // Modais
  const [selectedBill, setSelectedBill] = useState(null);
  const [confirmPDF, setConfirmPDF] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const years = ['2023', '2024', '2025', '2026'];
  const months = [
    { v: '01', l: 'JANEIRO' }, { v: '02', l: 'FEVEREIRO' }, { v: '03', l: 'MARÇO' },
    { v: '04', l: 'ABRIL' }, { v: '05', l: 'MAIO' }, { v: '06', l: 'JUNHO' },
    { v: '07', l: 'JULHO' }, { v: '08', l: 'AGOSTO' }, { v: '09', l: 'SETEMBRO' },
    { v: '10', l: 'OUTUBRO' }, { v: '11', l: 'NOVEMBRO' }, { v: '12', l: 'DEZEMBRO' }
  ];

  const fetchFinanceData = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.from('cobrancas_inter').select('*');
      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      setErrorMessage("Erro ao carregar dados do banco de dados.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isSupabaseEnabled() && user) fetchFinanceData();
  }, [user]);

  const handleGeneratePDF = async (item) => {
    setConfirmPDF(null);
    setIsFetching(true);
    try {
      const response = await fetch('https://n8n.netminas.com/webhook/gere_boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_solicitacao: item.codigo_solicitacao })
      });

      const data = await response.json();
      let rawBase64 = data.pdf || data.base64 || (Array.isArray(data) ? data[0].pdf : null);

      if (rawBase64) {
        const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');
        const byteCharacters = window.atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `boleto_${item.codigo_solicitacao}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setErrorMessage("O servidor não retornou um documento válido.");
      }
    } catch (err) {
      setErrorMessage("Falha na comunicação com o servidor de boletos.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtros Otimizados
  const filteredData = useMemo(() => {
    return bills.filter(item => {
      if (item.situacao?.toUpperCase() === 'CANCELADO') return false;
      const [ano, mes] = (item.data_vencimento || "").split('-');
      const matchesYear = filterYear === 'all' || ano === filterYear;
      const matchesMonth = filterMonth === 'all' || mes === filterMonth;
      const matchesSearch = item.pagador_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.situacao === filterStatus;
      return matchesYear && matchesMonth && matchesSearch && matchesStatus;
    });
  }, [bills, filterYear, filterMonth, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      const valor = parseFloat(curr.valor_nominal) || 0;
      const sit = curr.situacao?.toUpperCase();
      if (sit === 'RECEBIDO') acc.pago += valor;
      else if (sit === 'A VENCER') acc.pendente += valor;
      else acc.atrasado += valor;
      return acc;
    }, { pago: 0, pendente: 0, atrasado: 0 });
  }, [filteredData]);

  const getStatusStyle = (situacao) => {
    const sit = situacao?.toUpperCase();
    if (sit === 'RECEBIDO') return { icon: CheckCircle, label: 'PAGO', color: 'text-green-600', bg: 'bg-green-50' };
    if (sit === 'A VENCER') return { icon: Clock, label: 'PENDENTE', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { icon: AlertCircle, label: 'VENCIDO', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans bg-slate-50 min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic">Financeiro</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">Gestão de Cobranças {currentYear}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <FilterX size={14} className="ml-2 text-slate-400" />
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-2 bg-transparent font-black text-[10px] outline-none uppercase cursor-pointer">
            <option value="all">TODOS MESES</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-2 bg-transparent font-black text-[10px] outline-none cursor-pointer">
            <option value="all">TODOS ANOS</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Recebido" value={stats.pago} icon={TrendingUp} color="green" />
        <StatCard title="A Vencer" value={stats.pendente} icon={Clock} color="yellow" />
        <StatCard title="Atrasado" value={stats.atrasado} icon={TrendingDown} color="red" />
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
          <input 
            type="text"
            placeholder="PESQUISAR CLIENTE..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold uppercase focus:ring-2 focus:ring-slate-200 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="md:w-64 p-4 bg-slate-900 text-white border-none rounded-2xl text-[10px] font-black uppercase cursor-pointer">
          <option value="all">TODOS OS STATUS</option>
          <option value="A VENCER">PENDENTE</option>
          <option value="RECEBIDO">PAGO</option>
          <option value="VENCIDO">VENCIDO</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm relative min-h-[400px]">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2.5rem]">
            <Loader2 className="animate-spin text-slate-900" size={40} />
          </div>
        )}

        <div className="space-y-4">
          {filteredData.length > 0 ? filteredData.map((item) => {
            const style = getStatusStyle(item.situacao);
            return (
              <div key={item.id} className="p-5 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row justify-between items-center hover:border-slate-300 transition-all bg-white group">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`p-4 rounded-2xl ${style.bg}`}><style.icon className={`w-6 h-6 ${style.color}`} /></div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">{item.pagador_nome}</h3>
                    <p className="text-[10px] font-bold text-slate-400">VENCIMENTO: {item.data_vencimento}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:gap-10 mt-5 md:mt-0 pt-5 md:pt-0 border-t md:border-none">
                  <div className="text-left md:text-right">
                    <p className="text-xl font-black text-slate-900">R$ {parseFloat(item.valor_nominal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${style.bg} ${style.color}`}>{style.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedBill(item)} className="p-4 bg-cyan-50 text-cyan-600 rounded-2xl hover:scale-105 transition-all" title="Ver Códigos"><QrCode size={20} /></button>
                    <button onClick={() => setConfirmPDF(item)} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:scale-105 transition-all" title="Baixar PDF"><FileText size={20} /></button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">Nenhum registro para este período</div>
          )}
        </div>
      </div>

      {/* MODAL: PAGAMENTO (PIX/BOLETO) */}
      {selectedBill && (
        <Modal onClose={() => setSelectedBill(null)}>
            <div className="text-center space-y-6 pt-4">
              <div className="inline-block p-4 bg-slate-50 rounded-full mb-2"><Barcode size={32} className="text-slate-900" /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Pagamento</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">{selectedBill.pagador_nome}</p>
              
              <div className="space-y-3 pt-4 px-2">
                <CopyButton label="Copiar PIX" onClick={() => handleCopy(selectedBill.pix_copia_e_cola, 'pix')} copied={copiedField === 'pix'} color="bg-cyan-600" />
                <CopyButton label="Copiar Código Barras" onClick={() => handleCopy(selectedBill.boleto_codigo_barras, 'boleto')} copied={copiedField === 'boleto'} color="bg-indigo-600" />
              </div>
            </div>
        </Modal>
      )}

      {/* MODAL: CONFIRMAÇÃO DE PDF */}
      {confirmPDF && (
        <Modal onClose={() => setConfirmPDF(null)}>
            <div className="text-center space-y-6 pt-4">
              <div className="inline-block p-4 bg-red-50 rounded-full mb-2"><FileText size={32} className="text-red-600" /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Gerar PDF?</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed px-8">
                Deseja solicitar ao servidor a geração do arquivo PDF para esta cobrança?
              </p>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setConfirmPDF(null)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
                <button onClick={() => handleGeneratePDF(confirmPDF)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all">Gerar Agora</button>
              </div>
            </div>
        </Modal>
      )}

      {/* MODAL: ERRO (Substitui o Alert) */}
      {errorMessage && (
        <Modal onClose={() => setErrorMessage(null)}>
            <div className="text-center space-y-6 pt-4">
              <div className="inline-block p-4 bg-amber-50 rounded-full mb-2"><AlertTriangle size={32} className="text-amber-600" /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Ops!</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 leading-relaxed">{errorMessage}</p>
              <button onClick={() => setErrorMessage(null)} className="w-full py-4 rounded-2xl font-black text-[10px] uppercase bg-slate-900 text-white hover:bg-slate-800 transition-all">Entendido</button>
            </div>
        </Modal>
      )}

    </div>
  );
}

// --- SUBCOMPONENTES AUXILIARES ---

function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-red-50 transition-colors"><X size={20} /></button>
            {children}
          </div>
        </div>
    );
}

function CopyButton({ label, onClick, copied, color }) {
    return (
        <button 
          onClick={onClick} 
          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : `${color} text-white hover:opacity-90`}`}
        >
          {copied ? <Check size={14} /> : null}
          {copied ? 'Copiado!' : label}
        </button>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
  const themes = { 
    green: "text-green-600 bg-green-50 border-green-100", 
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-100", 
    red: "text-red-600 bg-red-50 border-red-100" 
  };
  return (
    <div className={`p-8 rounded-[2.5rem] ${themes[color]} border-2 transition-all hover:translate-y-[-4px] shadow-sm`}>
      <div className="flex justify-between mb-4">
        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{title}</p>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-black tracking-tighter text-slate-900">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
  );
}