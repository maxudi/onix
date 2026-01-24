import React from 'react';
import { FilePieChart, Download, Calendar, Search } from 'lucide-react';

const relatorios = [
  { id: 1, mes: 'Dezembro', ano: '2025', status: 'Fechado', arquivo: 'balancete_12_2025.pdf' },
  { id: 2, mes: 'Novembro', ano: '2025', status: 'Fechado', arquivo: 'balancete_11_2025.pdf' },
  { id: 3, mes: 'Outubro', ano: '2025', status: 'Fechado', arquivo: 'balancete_10_2025.pdf' },
];

export default function Balancetes() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Balancetes Mensais</h1>
          <p className="text-gray-500 text-sm">Transparência total sobre as contas do condomínio.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ano ou mês..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {relatorios.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-primary-200 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                <FilePieChart size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{item.mes} / {item.ano}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>Publicado em: 05/{item.mes === 'Dezembro' ? '01/2026' : '11/2025'}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors">
              <Download size={18} />
              PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}