import React, { useState } from 'react';
import { Sparkles, Layers, Trash2 } from 'lucide-react';

interface TableWarmupCardProps {
  onBatchAddSpins: (numbers: number[], multiplier?: number) => void;
  onClearAllSpins: () => void;
  totalSpins: number;
}

export const TableWarmupCard: React.FC<TableWarmupCardProps> = ({
  onBatchAddSpins,
  onClearAllSpins,
  totalSpins,
}) => {
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  const warmupTarget = 100;
  const warmupProgress = Math.min(100, Math.round((totalSpins / warmupTarget) * 100));

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
      onBatchAddSpins(parsedBulkNumbers);
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                COLETA DE DADOS DA MESA (AQUECIMENTO DE 100 GIROS)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                totalSpins >= 100
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {totalSpins >= 100 ? 'AMOSTRA DADOS PRONTA' : `FASE DE AQUECIMENTO (${totalSpins}/100)`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {totalSpins >= 100
                ? 'Amostra de 100 giros concluída! O Saldo da Banca está ativo e contabilizando lucros e perdas reais a partir do Giro 101.'
                : `Os primeiros 100 giros são para amostragem e aquecimento da mesa (saldo de banca 100% preservado). A contabilização do saldo começará a partir do Giro 101.`}
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
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Lançar Lote (100+)
            </button>
            {totalSpins > 0 && (
              <button
                onClick={onClearAllSpins}
                title="Limpar toda a base de dados para iniciar uma nova mesa do zero"
                className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white rounded-xl border border-rose-800/80 transition-all flex items-center gap-1.5 text-xs font-black shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Limpar Mesa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    Lançar Lote de Giros da Mesa
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cole uma lista de números separados por vírgula, espaço ou quebra de linha.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Exemplo: 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
              />

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Números identificados:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {parsedBulkNumbers.length} giros
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parsedBulkNumbers.length === 0}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  Importar {parsedBulkNumbers.length} Giros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
