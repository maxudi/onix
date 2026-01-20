import { useState } from 'react';
import { Truck, Plus, Search, Phone, ExternalLink, CheckCircle, Clock } from 'lucide-react';

export default function Servicos() {
  const [fornecedores, setFornecedores] = useState([
    { id: 1, nome: 'Limpa Tudo Dedetização', servico: 'Dedetização', contato: '(34) 9999-0000', ultimaVisita: '2025-12-10', garantia: '2026-06-10', status: 'ativo' },
    { id: 2, nome: 'Verde Vida Paisagismo', servico: 'Jardinagem', contato: '(34) 8888-1111', ultimaVisita: '2026-01-15', garantia: 'Mensal', status: 'pendente' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Operacional & Serviços</h1>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Fornecedor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fornecedores.map(f => (
          <div key={f.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="bg-blue-50 p-3 rounded-lg"><Truck className="text-blue-600" /></div>
                <div>
                  <h3 className="font-bold text-lg">{f.nome}</h3>
                  <p className="text-sm text-blue-600 font-medium">{f.servico}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${f.status === 'ativo' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{f.status}</span>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm border-t pt-4">
              <div>
                <p className="text-gray-500 text-xs">Última Visita</p>
                <p className="font-medium">{f.ultimaVisita}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Garantia até</p>
                <p className="font-medium">{f.garantia}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a href={`tel:${f.contato}`} className="flex-1 btn-secondary text-center py-2 flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> Ligar</a>
              <button className="flex-1 btn-primary py-2 text-sm">Pagar via Inter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}