import { Smartphone, ShieldCheck, Download, Video, Info, Copy } from 'lucide-react';

export default function Seguranca() {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header seguindo a identidade visual Onix */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white p-8 border-none shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Monitoramento Onix</h1>
            <p className="opacity-90 font-medium text-lg">Acompanhe as câmeras do condomínio em tempo real.</p>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-inner">
            <Video className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Passo 1: Download do App Correto */}
        <div className="card space-y-4 border-t-4 border-primary-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 p-2 rounded-lg">
              <Smartphone className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">1. Baixe o Aplicativo</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Utilizamos o sistema <strong>JFL</strong> para sua segurança. Instale o app <strong>WD-MOB V2</strong> para visualizar as câmeras.
          </p>
          <div className="space-y-2 pt-2">
            <a 
              href="https://play.google.com/store/apps/details?id=com.mcu.JFL&pcampaignid=web_share" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md"
            >
              <Download className="w-4 h-4" /> Google Play (Android)
            </a>
            <a 
              href="https://apps.apple.com/br/app/wd-mob-v2/id1370721463" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              <Download className="w-4 h-4" /> App Store (iOS)
            </a>
          </div>
        </div>

        {/* Passo 2: Configuração com Dados Reais */}
        <div className="card lg:col-span-2 space-y-4 border-t-4 border-green-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">2. Configure seu Acesso</h2>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
            <div className="space-y-4">
              <DetailField label="Endereço / DDNS" value="netminas.ddns.net" onCopy={copyToClipboard} />
              <DetailField label="Porta de Serviço" value="8000" onCopy={copyToClipboard} />
            </div>
            <div className="space-y-4">
              <DetailField label="Usuário" value="onix" onCopy={copyToClipboard} />
              <DetailField label="Senha" value="onix3333" isPassword onCopy={copyToClipboard} />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">Dica de Configuração:</p>
              <p>No aplicativo, escolha <strong>Adicionar Dispositivo</strong> e selecione o modo <strong>IP/Domínio</strong>. Preencha os campos com os dados acima para ativar a visualização.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer de Privacidade */}
      <div className="card bg-gray-900 text-white flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-none">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3 bg-white/10 rounded-full">
            <ShieldCheck className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Acesso Restrito</p>
            <p className="text-xs text-gray-400">Estas credenciais são exclusivas para moradores do Condomínio Onix.</p>
          </div>
        </div>
        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Segurança em Primeiro Lugar</p>
      </div>
    </div>
  );
}

// Subcomponente de Campo de Detalhe
function DetailField({ label, value, onCopy, isPassword = false }) {
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm text-primary-700 flex justify-between items-center group hover:border-primary-300 transition-all">
        <span className="truncate">{value}</span>
        <button 
          onClick={() => onCopy(value)}
          className="p-1 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
          title="Copiar"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}