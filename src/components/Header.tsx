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
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-12 flex items-center justify-between gap-3">
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

        {/* Balance Status Pill */}
        <div className="hidden md:flex items-center gap-2.5 bg-slate-800/80 ring-1 ring-slate-700/60 rounded-full px-3 py-1 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Saldo:</span>
            <span className="text-emerald-400 font-bold text-xs">
              {config.currency} {currentBalance.toFixed(2)}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Lucro:</span>
            <span className={netProfit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {netProfit >= 0 ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
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
