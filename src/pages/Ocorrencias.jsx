import React from 'react';
import { MessageSquare, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function Ocorrencias() {
  // Dados fictícios para visualização inicial
  const ocorrencias = [
    { id: 1, titulo: 'Lâmpada queimada no hall', status: 'Pendente', data: '22/01/2026', categoria: 'Manutenção' },
    { id: 2, titulo: 'Barulho excessivo apto 42', status: 'Em análise', data: '21/01/2026', categoria: 'Convivência' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Livro de Ocorrências</h1>
          <p className="text-gray-500 text-sm">Registre e acompanhe solicitações do condomínio</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition-all shadow-sm">
          <Plus size={20} />
          Nova Ocorrência
        </button>
      </div>

      <div className="grid gap-4">
        {ocorrencias.length > 0 ? (
          ocorrencias.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-primary-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.titulo}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {item.data}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded uppercase font-black">{item.categoria}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  item.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-12 text-center">
            <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma ocorrência registrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}