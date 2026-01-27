import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, CheckCircle, Clock, AlertCircle, 
  QrCode, Barcode, FileText, X,
  TrendingUp, TrendingDown, Loader2, Check, RefreshCw, Trash2, MinusCircle
} from 'lucide-react';

export default function Financeiro() {
  const { user, isAdmin } = useAuth();
  
  const userName = user?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "Usuário";
  const userCPF = user?.cpf || user?.user_metadata?.cpf;

  const today = new Date();
  const currentYear = String(today.getFullYear());

  const [bills, setBills] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState(currentYear);
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [confirmPDF, setConfirmPDF] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const years = ['2022','2023', '2024', '2025', '2026'];

  const fetchFinanceData = async () => {
    setIsFetching(true);
    try {
      let query = supabase.from('cobrancas_inter').select('*');

      if (!isAdmin) {
        if (userCPF) {
          const cleanCPF = String(userCPF).replace(/\D/g, '');
          query = query.eq('pagador_cpf_cnpj', cleanCPF);
        } else {
          setBills([]);
          setIsFetching(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setErrorMessage("Erro ao carregar dados financeiros.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSyncStatus = async () => {
    if (isUpdating || !isAdmin) return;
    setIsUpdating(true);
    try {
      const response = await fetch('https://n8n.netminas.com/webhook/atualiza_boleto_status', {
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

  const handleGeneratePDF = async (item) => {
    setConfirmPDF(null);
    setIsFetching(true);
    try {
      const response = await fetch('https://n8n.netminas.com/webhook/recupera_boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_solicitacao: item.codigo_solicitacao })
      });
      
      const resData = await response.json();
      // Verificação robusta do retorno do PDF
      let rawBase64 = null;
      if (Array.isArray(resData) && resData[0]?.pdf) rawBase64 = resData[0].pdf;
      else if (resData.pdf) rawBase64 = resData.pdf;
      else if (resData.base64) rawBase64 = resData.base64;

      if (rawBase64) {
        const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `boleto_${item.codigo_solicitacao}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("PDF não encontrado na resposta");
      }
    } catch (err) { 
      console.error(err);
      setErrorMessage("Erro ao gerar PDF."); 
    } finally { 
      setIsFetching(false); 
    }
  };

  const handleCopy = (text, field) => {
    if (!text) {
        alert("Informação não disponível para este boleto.");
        return;
    }
    navigator.clipboard.writeText(text);
    setStatusMessage(field);
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const filteredData = useMemo(() => {
    return bills.filter(item => {
      if (item.situacao?.toUpperCase() === 'CANCELADO') return false;
      const [ano] = (item.data_vencimento || "").split('-');
      const matchesYear = filterYear === 'all' || ano === filterYear;
      const matchesSearch = item.pagador_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.situacao === filterStatus;
      return matchesYear && matchesSearch && matchesStatus;
    });
  }, [bills, filterYear, searchTerm, filterStatus]);

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

  useEffect(() => { 
    if (isSupabaseEnabled() && user) fetchFinanceData(); 
  }, [user, isAdmin]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50/50 min-h-screen pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic leading-none">Financeiro</h1>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter">
              {isAdmin ? "PAINEL ADMINISTRATIVO" : "ÁREA DO MORADOR"}
            </p>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-gray-500 uppercase">👤 {userName}</span>
               {userCPF && <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-bold">{userCPF}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button onClick={handleSyncStatus} className={`p-2 rounded-full hover:bg-white shadow-sm transition-all ${isUpdating ? 'text-cyan-500' : 'text-gray-300'}`}>
              <RefreshCw size={20} className={isUpdating ? 'animate-spin' : ''} />
            </button>
          )}
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-2 rounded-lg border bg-white font-bold text-xs shadow-sm outline-none">
            <option value="all">TODOS OS ANOS</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Recebido" value={stats.pago} icon={<TrendingUp size={16}/>} color="text-green-600" />
        <StatCard title="A Vencer" value={stats.pendente} icon={<Clock size={16}/>} color="text-blue-600" />
        <StatCard title="Atrasado" value={stats.atrasado} icon={<TrendingDown size={16}/>} color="text-red-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input 
            type="text"
            placeholder="BUSCAR POR NOME..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-primary-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase">
          <option value="all">TODOS STATUS</option>
          <option value="A_RECEBER">PENDENTE</option>
          <option value="RECEBIDO">PAGO</option>
          <option value="VENCIDO">VENCIDO</option>
        </select>
      </div>

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
                <th className="p-4 w-16 text-center">Status</th>
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
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setSelectedBill(item)} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100" title="Pagar"><QrCode size={14} /></button>
                          <button onClick={() => setConfirmPDF(item)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Baixar PDF"><FileText size={14} /></button>
                          {isAdmin && (
                            <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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

      {selectedBill && (
        <Modal onClose={() => setSelectedBill(null)}>
          <div className="text-center space-y-6">
            <div className="inline-block p-4 bg-gray-100 rounded-full"><Barcode size={30} /></div>
            <h3 className="text-xl font-black uppercase italic">Pagamento</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase -mt-4">{selectedBill.pagador_nome}</p>
            <div className="space-y-2">
              <CopyButton 
                label="PIX Copia e Cola" 
                onClick={() => handleCopy(selectedBill.pix_copia_e_cola, 'pix')} 
                copied={statusMessage === 'pix'} 
                color="bg-cyan-600" 
              />
              <CopyButton 
                label="Linha Digitável" 
                onClick={() => handleCopy(selectedBill.boleto_linha_digitavel, 'linha')} 
                copied={statusMessage === 'linha'} 
                color="bg-gray-800" 
              />
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
              <button onClick={() => handleGeneratePDF(confirmPDF)} className="flex-1 py-3 text-[10px] font-black uppercase bg-red-600 text-white rounded-xl shadow-lg">Download</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-red-50 rounded-full text-gray-400 transition-colors"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ label, onClick, copied, color }) {
  return (
    <button onClick={onClick} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : `${color} text-white`}`}>
      {copied ? <Check size={14} /> : label}
      {copied ? 'Copiado!' : ''}
    </button>
  );
}