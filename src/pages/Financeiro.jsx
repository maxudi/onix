import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, CheckCircle, Clock, AlertCircle, 
  QrCode, Barcode, FileText, X,
  TrendingUp, TrendingDown, Loader2, Check, AlertTriangle, RefreshCw, Trash2, MinusCircle
} from 'lucide-react';

export default function Financeiro() {
  const { user, isAdmin } = useAuth(); // Puxa os dados do usuário logado
  
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentYear = String(today.getFullYear());

  const [bills, setBills] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [confirmPDF, setConfirmPDF] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null); 
  const [justificativa, setJustificativa] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const years = ['2023', '2024', '2025', '2026'];
  const months = [
    { v: '01', l: 'JANEIRO' }, { v: '02', l: 'FEVEREIRO' }, { v: '03', l: 'MARÇO' },
    { v: '04', l: 'ABRIL' }, { v: '05', l: 'MAIO' }, { v: '06', l: 'JUNHO' },
    { v: '07', l: 'JULHO' }, { v: '08', l: 'AGOSTO' }, { v: '09', l: 'SETEMBRO' },
    { v: '10', l: 'OUTUBRO' }, { v: '11', l: 'NOVEMBRO' }, { v: '12', l: 'DEZEMBRO' }
  ];

  // BUSCA DE DADOS COM FILTRO DE SEGURANÇA
  const fetchFinanceData = async () => {
    setIsFetching(true);
    try {
      let query = supabase.from('cobrancas_inter').select('*');

      // REGRA DE OURO: Se não for admin, filtra pelo CPF do usuário logado
      if (!isAdmin) {
        // Assume-se que o CPF no banco está formatado igual ao do login (ou use user.name)
        query = query.eq('pagador_cpf', user?.cpf);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      setErrorMessage("Erro ao carregar dados financeiros.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSyncStatus = async () => {
    if (isUpdating || !isAdmin) return; // Só admin sincroniza
    setIsUpdating(true);
    try {
      const response = await fetch('https://geral-n8n.yzqq8i.easypanel.host/webhook/atualiza_boleto_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setStatusMessage('sync_success');
        await fetchFinanceData();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage("Falha ao sincronizar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBoleto = async () => {
    if (!confirmCancel || !justificativa.trim()) return;
    const item = confirmCancel;
    const motivo = justificativa;
    setConfirmCancel(null);
    setJustificativa('');
    setIsFetching(true);
    try {
      const response = await fetch('https://geral-n8n.yzqq8i.easypanel.host/webhook/cancela_boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_solicitacao: item.codigo_solicitacao, justificativa: motivo })
      });
      if (response.ok) {
        setStatusMessage('cancel_process');
        await fetchFinanceData();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      setErrorMessage("Erro ao cancelar.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleGeneratePDF = async (item) => {
    setConfirmPDF(null);
    setIsFetching(true);
    try {
      const response = await fetch('https://geral-n8n.yzqq8i.easypanel.host/webhook/recupera_boleto', {
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
        for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
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
        setErrorMessage("PDF não disponível no momento.");
      }
    } catch (err) { 
      setErrorMessage("Erro ao gerar PDF."); 
    } finally { 
      setIsFetching(false); 
    }
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setStatusMessage(field);
    setTimeout(() => setStatusMessage(null), 2000);
  };

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
      if (sit === 'RECEBIDO' || sit === 'PAGO') acc.pago += valor;
      else if (sit === 'A VENCER' || sit === 'A_RECEBER') acc.pendente += valor;
      else if (sit === 'VENCIDO' || sit === 'EXPIRADO') acc.atrasado += valor;
      return acc;
    }, { pago: 0, pendente: 0, atrasado: 0 });
  }, [filteredData]);

  const getStatusConfig = (situacao) => {
    const sit = situacao?.toUpperCase();
    if (sit === 'RECEBIDO' || sit === 'PAGO') return { icon: <CheckCircle size={18} />, label: 'PAGO', color: 'text-green-500', bg: 'bg-green-50' };
    if (sit === 'A VENCER' || sit === 'A_RECEBER') return { icon: <Clock size={18} />, label: 'PENDENTE', color: 'text-blue-500', bg: 'bg-blue-50' };
    if (sit === 'EXPIRADO') return { icon: <MinusCircle size={18} />, label: 'EXPIRADO', color: 'text-orange-400', bg: 'bg-orange-50' };
    return { icon: <AlertCircle size={18} />, label: 'VENCIDO', color: 'text-red-500', bg: 'bg-red-50' };
  };

  useEffect(() => { if (isSupabaseEnabled() && user) fetchFinanceData(); }, [user, isAdmin]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50/50 min-h-screen pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">Financeiro</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {isAdmin ? "Painel Administrativo" : `Boletos de: ${user?.name}`}
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button onClick={handleSyncStatus} className={`p-2 rounded-full hover:bg-white shadow-sm transition-all ${isUpdating ? 'text-cyan-500' : 'text-gray-300'}`}>
              <RefreshCw size={20} className={isUpdating ? 'animate-spin' : ''} />
            </button>
          )}
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-xs shadow-sm outline-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-xs shadow-sm outline-none cursor-pointer">
            <option value="all">ANO INTEIRO</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Recebido" value={stats.pago} icon={<TrendingUp size={16}/>} color="text-green-600" />
        <StatCard title="A Vencer" value={stats.pendente} icon={<Clock size={16}/>} color="text-blue-600" />
        <StatCard title="Atrasado" value={stats.atrasado} icon={<TrendingDown size={16}/>} color="text-red-600" />
      </div>

      {/* Barra de Busca (Apenas se Admin ou se tiver muitos boletos) */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input 
            type="text"
            placeholder="BUSCAR..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-primary-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase">
          <option value="all">STATUS</option>
          <option value="A_RECEBER">PENDENTE</option>
          <option value="RECEBIDO">PAGO</option>
          <option value="VENCIDO">VENCIDO</option>
        </select>
      </div>

      {/* Tabela de Boletos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative">
        {(isFetching || isUpdating) && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={32} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase border-b">
              <tr>
                <th className="p-4 w-16 text-center">Situação</th>
                <th className="p-4">Pagador</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center font-bold text-gray-300 uppercase text-xs">Nenhum registro encontrado</td></tr>
              ) : (
                filteredData.map((item) => {
                  const config = getStatusConfig(item.situacao);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-center">
                        <div className={`p-2 rounded-full inline-block ${config.bg} ${config.color}`}>{config.icon}</div>
                      </td>
                      <td className="p-4 uppercase text-[10px] font-black text-gray-600">{item.pagador_nome}</td>
                      <td className="p-4 text-gray-400 font-bold text-[10px]">{item.data_vencimento}</td>
                      <td className="p-4 text-right font-black text-gray-900">
                        {parseFloat(item.valor_nominal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setSelectedBill(item)} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors" title="Ver Pix/Barras"><QrCode size={14} /></button>
                          <button onClick={() => setConfirmPDF(item)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="PDF"><FileText size={14} /></button>
                          {isAdmin && (
                            <button onClick={() => {setConfirmCancel(item); setJustificativa('');}} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais de Ação */}
      {selectedBill && (
        <Modal onClose={() => setSelectedBill(null)}>
          <div className="text-center space-y-6">
            <div className="inline-block p-4 bg-gray-100 rounded-full"><Barcode size={30} /></div>
            <h3 className="text-xl font-black uppercase italic">Pagar Agora</h3>
            <div className="space-y-2">
              <CopyButton label="Copiar Código PIX" onClick={() => handleCopy(selectedBill.pix_copia_e_cola, 'pix')} copied={statusMessage === 'pix'} color="bg-cyan-600" />
              <CopyButton label="Linha Digitável" onClick={() => handleCopy(selectedBill.boleto_linha_digitavel, 'boleto')} copied={statusMessage === 'boleto'} color="bg-gray-800" />
            </div>
          </div>
        </Modal>
      )}

      {confirmPDF && (
        <Modal onClose={() => setConfirmPDF(null)}>
          <div className="text-center space-y-4">
            <FileText size={40} className="mx-auto text-red-500" />
            <h3 className="text-lg font-black uppercase">Baixar Boleto?</h3>
            <div className="flex gap-2 pt-4">
              <button onClick={() => setConfirmPDF(null)} className="flex-1 py-3 text-[10px] font-black uppercase bg-gray-100 rounded-xl">Voltar</button>
              <button onClick={() => handleGeneratePDF(confirmPDF)} className="flex-1 py-3 text-[10px] font-black uppercase bg-red-600 text-white rounded-xl shadow-lg">Baixar PDF</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmCancel && (
        <Modal onClose={() => setConfirmCancel(null)}>
          <div className="text-center space-y-4">
            <Trash2 size={40} className="mx-auto text-orange-500" />
            <h3 className="text-lg font-black uppercase">Cancelar Boleto?</h3>
            <p className="text-xs text-gray-500">Tem certeza que deseja cancelar este boleto? Esta ação não pode ser desfeita.</p>
            <input
              type="text"
              className="w-full p-2 border rounded-xl mt-2 text-xs"
              placeholder="Justificativa (obrigatória)"
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
            />
            <div className="flex gap-2 pt-4">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 py-3 text-[10px] font-black uppercase bg-gray-100 rounded-xl">Voltar</button>
              <button onClick={handleCancelBoleto} disabled={!justificativa.trim()} className="flex-1 py-3 text-[10px] font-black uppercase bg-orange-600 text-white rounded-xl shadow-lg disabled:opacity-50">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

// COMPONENTES AUXILIARES
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">{icon} {title}</p>
        <p className={`text-lg font-black ${color} mt-1`}>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ label, onClick, copied, color }) {
  return (
    <button onClick={onClick} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : `${color} text-white hover:scale-[1.02]`}`}>
      {copied ? <Check size={14} /> : label}
      {copied ? 'Copiado!' : ''}
    </button>
  );
}