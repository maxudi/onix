import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
import { 
  DollarSign, 
  Download, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar as CalendarIcon,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Financeiro() {
  const { user, isAdmin } = useAuth();
  const [bills, setBills] = useState(storage.getBills());

  // Realtime Supabase para boletos
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    // Busca inicial
    const fetchBills = async () => {
      const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
      if (!error && data) setBills(data);
    };
    fetchBills();

    // Canal realtime
    const channel = supabase
      .channel('public:bills')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, payload => {
        if (payload) fetchBills();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);

  // Filtrar boletos
  const userBills = isAdmin ? bills : bills.filter(b => user && b.userId === user.id);
  
  const filteredBills = userBills.filter(bill => {
    const matchesSearch = bill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || bill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Estatísticas
  const totalPaid = filteredBills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const totalPending = filteredBills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const totalOverdue = filteredBills
    .filter(b => b.status === 'overdue')
    .reduce((sum, b) => sum + b.amount, 0);

  const handlePayBill = (billId) => {
    const updatedBills = bills.map(bill => 
      bill.id === billId 
        ? { ...bill, status: 'paid', paidAt: new Date().toISOString() }
        : bill
    );
    setBills(updatedBills);
    storage.setBills(updatedBills);
    setSelectedBill(null);
  };

  const getStatusConfig = (status) => {
    const configs = {
      paid: {
        icon: CheckCircle,
        text: 'Pago',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      pending: {
        icon: Clock,
        text: 'Pendente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      overdue: {
        icon: AlertCircle,
        text: 'Atrasado',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
        <p className="mt-2 text-gray-600">Gerencie seus boletos e pagamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Pago</p>
              <p className="mt-2 text-2xl font-bold text-green-900">
                R$ {totalPaid.toFixed(2)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pendente</p>
              <p className="mt-2 text-2xl font-bold text-yellow-900">
                R$ {totalPending.toFixed(2)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Atrasado</p>
              <p className="mt-2 text-2xl font-bold text-red-900">
                R$ {totalOverdue.toFixed(2)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar boletos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field pl-11 appearance-none cursor-pointer"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Boletos</h2>
        
        {filteredBills.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum boleto encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const statusConfig = getStatusConfig(bill.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={bill.id}
                  className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${statusConfig.borderColor}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{bill.description}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              Vencimento: {format(parseISO(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            {bill.paidAt && (
                              <p className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Pago em: {format(parseISO(bill.paidAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          R$ {bill.amount.toFixed(2)}
                        </p>
                        <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium border rounded-full ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}>
                          {statusConfig.text}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detalhes do Boleto</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedBill.description}</p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Valor</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {selectedBill.amount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Vencimento</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(parseISO(selectedBill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Competência</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedBill.competence}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${getStatusConfig(selectedBill.status).color}`}>
                    {getStatusConfig(selectedBill.status).text}
                  </span>
                </div>
                {selectedBill.paidAt && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Data do Pagamento</span>
                    <span className="text-sm font-medium text-green-600">
                      {format(parseISO(selectedBill.paidAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              {selectedBill.barcode && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Código de Barras</p>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {selectedBill.barcode}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="flex-1 btn-secondary"
                >
                  Fechar
                </button>
                {selectedBill.status !== 'paid' && (
                  <button
                    onClick={() => handlePayBill(selectedBill.id)}
                    className="flex-1 btn-primary"
                  >
                    Pagar Agora
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
