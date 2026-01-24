import React from 'react';
import { HardHat, CheckCircle2, AlertCircle, Clock, Plus } from 'lucide-react';

const itensManutencao = [
  { id: 1, item: 'Elevadores (Atlas)', status: 'Em dia', data: '20/01/2026', tipo: 'Mensal' },
  { id: 2, item: 'Bombas de Recalque', status: 'Atrasado', data: '10/01/2026', tipo: 'Bimestral' },
  { id: 3, item: 'Limpeza de Caixas d’Água', status: 'Agendado', data: '15/02/2026', tipo: 'Semestral' },
  { id: 4, item: 'Extintores e AVCB', status: 'Em dia', data: '05/12/2025', tipo: 'Anual' },
];

export default function Manutencao() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Plano de Manutenção</h1>
          <p className="text-gray-500 text-sm">Controle preventivo das áreas técnicas.</p>
        </div>
        <button className="bg-gray-900 text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all font-bold">
          <Plus size={20} />
          <span className="hidden md:inline">Nova Ordem</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {itensManutencao.map((m) => (
          <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${
                m.status === 'Em dia' ? 'bg-green-50 text-green-600' : 
                m.status === 'Atrasado' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {m.status === 'Em dia' ? <CheckCircle2 size={20} /> : 
                 m.status === 'Atrasado' ? <AlertCircle size={20} /> : <Clock size={20} />}
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded">
                {m.tipo}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{m.item}</h3>
            <p className="text-xs text-gray-500 mb-4 text-pretty">Última/Próxima: {m.data}</p>
            <div className={`text-xs font-bold ${
              m.status === 'Em dia' ? 'text-green-600' : 
              m.status === 'Atrasado' ? 'text-red-600' : 'text-blue-600'
            }`}>
              ● {m.status}
            </div>
          </div>
        ))}
      </div>

      {/* Seção de Contatos de Emergência */}
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
        <h2 className="flex items-center gap-2 font-black text-amber-800 mb-4 uppercase text-sm tracking-widest">
          <HardHat size={18} />
          Plantão Técnico
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm font-bold text-amber-900">Manutenção Elevadores</span>
            <span className="text-sm font-mono text-amber-700">0800 700 1234</span>
          </div>
          <div className="bg-white/50 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm font-bold text-amber-900">Emergência Elétrica</span>
            <span className="text-sm font-mono text-amber-700">(11) 99999-8888</span>
          </div>
        </div>
      </div>
    </div>
  );
}