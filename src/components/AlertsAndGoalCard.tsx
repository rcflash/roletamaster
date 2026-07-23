import React, { useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BankrollConfig } from '../types';

interface AlertsAndGoalCardProps {
  config: BankrollConfig;
  netProfit: number;
}

export const AlertsAndGoalCard: React.FC<AlertsAndGoalCardProps> = ({ config, netProfit }) => {
  const goal = config.dailyGoal || 20;
  const stopLoss = config.stopLossLimit || 50;

  const progressPct = Math.max(0, Math.min(100, (netProfit / goal) * 100));
  const isGoalReached = netProfit >= goal;
  const isStopLossBreached = netProfit <= -stopLoss;

  useEffect(() => {
    if (isGoalReached) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6'],
      });
    }
  }, [isGoalReached]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Daily Goal Card */}
      <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Meta Diária ({config.currency} {goal.toFixed(2)})</span>
          </div>
          {isGoalReached ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> META ATINGIDA! 🎉
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              {progressPct.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>Progresso atual: <strong className="text-slate-200">{config.currency} {netProfit.toFixed(2)}</strong></span>
          <span>Falta: <strong className="text-amber-400">{config.currency} {Math.max(0, goal - netProfit).toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Stop Loss & Risk Alert */}
      <div className={`rounded-xl p-3.5 border flex flex-col justify-between transition-all ${
        isStopLossBreached
          ? 'bg-rose-950/30 border-rose-800/80 ring-1 ring-rose-500/30'
          : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${isStopLossBreached ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="text-xs font-bold text-slate-200">Alerta de Perda (Stop Loss: {config.currency} {stopLoss.toFixed(2)})</span>
          </div>
          {isStopLossBreached ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/30 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> STOP LOSS ATINGIDO! 🔴
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              🟢 Dentro do limite
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-1">
          {isStopLossBreached
            ? 'Atenção! Seu limite de perda configurado foi ultrapassado. Recomendamos pausar suas apostas para preservar a banca.'
            : `Gestão de banca ativa. Seu limite máximo de perda aceitável para a sessão é de ${config.currency} ${stopLoss.toFixed(2)}.`}
        </p>

        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
          <span>Risco Tolerável: <strong className="text-slate-300">{config.currency} {stopLoss.toFixed(2)}</strong></span>
          <span>Status: <strong className={isStopLossBreached ? "text-rose-400 font-bold" : "text-emerald-400"}>
            {isStopLossBreached ? 'ALERTA MÁXIMO' : 'SEGURO'}
          </strong></span>
        </div>
      </div>
    </div>
  );
};
