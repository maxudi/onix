import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Financeiro() {
  const { user, isAdmin, loading } = useAuth();
  
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // --- BUSCA DIRETA NO BANCO (SEM REALTIME/WEBSOCKET) ---
  useEffect(() => {
    if (!isSupabaseEnabled() || !user) return;

    const fetchBills = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .order('due_date', { ascending: true });
        
        if (!error && data) {
          setBills(data);
          // storage removed: bills state only from Supabase
        }
      } catch (err) {
        console.error("Erro ao buscar boletos no Supabase:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchBills();
    // Realtime removido para evitar erros de WSS e crash de split no Easypanel
  }, [user]);

  // --- PROTEÇÃO DE CARREGAMENTO ---
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 font-medium">Sincronizando dados financeiros...</p>
      </div>
    );
  }

  // Filtragem segura (suporta CamelCase do storage e Snake_Case do banco)
  const userBills = isAdmin ? bills : bills.filter(b => (b.userId === user.id || b.user_id === user.id));
  
  const filteredBills = userBills.filter(bill => {
    const description = bill.description || '';
    const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Estatísticas com conversão numérica segura
  const totalPaid = filteredBills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  
  const totalPending = filteredBills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  
  const totalOverdue = filteredBills
    .filter(b => b.status === 'overdue')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const handlePayBill = async (billId) => {
    const updatedStatus = { status: 'paid', paid_at: new Date().toISOString() };

    if (isSupabaseEnabled()) {
      await supabase.from('bills').update(updatedStatus).eq('id', billId);
    }

    const updatedBills = bills.map(bill => 
      bill.id === billId ? { ...bill, status: 'paid', paidAt: updatedStatus.paid_at } : bill
    );
    setBills(updatedBills);
    // storage removed: bills state only from Supabase
    setSelectedBill(null);
  };

  const getStatusConfig = (status) => {
    const configs = {
      paid: { icon: CheckCircle, text: 'Pago', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
      pending: { icon: Clock, text: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
      overdue: { icon: AlertCircle, text: 'Atrasado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
        <p className="mt-2 text-gray-600">Gerencie seus boletos e pagamentos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard title="Total Pago" value={totalPaid} color="green" Icon={CheckCircle} />
        <StatCard title="Pendente" value={totalPending} color="yellow" Icon={Clock} />
        <StatCard title="Atrasado" value={totalOverdue} color="red" Icon={AlertCircle} />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar boletos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" />
          </div>
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field pl-11 appearance-none cursor-pointer">
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Atrasado</option>
              <option value="paid">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Meus Boletos</h2>
          {isFetching && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>}
        </div>
        
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum boleto encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const statusConfig = getStatusConfig(bill.status);
              const StatusIcon = statusConfig.icon;
              const dueDate = bill.due_date || bill.dueDate;
              const paidAt = bill.paid_at || bill.paidAt;

              return (
                <div key={bill.id} className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${statusConfig.borderColor}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}><StatusIcon className={`w-5 h-5 ${statusConfig.color}`} /></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{bill.description}</h3>
                          <div className="mt-1 space-y-1 text-sm text-gray-500">
                            <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Vencimento: {dueDate ? format(parseISO(dueDate), 'dd/MM/yyyy') : 'N/A'}</p>
                            {paidAt && <p className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" /> Pago em: {format(parseISO(paidAt), 'dd/MM/yyyy')}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ {Number(bill.amount || 0).toFixed(2)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>{statusConfig.text}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedBill(bill)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"><Eye className="w-5 h-5" /></button>
                        {bill.status !== 'paid' && <button onClick={() => handlePayBill(bill.id)} className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg">Pagar</button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold">Detalhes do Boleto</h3>
              <button onClick={() => setSelectedBill(null)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-3xl font-bold">R$ {Number(selectedBill.amount || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <DetailRow label="Vencimento" value={selectedBill.due_date || selectedBill.dueDate ? format(parseISO(selectedBill.due_date || selectedBill.dueDate), 'dd/MM/yyyy') : 'N/A'} />
                <DetailRow label="Status" value={getStatusConfig(selectedBill.status).text} color={getStatusConfig(selectedBill.status).color} />
              </div>
              <button onClick={() => setSelectedBill(null)} className="w-full btn-secondary mt-4">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, Icon }) {
  const colorMap = {
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };
  return (
    <div className={`card border ${colorMap[color]} flex justify-between items-center`}>
      <div><p className="text-xs font-medium opacity-80">{title}</p><p className="text-2xl font-bold">R$ {Number(value).toFixed(2)}</p></div>
      <Icon className="w-8 h-8 opacity-20" />
    </div>
  );
}

function DetailRow({ label, value, color = "text-gray-900" }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}