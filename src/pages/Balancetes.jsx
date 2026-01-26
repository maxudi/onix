import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FilePieChart, Download, Search, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BalancetePDF from '../components/BalancetePDF';

export default function Balancetes() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Estados da Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const registrosPorPagina = 6;

  useEffect(() => {
    fetchHistorico();
  }, []);

  // Reseta para a página 1 sempre que o usuário pesquisar algo
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  async function fetchHistorico() {
    try {
      const { data, error } = await supabase
        .from('historico_balancetes')
        .select('*')
        .order('ano_referencia', { ascending: false })
        .order('mes_referencia', { ascending: false });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }

  // 1. Lógica de Filtragem
  const filtrados = relatorios.filter(r => 
    r.mes_referencia.includes(busca) || r.ano_referencia.toString().includes(busca)
  );

  // 2. Lógica de Paginação
  const indiceUltimoItem = paginaAtual * registrosPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - registrosPorPagina;
  const registrosPaginados = filtrados.slice(indicePrimeiroItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(filtrados.length / registrosPorPagina);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase">Histórico de Balancetes</h1>
          <p className="text-gray-500 text-sm font-medium">Arquivos oficiais salvos no banco de dados.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64" 
            placeholder="Buscar mês ou ano..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtrados.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        ) : (
          <>
            {registrosPaginados.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-primary-300 transition-all shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:scale-110 transition-transform">
                    <FilePieChart size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 uppercase tracking-tight">Mês {item.mes_referencia} / {item.ano_referencia}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mt-1">
                      <Calendar size={12} />
                      <span>Gerado em: {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {item.dados_fechamento ? (
                  <PDFDownloadLink
                    document={
                      <BalancetePDF 
                        mes={item.mes_referencia} 
                        ano={item.ano_referencia} 
                        saldoAnterior={item.dados_fechamento.saldoAnterior} 
                        saldoCorrente={item.dados_fechamento.saldoAtual} 
                        saldoInvestimento={item.dados_fechamento.saldoInvestimento}
                        lancamentos={item.dados_fechamento.lancamentos} 
                      />
                    }
                    fileName={`balancete_${item.ano_referencia}_${item.mes_referencia}.pdf`}
                  >
                    {({ loading }) => (
                      <button 
                        disabled={loading}
                        className="flex items-center gap-2 text-xs font-black uppercase text-primary-600 bg-primary-50 hover:bg-primary-600 hover:text-white px-5 py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        <Download size={16} />
                        {loading ? 'Processando...' : 'Baixar PDF'}
                      </button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <span className="text-red-500 text-[10px] font-bold">DADOS AUSENTES</span>
                )}
              </div>
            ))}

            {/* Controles de Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Página</span>
                  <span className="text-sm font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-md">
                    {paginaAtual}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">de {totalPaginas}</span>
                </div>

                <button
                  onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}