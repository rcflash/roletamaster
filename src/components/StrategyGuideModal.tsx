import React from 'react';
import { FileText, Download, X, CheckCircle2, ShieldAlert, Sparkles, Target, DollarSign, Layers } from 'lucide-react';
import { generateStrategyPDF } from '../utils/pdfStrategyGenerator';

import { SpinRecord, BankrollConfig } from '../types';

interface StrategyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: BankrollConfig;
}

export const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                  Manual Oficial
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide mt-0.5">
                Guia Estratégico & Manual em PDF
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateStrategyPDF(config)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-black text-amber-400 uppercase tracking-wide text-xs">
                Estratégia Probabilística de Alta Frequência (64,8% de Acerto)
              </h4>
              <p className="text-xs text-slate-300">
                Aprenda a operar com vantagem matemática utilizando a amostragem de 100 giros, cobertura dupla e gestão rigorosa de stop loss.
              </p>
            </div>
            <button
              onClick={() => generateStrategyPDF(config)}
              className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Salvar PDF
            </button>
          </div>

          {/* Section 1 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-100 font-black uppercase tracking-wider text-xs sm:text-sm text-amber-400">
              <Layers className="w-4 h-4" /> 1. O Princípio da Amostragem de 100 Giros
            </div>
            <p className="text-slate-300 text-xs">
              A roleta possui 37 números (0 a 36). Em intervalos curtos (20 giros), ocorrem anomalias temporárias. Para operar com vantagem estatística real, a regra nº 1 é coletar ou colar cerca de 100 giros do cassino antes de realizar apostas reais.
            </p>
            <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li>Copie a lista de últimos números do seu cassino online.</li>
              <li>Use o botão <strong className="text-emerald-400">"Lançar Lote (100+)"</strong> no aplicativo.</li>
              <li>O sistema processará o termômetro exato de Dúzias e Colunas mais quentes.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-100 font-black uppercase tracking-wider text-xs sm:text-sm text-emerald-400">
              <Target className="w-4 h-4" /> 2. Cobertura Dupla de Dúzias (64,86% de Chance)
            </div>
            <p className="text-slate-300 text-xs">
              Em vez de apostar em um único número (risco de 2,7%), cobrimos 24 dos 37 números apostando simultaneamente nas 2 Dúzias ou Colunas que apresentarem maior frequência.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block">Payout 2:1</span>
                <span>Se apostar R$ 5,00 na 1ª Dúzia + R$ 5,00 na 2ª Dúzia (Total R$ 10,00), se qualquer uma bater você recebe R$ 15,00 (Lucro limpo: +R$ 5,00).</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block">Proteção no Zero</span>
                <span>Coloque R$ 0,50 ou R$ 1,00 no Zero. Caso o Zero saia, a proteção paga 35:1 (R$ 36,00), pagando todo o custo das dúzias e dando +R$ 26,00 de lucro.</span>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-100 font-black uppercase tracking-wider text-xs sm:text-sm text-rose-400">
              <ShieldAlert className="w-4 h-4" /> 3. Gestão de Banca & Stop Loss Rigoroso
            </div>
            <p className="text-slate-300 text-xs">
              O segredo dos operadores lucrativos é a disciplina cirúrgica de parar ao bater a meta ou atingir o limite de segurança.
            </p>
            <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li><strong className="text-slate-200">Stake/Aposta:</strong> Use de 2% a 5% da banca total por rodada.</li>
              <li><strong className="text-emerald-400">Stop Gain (Meta):</strong> Meta diária recomendada de 15% a 20% do capital. Atingiu? Desconecte.</li>
              <li><strong className="text-rose-400">Stop Loss (Limite):</strong> Limite de perda diário de 20% a 30%. Se perder 2 a 3 giros em sequência, pare a sessão.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-100 font-black uppercase tracking-wider text-xs sm:text-sm text-indigo-400">
              <CheckCircle2 className="w-4 h-4" /> 4. Roteiro Prático de Operação no Sistema
            </div>
            <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
              <li>Limpe a mesa no botão "Limpar Mesa".</li>
              <li>Cole os 100 giros no botão "Lançar Lote (100+)".</li>
              <li>Aguarde o Bot sinalizar a recomendação verde.</li>
              <li>Faça a aposta no cassino respeitando a stake.</li>
              <li>Insira cada novo número sorteado para manter a análise viva.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Manual gerado por Roleta Master AI • Gestão de Banca Inteligente
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Fechar
            </button>
            <button
              onClick={() => generateStrategyPDF(config)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Baixar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
