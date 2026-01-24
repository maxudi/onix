import React from 'react';
import { Droplets, Flame, Camera } from 'lucide-react';

export default function Consumo() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Leituras de Consumo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <Droplets className="text-blue-600 mb-4" size={32} />
          <h3 className="font-bold text-blue-900">Medição de Água</h3>
          <p className="text-sm text-blue-700 mb-4">Última leitura: 145 m³</p>
          <button className="bg-blue-600 text-white w-full py-2 rounded-lg font-bold">Enviar Foto do Hidrômetro</button>
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <Flame className="text-orange-600 mb-4" size={32} />
          <h3 className="font-bold text-orange-900">Medição de Gás</h3>
          <p className="text-sm text-orange-700 mb-4">Última leitura: 82 m³</p>
          <button className="bg-orange-600 text-white w-full py-2 rounded-lg font-bold">Enviar Foto do Relógio</button>
        </div>
      </div>
    </div>
  );
}