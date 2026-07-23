import React, { useState, useRef } from 'react';
import { Plus, Undo2, Zap, Hash, ListFilter, Layers, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { RED_NUMBERS } from '../lib/roulette';

interface QuickSpinInputProps {
  onAddSpin: (number: number, multiplier?: number) => void;
  onBatchAddSpins: (numbers: number[], multiplier?: number) => void;
  onUndoLastSpin: () => void;
  onClearAllSpins: () => void;
  totalSpins: number;
  lastNumber?: number | null;
}

export const QuickSpinInput: React.FC<QuickSpinInputProps> = ({
  onAddSpin,
  onBatchAddSpins,
  onUndoLastSpin,
  onClearAllSpins,
  totalSpins,
  lastNumber = null,
}) => {
  const [selectedNum, setSelectedNum] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Single Spin Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNum !== '') {
      const parsed = parseInt(selectedNum, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 36) {
        onAddSpin(parsed, multiplier > 1 ? multiplier : undefined);
        setSelectedNum('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  };

  const handleQuickClick = (num: number) => {
    onAddSpin(num, multiplier > 1 ? multiplier : undefined);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Bulk / Batch Submit (Parsing comma, space, line break separated numbers)
  const parsedBulkNumbers = bulkText
    .replace(/[^0-9\s,-]/g, ' ')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 36);

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkNumbers.length > 0) {
      onBatchAddSpins(parsedBulkNumbers, multiplier > 1 ? multiplier : undefined);
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  const warmupTarget = 100;
  const warmupProgress = Math.min(100, Math.round((totalSpins / warmupTarget) * 100));

  return (
    <div className="space-y-4">
      {/* 🚀 100 Spin Warmup / Calibration Progress Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                COLETA DE DADOS DA MESA (AQUECIMENTO DE 100 GIROS)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                totalSpins >= 100
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {totalSpins >= 100 ? 'AMOSTRA DADOS PRONTA' : `FASE DE COLETA (${totalSpins}/100)`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {totalSpins >= 100
                ? 'Amostra de 100 giros concluída! O Saldo da Banca está ativo e contabilizando lucros e perdas reais a partir do Giro 101.'
                : `Os primeiros 100 giros são para amostragem/aquecimento (saldo de banca preservado). O Saldo começará a contar a partir do Giro 101. Faltam ${100 - totalSpins} rodadas.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="w-full sm:w-36 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Progresso Amostra</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-black text-emerald-400 font-mono">{warmupProgress}%</span>
              <span className="text-[10px] text-slate-400 font-mono">{totalSpins}/100</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${warmupProgress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4" /> Lançar Lote (100+)
            </button>
            {totalSpins > 0 ? (
              <button
                onClick={onClearAllSpins}
                title="Limpar toda a base de dados para iniciar uma nova mesa do zero"
                className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white rounded-xl border border-rose-800/80 transition-all flex items-center gap-1.5 text-xs font-black shadow-md"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Limpar Mesa</span>
              </button>
            ) : (
              <button
                onClick={() => setShowBulkModal(true)}
                title="Mesa limpa e pronta para colar seus 100 giros"
                className="px-3 py-2.5 bg-slate-950 text-emerald-400 rounded-xl border border-emerald-500/30 text-xs font-bold"
              >
                Mesa Pronta (0 Giros)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 Quick Input Bento Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                  Lançamento Rápido de Números
                </h3>
                {lastNumber !== null && lastNumber !== undefined && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-sm animate-fadeIn">
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Último Saiu:</span>
                    <span className={`px-2 py-0.5 rounded-md font-black text-xs text-white shadow ${
                      RED_NUMBERS.includes(lastNumber)
                        ? 'bg-rose-600 border border-rose-400'
                        : lastNumber === 0
                        ? 'bg-emerald-600 border border-emerald-400'
                        : 'bg-slate-900 border border-slate-700'
                    }`}>
                      #{lastNumber}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Digite um número (0-36) e tecle <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-400 font-mono text-[10px]">Enter</kbd> ou clique no teclado abaixo
              </p>
            </div>
          </div>

          {/* Multiplier Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">Mult:</span>
            {[1, 2, 5, 10, 20, 50, 100].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMultiplier(m)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  multiplier === m
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {m}x
              </button>
            ))}
          </div>

          {/* Fast Keyboard Form & Undo */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  type="number"
                  min="0"
                  max="36"
                  value={selectedNum}
                  onChange={(e) => setSelectedNum(e.target.value)}
                  placeholder="0-36"
                  className="w-24 pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-base font-black text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={selectedNum === ''}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Lançar
              </button>
            </form>

            {totalSpins > 0 && (
              <button
                onClick={onUndoLastSpin}
                title="Desfazer último giro"
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-800 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Visual Roulette Number Pad Grid */}
        <div className="grid grid-cols-12 sm:grid-cols-13 gap-1.5">
          {/* Zero */}
          {(() => {
            const isZeroLast = lastNumber === 0;
            return (
              <button
                onClick={() => handleQuickClick(0)}
                className={`col-span-12 sm:col-span-1 h-12 rounded-xl text-slate-950 font-black text-sm shadow transition-all active:scale-95 flex flex-col items-center justify-center border relative ${
                  isZeroLast
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-950 shadow-xl shadow-amber-500/50 scale-105 z-10 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40'
                }`}
              >
                <span>0</span>
                {isZeroLast && (
                  <span className="text-[8px] bg-slate-950 text-amber-300 px-1 rounded font-black uppercase tracking-tighter -mt-0.5 border border-amber-400/50">
                    ÚLTIMO
                  </span>
                )}
              </button>
            );
          })()}

          {/* 1 to 36 */}
          {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
            const isRed = RED_NUMBERS.includes(num);
            const isLast = lastNumber === num;
            return (
              <button
                key={num}
                onClick={() => handleQuickClick(num)}
                className={`h-12 rounded-xl font-black text-xs sm:text-sm shadow transition-all active:scale-95 flex flex-col items-center justify-center border relative ${
                  isLast
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-950 shadow-xl shadow-amber-500/50 scale-105 z-10 font-black'
                    : isRed
                    ? 'bg-rose-950/80 hover:bg-rose-800 border-rose-800/80 text-rose-200'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
              >
                <span>{num}</span>
                {isLast && (
                  <span className="text-[8px] bg-slate-950 text-amber-300 px-1 rounded font-black uppercase tracking-tighter -mt-0.5 border border-amber-400/50">
                    ÚLTIMO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📦 Bulk Input Modal / Dialog */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                    Lançamento em Lote da Mesa (Até 100+ Giros)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cole uma sequência de números separados por vírgula, espaço ou quebra de linha.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  Sequência de Números Sorteados:
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Exemplo: 32, 15, 19, 4, 0, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Live Detection Summary */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Números Válidos Detectados:
                </span>
                <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl ${
                  parsedBulkNumbers.length > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {parsedBulkNumbers.length} números
                </span>
              </div>

              {parsedBulkNumbers.length > 0 && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl max-h-24 overflow-y-auto">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Pré-visualização:</span>
                  <div className="flex flex-wrap gap-1">
                    {parsedBulkNumbers.map((num, i) => (
                      <span
                        key={`preview-${i}`}
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg text-white ${
                          RED_NUMBERS.includes(num) ? 'bg-rose-700' : num === 0 ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parsedBulkNumbers.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Lançar {parsedBulkNumbers.length} Giros na Banca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
