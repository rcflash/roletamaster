import React, { useState, useEffect } from 'react';
import { X, Flame, Snowflake, Check, RotateCcw, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { CasinoSyncConfig } from '../types';
import { RED_NUMBERS, getNumberColor } from '../lib/roulette';

interface CasinoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  casinoSync?: CasinoSyncConfig;
  config?: CasinoSyncConfig;
  onSaveSync?: (sync: CasinoSyncConfig) => void;
  onSave?: (sync: CasinoSyncConfig) => void;
  calculatedHotNumbers?: number[];
  calculatedColdNumbers?: number[];
  totalSpins?: number;
}

export const CasinoSyncModal: React.FC<CasinoSyncModalProps> = ({
  isOpen,
  onClose,
  casinoSync,
  config,
  onSaveSync,
  onSave,
  calculatedHotNumbers = [],
  calculatedColdNumbers = [],
  totalSpins = 0,
}) => {
  const activeConfig = casinoSync || config || {
    enabled: false,
    hotNumbers: [],
    coldNumbers: [],
    casinoRounds: 1000,
  };

  const [enabled, setEnabled] = useState<boolean>(activeConfig.enabled ?? false);
  const [hotSlots, setHotSlots] = useState<number[]>(() => {
    const list = [...(activeConfig.hotNumbers || [])];
    while (list.length < 4) list.push(NaN);
    return list.slice(0, 4);
  });
  const [coldSlots, setColdSlots] = useState<number[]>(() => {
    const list = [...(activeConfig.coldNumbers || [])];
    while (list.length < 4) list.push(NaN);
    return list.slice(0, 4);
  });
  const [roundsRef, setRoundsRef] = useState<100 | 200 | 500 | 1000>(
    activeConfig.casinoRounds || 1000
  );

  // Synchronize state when modal opens or activeConfig changes
  useEffect(() => {
    if (isOpen) {
      setEnabled(activeConfig.enabled ?? false);
      const listHot = [...(activeConfig.hotNumbers || [])];
      while (listHot.length < 4) listHot.push(NaN);
      setHotSlots(listHot.slice(0, 4));

      const listCold = [...(activeConfig.coldNumbers || [])];
      while (listCold.length < 4) listCold.push(NaN);
      setColdSlots(listCold.slice(0, 4));

      setRoundsRef(activeConfig.casinoRounds || 1000);
      setActiveSlot({ type: 'hot', index: 0 });
    }
  }, [isOpen, activeConfig.enabled, activeConfig.hotNumbers, activeConfig.coldNumbers, activeConfig.casinoRounds]);

  // Active target for quick number click picker: { type: 'hot' | 'cold', index: number }
  const [activeSlot, setActiveSlot] = useState<{ type: 'hot' | 'cold'; index: number }>({
    type: 'hot',
    index: 0,
  });

  if (!isOpen) return null;

  const handleSelectNumber = (num: number) => {
    if (activeSlot.type === 'hot') {
      const updated = [...hotSlots];
      updated[activeSlot.index] = num;
      setHotSlots(updated);
      // Advance to next slot
      if (activeSlot.index < 3) {
        setActiveSlot({ type: 'hot', index: activeSlot.index + 1 });
      } else {
        // Move to cold slot 0
        setActiveSlot({ type: 'cold', index: 0 });
      }
    } else {
      const updated = [...coldSlots];
      updated[activeSlot.index] = num;
      setColdSlots(updated);
      // Advance to next slot
      if (activeSlot.index < 3) {
        setActiveSlot({ type: 'cold', index: activeSlot.index + 1 });
      }
    }
  };

  const handleSlotInputChange = (type: 'hot' | 'cold', index: number, valStr: string) => {
    const num = parseInt(valStr, 10);
    if (type === 'hot') {
      const updated = [...hotSlots];
      updated[index] = !isNaN(num) && num >= 0 && num <= 36 ? num : NaN;
      setHotSlots(updated);
    } else {
      const updated = [...coldSlots];
      updated[index] = !isNaN(num) && num >= 0 && num <= 36 ? num : NaN;
      setColdSlots(updated);
    }
  };

  const handleFillFromCalculated = () => {
    const newHot = [...calculatedHotNumbers.slice(0, 4)];
    while (newHot.length < 4) newHot.push(NaN);
    const newCold = [...calculatedColdNumbers.slice(0, 4)];
    while (newCold.length < 4) newCold.push(NaN);

    setHotSlots(newHot);
    setColdSlots(newCold);
    setEnabled(true);
  };

  const handleResetSlots = () => {
    setHotSlots([NaN, NaN, NaN, NaN]);
    setColdSlots([NaN, NaN, NaN, NaN]);
    setActiveSlot({ type: 'hot', index: 0 });
  };

  const handleSave = () => {
    const validHot = hotSlots.filter((n) => !isNaN(n) && n >= 0 && n <= 36);
    const validCold = coldSlots.filter((n) => !isNaN(n) && n >= 0 && n <= 36);

    const hasAny = validHot.length > 0 || validCold.length > 0;

    const payload: CasinoSyncConfig = {
      enabled: hasAny ? enabled : false,
      hotNumbers: validHot,
      coldNumbers: validCold,
      casinoRounds: roundsRef,
      lastSyncAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (onSaveSync) {
      onSaveSync(payload);
    } else if (onSave) {
      onSave(payload);
    }
    onClose();
  };

  // Helper for slot rendering
  const renderSlotBox = (type: 'hot' | 'cold', index: number) => {
    const val = type === 'hot' ? hotSlots[index] : coldSlots[index];
    const isSelected = activeSlot.type === type && activeSlot.index === index;
    const hasVal = !isNaN(val) && val >= 0 && val <= 36;
    const color = hasVal ? getNumberColor(val) : null;

    let bgStyle = 'bg-slate-950/80 border-slate-800 text-slate-400';
    if (hasVal) {
      if (color === 'red') {
        bgStyle = 'bg-rose-600 border-rose-400 text-white font-black shadow-md';
      } else if (color === 'green') {
        bgStyle = 'bg-emerald-600 border-emerald-400 text-slate-950 font-black shadow-md';
      } else {
        bgStyle = 'bg-slate-900 border-slate-600 text-white font-black shadow-md';
      }
    }

    const ringStyle = isSelected
      ? type === 'hot'
        ? 'ring-2 ring-rose-400 border-rose-400 scale-105 z-10'
        : 'ring-2 ring-sky-400 border-sky-400 scale-105 z-10'
      : '';

    return (
      <div
        key={`${type}-slot-${index}`}
        onClick={() => setActiveSlot({ type, index })}
        className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center transition-all ${bgStyle} ${ringStyle} min-h-[58px] min-w-[58px] relative group`}
      >
        <span className="text-[9px] font-mono opacity-60 uppercase mb-0.5">
          {type === 'hot' ? `Q${index + 1}` : `F${index + 1}`}
        </span>
        {hasVal ? (
          <span className="text-lg font-black leading-none">{val}</span>
        ) : (
          <span className="text-xs text-slate-500 font-bold group-hover:text-slate-300">
            {isSelected ? '...' : '+'}
          </span>
        )}
      </div>
    );
  };

  const validHotCount = hotSlots.filter((n) => !isNaN(n)).length;
  const validColdCount = coldSlots.filter((n) => !isNaN(n)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0e1320] border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in duration-150">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-sky-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <span>Sincronizar com Roleta ao Vivo</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Digite os 4 Quentes e 4 Frios da tela de estatísticas da casa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rodadas de referência (como na imagem: 100, 200, 500, 1000) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <span>Amostragem da Casa (Rodadas):</span>
            </span>
            <div className="flex items-center gap-1">
              {([100, 200, 500, 1000] as const).map((r) => (
                <button
                  key={`rounds-${r}`}
                  type="button"
                  onClick={() => setRoundsRef(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black font-mono transition-all ${
                    roundsRef === r
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Painel Central Lado a Lado: 4 Quentes 🔥 e 4 Frios ❄️ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-[#0a0f1c] border border-slate-800/80 rounded-2xl p-3 sm:p-4">
          {/* Coluna 4 Quentes 🔥 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-1.5">
              <div className="flex items-center gap-1 text-rose-400 font-black text-xs uppercase tracking-wide">
                <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                <span>4 Quentes</span>
              </div>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40 font-bold">
                {validHotCount}/4
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((idx) => renderSlotBox('hot', idx))}
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Piscando em <strong className="text-rose-400">Vermelho</strong>
            </p>
          </div>

          {/* Coluna 4 Frios ❄️ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-sky-500/30 pb-1.5">
              <div className="flex items-center gap-1 text-sky-400 font-black text-xs uppercase tracking-wide">
                <Snowflake className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>4 Frios</span>
              </div>
              <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/40 font-bold">
                {validColdCount}/4
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((idx) => renderSlotBox('cold', idx))}
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Piscando em <strong className="text-sky-400">Azul</strong>
            </p>
          </div>
        </div>

        {/* Mini Teclado 0 a 36 para Seleção Instantânea */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Preenchendo:{' '}
              <strong className={activeSlot.type === 'hot' ? 'text-rose-400' : 'text-sky-400'}>
                {activeSlot.type === 'hot' ? `Quente #${activeSlot.index + 1}` : `Frio #${activeSlot.index + 1}`}
              </strong>{' '}
              (clique no número abaixo):
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeSlot.type === 'hot') {
                  const updated = [...hotSlots];
                  updated[activeSlot.index] = NaN;
                  setHotSlots(updated);
                } else {
                  const updated = [...coldSlots];
                  updated[activeSlot.index] = NaN;
                  setColdSlots(updated);
                }
              }}
              className="text-[10px] text-slate-400 hover:text-rose-400 underline font-mono"
            >
              Limpar este slot
            </button>
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-13 gap-1">
            {/* Zero */}
            <button
              type="button"
              onClick={() => handleSelectNumber(0)}
              className="h-7 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center justify-center border border-emerald-400/50"
            >
              0
            </button>
            {/* 1 to 36 */}
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
              const isRed = RED_NUMBERS.includes(n);
              const isHotSlot = hotSlots.includes(n);
              const isColdSlot = coldSlots.includes(n);

              let btnBg = isRed
                ? 'bg-rose-700 hover:bg-rose-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200';

              if (isHotSlot) {
                btnBg = 'ring-2 ring-rose-400 ' + btnBg;
              } else if (isColdSlot) {
                btnBg = 'ring-2 ring-sky-400 ' + btnBg;
              }

              return (
                <button
                  key={`pick-${n}`}
                  type="button"
                  onClick={() => handleSelectNumber(n)}
                  className={`h-7 rounded font-black text-xs transition-transform active:scale-95 flex items-center justify-center border border-slate-800 ${btnBg}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ações Auxiliares: Preencher com Calculados da Mesa ou Zerar */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={handleFillFromCalculated}
            disabled={totalSpins === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="Importar os 4 quentes e 4 frios computados automaticamente a partir dos giros da mesa atual"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Puxar da Mesa ({totalSpins} giros)</span>
          </button>

          <button
            type="button"
            onClick={handleResetSlots}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Todos</span>
          </button>
        </div>

        {/* Footer com Salvar e Cancelar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
            />
            <span className="text-xs text-slate-300 font-bold">
              Ativar Sincronia com a Casa
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Sincronia</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
