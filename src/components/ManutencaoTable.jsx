import React from 'react';
import ManutencaoCardIcon from './ManutencaoCardIcon';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function ManutencaoTable({ servicos, onEdit, onDelete, onView }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-400 font-black uppercase">
          <tr>
            <th className="p-2">Ícone</th>
            <th className="p-2">Descrição</th>
            <th className="p-2">Data</th>
            <th className="p-2">Periodicidade</th>
            <th className="p-2">Status</th>
            <th className="p-2">Profissional/Empresa</th>
            <th className="p-2">Telefone</th>
            <th className="p-2">Card</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {servicos.length === 0 ? (
            <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">Nenhum serviço cadastrado.</td></tr>
          ) : (
            servicos.map((s) => (
              <tr key={s.id}>
                <td className="p-2"><ManutencaoCardIcon icone={s.icone} size={20} /></td>
                <td className="p-2 font-bold">{s.descricao}</td>
                <td className="p-2">{s.data_agendamento || '-'}</td>
                <td className="p-2">{s.periodicidade || '-'}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    s.status === 'Em dia' ? 'bg-green-100 text-green-700' : 
                    s.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-2">{s.profissional_empresa || '-'}</td>
                <td className="p-2">{s.telefone || '-'}</td>
                <td className="p-2 text-center">{s.card ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => onView && onView(s)} title="Ver" className="text-primary-600"><Eye size={18} /></button>
                  <button onClick={() => onEdit && onEdit(s)} title="Editar" className="text-blue-600"><Pencil size={18} /></button>
                  <button onClick={() => onDelete && onDelete(s)} title="Excluir" className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
