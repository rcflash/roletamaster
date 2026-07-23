import React from 'react';
import { Wallet, TrendingUp, Award, RefreshCw, DollarSign, Target } from 'lucide-react';
import { BankrollConfig } from '../types';

interface BankrollCardsProps {
  config: BankrollConfig;
  currentBalance: number;
  netProfit: number;
  profitMarginPct: number;
  totalSpins: number;
  winRatePct: number;
  roiPct: number;
  peakBalance: number;
  lastNumber: number | null;
  lastColor: string;
  lastDozen: string;
  lastColumn: string;
}

export const BankrollCards: React.FC<BankrollCardsProps> = ({
  config,
  currentBalance,
  netProfit,
  profitMarginPct,
  totalSpins,
  winRatePct,
  roiPct,
  peakBalance,
  lastNumber,
  lastColor,
  lastDozen,
  lastColumn,
}) => {
  const isProfitable = netProfit >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Banca Inicial */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Banca Inicial</span>
          <Wallet className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <span className="text-lg font-black text-slate-200">
            {config.currency} {config.initialBankroll.toFixed(2)}
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">Capital de Entrada</p>
        </div>
      </div>

      {/* 2. Saldo Atual */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md ring-1 ring-emerald-500/20 hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Saldo Atual</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="text-xl font-black text-emerald-400">
            {config.currency} {currentBalance.toFixed(2)}
          </span>
          <p className="text-[10px] mt-0.5 font-bold">
            {totalSpins <= 100 ? (
              <span className="text-amber-400 font-black uppercase tracking-wider">Apostas ativas a partir do Giro 101</span>
            ) : (
              <span className="text-slate-500">Pico: {config.currency} {peakBalance.toFixed(2)}</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Lucro / Prejuízo */}
      <div className={`bg-slate-900/90 border rounded-xl p-3.5 flex flex-col justify-between shadow-md transition-all ${
        isProfitable ? 'border-emerald-900/60 ring-1 ring-emerald-500/10' : 'border-rose-900/60 ring-1 ring-rose-500/10'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Lucro Líquido</span>
          <TrendingUp className={`w-4 h-4 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`} />
        </div>
        <div>
          <span className={`text-xl font-black ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
          </span>
          <p className="text-[10px] font-bold mt-0.5 text-slate-400">
            {totalSpins <= 100 ? (
              <span className="text-amber-400/90 font-bold">Fase de Amostragem (Modo Preservado)</span>
            ) : (
              <>Retorno: <span className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>{profitMarginPct.toFixed(1)}%</span></>
            )}
          </p>
        </div>
      </div>

      {/* 4. Total de Giros & Custo */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Giros Totais</span>
          <RefreshCw className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-300">{totalSpins}</span>
            <span className="text-xs text-slate-400">giros</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Custo/Giro: {config.currency} {config.defaultSpinCost}
          </p>
        </div>
      </div>

      {/* 5. Taxa de Acerto & ROI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Taxa de Acerto</span>
          <Award className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <span className="text-xl font-black text-blue-400">{winRatePct.toFixed(1)}%</span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            ROI: <span className="font-semibold text-slate-300">{roiPct.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      {/* 6. Último Giro */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Último Número</span>
          <Target className="w-4 h-4 text-indigo-400" />
        </div>
        {lastNumber !== null ? (
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black px-2 py-0.5 rounded-lg text-white ${
                lastColor === 'red' ? 'bg-rose-600' : lastColor === 'black' ? 'bg-slate-950 border border-slate-700' : 'bg-emerald-600'
              }`}>
                {lastNumber}
              </span>
              <span className="text-xs font-semibold text-slate-300">{lastColor === 'red' ? 'Vermelho' : lastColor === 'black' ? 'Preto' : 'Verde'}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {lastDozen} • {lastColumn}
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-1">Nenhum giro</div>
        )}
      </div>
    </div>
  );
};
