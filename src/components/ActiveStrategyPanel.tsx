import React from 'react';
import { Bot, Sliders, DollarSign, Cpu, FileText, Download, Activity, Radar, AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { StrategyConfig, BankrollConfig, SpinRecord } from '../types';
import { generateBotSuggestion, calculateTemperatures } from '../lib/roulette';
import { generateStrategyPDF } from '../utils/pdfStrategyGenerator';

interface ActiveStrategyPanelProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  config: BankrollConfig;
  spins: SpinRecord[];
  onOpenStrategyPdf?: () => void;
}

export const ActiveStrategyPanel: React.FC<ActiveStrategyPanelProps> = ({
  strategy,
  onUpdateStrategy,
  config,
  spins,
  onOpenStrategyPdf,
}) => {
  const botInfo = generateBotSuggestion(spins);
  const temps = calculateTemperatures(spins);
  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;

  // Identify dominant trends and alerts in recent spins
  const hotDozen = temps.dozenItems.find(d => d.status === 'HOT');
  const alertDozen = temps.dozenItems.find(d => d.status === 'ALERT');
  const alertCol = temps.columnItems.find(c => c.status === 'ALERT');

  const totalCost =
    strategy.dozen1Bet +
    strategy.dozen2Bet +
    strategy.dozen3Bet +
    strategy.column1Bet +
    strategy.column2Bet +
    strategy.column3Bet +
    strategy.colorRedBet +
    strategy.colorBlackBet +
    Object.values(strategy.straightNumberBets || {}).reduce((a: number, b: number) => a + b, 0);

  const straightNumbersList = Object.entries(strategy.straightNumberBets || {})
    .filter(([, v]) => (v as number) > 0)
    .map(([k]) => k)
    .join(', ');

  return (
    <div className="space-y-4">
      {/* 📡 Radar de Monitoramento de Tendência e Sinal em Tempo Real */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/30 relative">
              <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Monitoramento Giro a Giro Ativo
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded border border-slate-700">
                  {spins.length} Giros Registrados
                </span>
              </div>
              <p className="text-xs text-slate-300 font-bold mt-0.5">
                {lastSpin ? (
                  <>
                    Último Giro registrado: <strong className="text-amber-400">#{lastSpin.giro} (Nº {lastSpin.numero})</strong> — O algoritmo reavaliou todas as probabilidade e tendências instantaneamente!
                  </>
                ) : (
                  'Insira ou Cole giros para iniciar o radar de mudança de direção.'
                )}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Status da Mesa</span>
            <span className="text-xs font-black text-amber-300 flex items-center justify-end gap-1">
              {alertDozen || alertCol ? '⚠️ MUDANÇA DE PADRÃO DETECTADA' : '🟢 TENDÊNCIA ESTÁVEL'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 🤖 Bot Sugestor de Apostas */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-xl p-4 border border-indigo-500/20 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-indigo-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-extrabold text-indigo-100 uppercase tracking-wide">
                  BOT INTELIGENTE DE RECOMENDAÇÃO
                </h3>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40">
                Nível: {botInfo.level}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Próxima Aposta Recomendada (Atualizada):
              </span>
              <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 text-sm font-black text-amber-300 shadow-inner flex items-center justify-between">
                <span>{botInfo.suggestion}</span>
                <Bot className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              O algoritmo analisa a temperatura das dúzias, colunas e o histórico recente para ajustar o nível de exposição (N1 ➔ N2 ➔ N3) e sugerir o melhor ponto de entrada a cada novo número.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap">
            <span>Estratégia Recomendada: <strong className="text-slate-200">{botInfo.strategyName}</strong></span>
            <button
              onClick={() => onOpenStrategyPdf ? onOpenStrategyPdf() : generateStrategyPDF()}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
              title="Baixar Manual da Estratégia em PDF"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>Manual PDF</span>
            </button>
          </div>
        </div>

        {/* 🎯 Estratégia Ativa */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                  ▶ ESTRATÉGIA ATIVA DE APOSTAS
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Custo/Giro: {config.currency} {totalCost || config.defaultSpinCost}
              </span>
            </div>

            {/* Strategy Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-semibold">1ª Dúzia:</span>
                <span className="font-bold text-amber-400">{config.currency} {strategy.dozen1Bet}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-semibold">2ª Dúzia:</span>
                <span className="font-bold text-amber-400">{config.currency} {strategy.dozen2Bet}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-semibold">Números Individuais (Top 5 + Zero):</span>
                <span className="font-bold text-emerald-400 truncate max-w-[180px]">
                  {straightNumbersList ? `[${straightNumbersList}]` : 'Nenhum'}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Selector */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Preset Rápido:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  onUpdateStrategy({
                    activePreset: 'top5_hot',
                    dozen1Bet: 5,
                    dozen2Bet: 5,
                    dozen3Bet: 0,
                    straightNumberBets: { 0: 1, 15: 1, 30: 1, 19: 1, 31: 1 },
                  })
                }
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  strategy.activePreset === 'top5_hot'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Top 5 + Dúzias
              </button>
              <button
                onClick={() =>
                  onUpdateStrategy({
                    activePreset: 'cold_dozen',
                    dozen1Bet: 10,
                    dozen2Bet: 0,
                    dozen3Bet: 10,
                    straightNumberBets: { 0: 2 },
                  })
                }
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  strategy.activePreset === 'cold_dozen'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Dúzias Atrasadas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
