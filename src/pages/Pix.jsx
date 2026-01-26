import React, { useState } from 'react';
import { 
  QrCode, 
  Send, 
  History, 
  Copy, 
  Eye, 
  FileText, 
  XCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import PixFormReceber from '../components/PixFormReceber';
import PixFormEnviar from '../components/PixFormEnviar';
import PixTable from '../components/PixTable';

export default function Pix() {
  const [tab, setTab] = useState('receber');
  const [transacoes, setTransacoes] = useState([]);
  const [nextId, setNextId] = useState(1);

  // Handlers (Mantendo sua lógica funcional de mock)
  const handleReceber = (data) => {
    const tx = {
      id: nextId,
      tipo: 'RECEBIMENTO',
      valor: data.valor,
      status: 'PENDENTE',
      descricao: data.descricao,
      cliente_id: data.cliente || null,
      data_vencimento: data.dataVencimento || null,
      pix_copia_cola: '00020126360014BR.GOV.BCB.PIX0114+55119999999952040000530398654041.005802BR5920CLIENTE EXEMPLO6009SAO PAULO62070503***',
      qr_code_base64: '',
      criado_em: new Date().toISOString(),
    };
    setTransacoes([tx, ...transacoes]);
    setNextId(nextId + 1);
  };

  const handleEnviar = (data) => {
    const tx = {
      id: nextId,
      tipo: 'ENVIO',
      valor: data.valor,
      status: 'AGENDADO',
      descricao: data.descricao,
      favorecido_nome: data.favorecidoNome,
      favorecido_documento: data.favorecidoDocumento,
      chave_pix: data.chavePix,
      tipo_chave_pix: data.tipoChave,
      criado_em: new Date().toISOString(),
    };
    setTransacoes([tx, ...transacoes]);
    setNextId(nextId + 1);
  };

  const handleCancelar = (tx) => {
    if (tx.status === 'CONFIRMADO' || tx.status === 'PAGO') return alert('Operação não permitida');
    setTransacoes(transacoes.map(t => t.id === tx.id ? { ...t, status: 'CANCELADO' } : t));
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900 uppercase">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-indigo-950 tracking-tighter">Gestão de Pix</h1>
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Movimentações em tempo real</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
               <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><ArrowDownLeft size={20}/></div>
               <div>
                 <p className="text-[8px] font-black text-slate-400">Total Recebido</p>
                 <p className="text-sm font-black text-slate-800">R$ 0,00</p>
               </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS (PADRÃO ADMIN) */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => setTab('receber')} 
              className={`flex-1 py-6 text-xs font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${tab === 'receber' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/30' : 'text-slate-400'}`}
            >
              <QrCode size={18} /> GERAR COBRANÇA
            </button>
            <button 
              onClick={() => setTab('enviar')} 
              className={`flex-1 py-6 text-xs font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${tab === 'enviar' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/30' : 'text-slate-400'}`}
            >
              <Send size={18} /> TRANSFERIR PIX
            </button>
          </div>

          <div className="p-10">
            {/* FORMULÁRIOS ESTILIZADOS */}
            <div className="max-w-2xl mx-auto bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
              {tab === 'receber' ? (
                <PixFormReceber onSubmit={handleReceber} />
              ) : (
                <PixFormEnviar onSubmit={handleEnviar} />
              )}
            </div>
          </div>
        </div>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h2 className="font-black text-indigo-950 tracking-tighter flex items-center gap-2">
              <History size={20} className="text-indigo-600"/> ÚLTIMAS TRANSAÇÕES
            </h2>
            <span className="text-[10px] font-black bg-white px-4 py-2 rounded-full border border-slate-100 text-slate-400">
              {transacoes.length} OPERAÇÕES
            </span>
          </div>
          
          <div className="p-8">
             <PixTable
               transacoes={transacoes}
               onVisualizar={(tx) => alert(JSON.stringify(tx))}
               onCopiar={(tx) => {
                 navigator.clipboard.writeText(tx.pix_copia_cola);
                 alert('Copiado!');
               }}
               onComprovante={(tx) => alert('Gerando comprovante...')}
               onCancelar={handleCancelar}
             />
          </div>
        </div>

      </div>
    </div>
  );
}