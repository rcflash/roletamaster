import React from 'react';
import { Volume2, VolumeX, Download, Upload, RotateCcw, Settings, Dices, Moon, Sun, Trash2, FileText } from 'lucide-react';
import { BankrollConfig } from '../types';

interface HeaderProps {
  config: BankrollConfig;
  onUpdateConfig: (updated: Partial<BankrollConfig>) => void;
  onOpenSettings: () => void;
  onOpenStrategyPdf?: () => void;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  onClearAllSpins: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentBalance: number;
  netProfit: number;
  totalSpins: number;
  greenCount: number;
  redCount: number;
  currentStreak?: { type: 'GREEN' | 'RED' | 'NONE'; count: number };
  maxGreenStreak?: number;
  maxRedStreak?: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onUpdateConfig,
  onOpenSettings,
  onOpenStrategyPdf,
  onExportCSV,
  onImportCSV,
  onResetData,
  onClearAllSpins,
  darkMode,
  onToggleDarkMode,
  currentBalance,
  netProfit,
  totalSpins,
  greenCount,
  redCount,
  currentStreak,
  maxGreenStreak,
  maxRedStreak,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-auto sm:h-12 py-2 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        {/* Top bar row on mobile / Left group on desktop */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30 shrink-0">
              <Dices className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight bg-gradient-to-r from-amber-300 via-amber-100 to-emerald-400 bg-clip-text text-transparent leading-none">
                ROLETA MASTER
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5 leading-none">
                Painel de Controle e Análise Inteligente
              </p>
            </div>
          </div>

          {/* Action Controls for mobile view */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
              title={config.soundEnabled ? "Som Ativado" : "Som Desativado"}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
            >
              {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 text-xs font-bold"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Balance Status Pill with GREEN and RED counters */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 bg-slate-950/80 ring-1 ring-slate-800 rounded-full px-3 py-1 text-[11px] font-semibold w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Saldo:</span>
            <span className="text-emerald-400 font-black text-xs font-mono">
              {config.currency} {currentBalance.toFixed(2)}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Lucro:</span>
            <span className={`font-black font-mono text-xs ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netProfit >= 0 ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 font-mono">
            <span
              className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[11px] flex items-center gap-1 shadow-sm"
              title={`Total GREENs: ${greenCount} (Maior Sequência: ${maxGreenStreak || 0}x)`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {greenCount} GREEN
            </span>
            <span
              className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black text-[11px] flex items-center gap-1 shadow-sm"
              title={`Total REDs: ${redCount} (Maior Sequência: ${maxRedStreak || 0}x)`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {redCount} RED
            </span>
          </div>
          {currentStreak && currentStreak.count > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 font-mono">
                <span
                  className={`px-2 py-0.5 rounded-full font-black text-[10px] tracking-tight flex items-center gap-1 border shadow-sm ${
                    currentStreak.type === 'GREEN'
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50 animate-pulse'
                      : 'bg-rose-500/30 text-rose-300 border-rose-400/50'
                  }`}
                  title={`Sequência Ativa: ${currentStreak.count} ${currentStreak.type} seguidos`}
                >
                  {currentStreak.type === 'GREEN' ? '🔥' : '⚠️'} Seq: {currentStreak.count}x {currentStreak.type}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls (Desktop view) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
            title={config.soundEnabled ? "Som Ativado" : "Som Desativado"}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
          >
            {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? "Modo Claro" : "Modo Escuro"}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            title="Exportar Dados (CSV)"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import CSV */}
          <label
            title="Importar Dados (CSV)"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".csv" onChange={onImportCSV} className="hidden" />
          </label>

          {/* Clear Base Button */}
          <button
            onClick={onClearAllSpins}
            title="Limpar toda a base de dados (Zerar mesa para novos 100 giros)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 text-[11px] font-black transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Limpar Base</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={onResetData}
            title="Restaurar Dados Demonstrativos"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Strategy PDF Guide */}
          {onOpenStrategyPdf && (
            <button
              onClick={onOpenStrategyPdf}
              title="Manual Estratégico em PDF"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 text-[11px] font-black transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Guia PDF</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 text-[11px] font-bold transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configurar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
