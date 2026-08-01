import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { SpinRecord, StrategyConfig } from '../types';
import { analyzeWarmupTable } from '../lib/roulette';

interface TableAnalysisCardProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
}

export const TableAnalysisCard: React.FC<TableAnalysisCardProps> = ({
  spins,
  strategy,
}) => {
  const radius = strategy?.neighborRadius || 2;
  const analysis = spins.length > 0 ? analyzeWarmupTable(spins, radius) : null;

  if (!analysis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">
            DIAGNÓSTICO DE PADRÃO DA MESA
          </h3>
        </div>
        <p className="text-xs text-slate-400 italic">
          Nenhum giro cadastrado na mesa. Lance giros para visualizar o diagnóstico de padrão e assertividade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">
            DIAGNÓSTICO DE PADRÃO DA MESA ({spins.length >= 100 ? 'ÚLTIMOS 100 GIROS ANALISADOS - ATUALIZAÇÃO EM TEMPO REAL' : `${analysis.totalGiros} GIROS ANALISADOS`})
          </h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border text-center ${analysis.badgeClass}`}>
          {analysis.statusTitle}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            Assertividade (% Acerto)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-lg font-black font-mono ${analysis.hitRatePct >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {analysis.hitRatePct}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({analysis.wins}W / {analysis.losses}R)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {analysis.alertCount} Alertas Gerados
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            Oscilação de Padrão
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-lg font-black font-mono ${analysis.dozenSwitchPct > 65 ? 'text-rose-400' : analysis.dozenSwitchPct <= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {analysis.dozenSwitchPct}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {analysis.dozenSwitchPct > 65 ? 'Alta Troca de Tendência' : 'Padrão Regular'}
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            Pico & Sequência Atual
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] font-bold text-rose-400 font-mono">
              Max RED: {analysis.maxConsecutiveLosses}x
            </span>
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              Max WIN: {analysis.maxConsecutiveWins}x
            </span>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold font-mono">
            <span className="text-slate-400">Seq. Atual:</span>
            {analysis.currentConsecutiveWins > 0 ? (
              <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 font-black">
                🔥 {analysis.currentConsecutiveWins}x GREEN
              </span>
            ) : analysis.currentConsecutiveLosses > 0 ? (
              <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 font-black">
                ⚠️ {analysis.currentConsecutiveLosses}x RED
              </span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            Dúzia Dominante
          </span>
          <span className="text-xs font-black text-amber-300 font-mono block mt-1 truncate">
            {analysis.topDozenText}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Setor: {analysis.topSectorText}
          </span>
        </div>
      </div>

      {/* Diagnostic & Advice Box */}
      <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800/80 text-xs space-y-2">
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-slate-100 font-extrabold">Resumo da Mesa: </strong>
          {analysis.statusDescription}
        </p>
        <p className="text-amber-300 font-semibold leading-relaxed flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <TrendingUp className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span><strong>Recomendação do Bot:</strong> {analysis.recommendation}</span>
        </p>
      </div>
    </div>
  );
};
