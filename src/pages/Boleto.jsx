import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Download 
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Boleto() {
  const { user, loading } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterSituacao, setFilterSituacao] = useState('all');
  const [filterMes, setFilterMes] = useState(format(new Date(), 'MM'));
  const [filterAno, setFilterAno] = useState(format(new Date(), 'yyyy'));
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;
    fetchBoletos();
  }, [user, filterMes, filterAno, filterTipo, filterSituacao]);

  const fetchBoletos = async () => {
    setIsFetching(true);
    try {
      let query = supabase
        .from('boletos')
        .select('*', { count: 'exact' });

      // Filtro de Data (Mês/Ano)
      const startDate = `${filterAno}-${filterMes}-01`;
      const lastDay = endOfMonth(parseISO(startDate));
      query = query.gte('vencimento', startDate).lte('vencimento', format(lastDay, 'yyyy-MM-dd'));

      // Filtros de Categoria
      if (filterTipo !== 'all') query = query.eq('tipo', filterTipo);
      if (filterSituacao !== 'all') query = query.eq('situacao', filterSituacao);

      const { data, error } = await query.order('vencimento', { ascending: true });

      if (!error && data) {
        setBoletos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar boletos:", err);
    } finally {
      setIsFetching(false);
    }
  };

  // Lógica de Busca em memória (para nome do beneficiário/pagador)
  const filteredData = boletos.filter(b => 
    b.beneficiario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.pagador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos de Totais
  const totalValor = filteredData.reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  // Paginação Manual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading || !user) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Boletos</h1>
          <p className="text-gray-500">Listagem detalhada e conciliação financeira</p>
        </div>
        <div className="card bg-primary-600 text-white py-3 px-6 shadow-lg border-none text-right">
          <p className="text-xs uppercase opacity-80 font-bold">Total do Filtro</p>
          <p className="text-2xl font-black">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Busca (Nome/Descrição)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Digite para buscar..." 
              className="input-field pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Mês</label>
          <select className="input-field" value={filterMes} onChange={(e) => setFilterMes(e.target.value)}>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Ano</label>
          <select className="input-field" value={filterAno} onChange={(e) => setFilterAno(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tipo</label>
          <select className="input-field" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="all">Todos</option>
            <option value="credito">Crédito (+)</option>
            <option value="debito">Débito (-)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Situação</label>
          <select className="input-field" value={filterSituacao} onChange={(e) => setFilterSituacao(e.target.value)}>
            <option value="all">Todas</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="card p-0 overflow-hidden border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Beneficiário / Descrição</th>
                <th className="px-6 py-4">Pagador</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan="6" className="p-10 text-center">Buscando dados...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-gray-400">Nenhum registro encontrado para este filtro.</td></tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{item.beneficiario}</p>
                      <p className="text-xs text-gray-500">{item.descricao}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.pagador}</td>
                    <td className="px-6 py-4">{format(parseISO(item.vencimento), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">
                      {item.tipo === 'credito' ? 
                        <span className="flex items-center gap-1 text-green-600 font-bold"><ArrowUpCircle className="w-4 h-4" /> Crédito</span> : 
                        <span className="flex items-center gap-1 text-red-600 font-bold"><ArrowDownCircle className="w-4 h-4" /> Débito</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        item.situacao === 'pago' ? 'bg-green-50 text-green-600 border-green-200' :
                        item.situacao === 'atrasado' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                      }`}>
                        {item.situacao}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Paginação */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-xs text-gray-500 font-medium">
            Mostrando <span className="font-bold">{currentItems.length}</span> de <span className="font-bold">{filteredData.length}</span> registros
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center px-4 text-xs font-bold text-gray-600">Página {currentPage} de {totalPages || 1}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}