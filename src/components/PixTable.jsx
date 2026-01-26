import React from 'react';

const statusColors = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  PAGO: 'bg-green-100 text-green-700',
  EXPIRADO: 'bg-gray-200 text-gray-500',
  CANCELADO: 'bg-red-100 text-red-700',
  AGENDADO: 'bg-blue-100 text-blue-700',
  ENVIADO: 'bg-blue-100 text-blue-700',
  CONFIRMADO: 'bg-green-100 text-green-700',
  FALHOU: 'bg-red-100 text-red-700',
};

export default function PixTable({ transacoes, onVisualizar, onCopiar, onComprovante, onCancelar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-400 font-black uppercase">
          <tr>
            <th className="p-2">Tipo</th>
            <th className="p-2">Valor</th>
            <th className="p-2">Status</th>
            <th className="p-2">Descrição</th>
            <th className="p-2">Cliente/Favorecido</th>
            <th className="p-2">Data</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transacoes.length === 0 ? (
            <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">Nenhuma transação encontrada.</td></tr>
          ) : (
            transacoes.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 font-bold uppercase">{t.tipo}</td>
                <td className="p-2 font-black">{Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                </td>
                <td className="p-2">{t.descricao}</td>
                <td className="p-2">{t.cliente_id ? `Cliente #${t.cliente_id}` : (t.favorecido_nome || '-')}</td>
                <td className="p-2">{t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => onVisualizar && onVisualizar(t)} className="text-primary-600 font-bold text-xs">Ver</button>
                  {t.pix_copia_cola && <button onClick={() => onCopiar && onCopiar(t)} className="text-blue-600 font-bold text-xs">Copiar Pix</button>}
                  {t.qr_code_base64 && <button onClick={() => onComprovante && onComprovante(t)} className="text-green-600 font-bold text-xs">Comprovante</button>}
                  {['PENDENTE','AGENDADO','ENVIADO'].includes(t.status) && <button onClick={() => onCancelar && onCancelar(t)} className="text-red-600 font-bold text-xs">Cancelar</button>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
