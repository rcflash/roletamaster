import React, { useState, useRef } from 'react';
import { Undo2, Zap, Layers, CheckCircle2, Sparkles, Trash2, Camera, UploadCloud, Loader2, ArrowLeftRight } from 'lucide-react';
import { RED_NUMBERS } from '../lib/roulette';

interface QuickSpinInputProps {
  onAddSpin: (number: number, multiplier?: number) => void;
  onBatchAddSpins: (numbers: number[], multiplier?: number) => void;
  onUndoLastSpin: () => void;
  onClearAllSpins: () => void;
  totalSpins: number;
  lastNumber?: number | null;
  showWarmupBanner?: boolean;
}

export const QuickSpinInput: React.FC<QuickSpinInputProps> = ({
  onAddSpin,
  onBatchAddSpins,
  onUndoLastSpin,
  onClearAllSpins,
  totalSpins,
  lastNumber = null,
  showWarmupBanner = false,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccessCount, setImageSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image OCR Upload with Gemini Vision
  const processImageFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    setIsAnalyzingImage(true);
    setImageError(null);
    setImageSuccessCount(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;

          const res = await fetch('/api/extract-spins-from-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/png',
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Não foi possível ler os números da imagem.');
          }

          if (data.numbers && data.numbers.length > 0) {
            const extractedStr = data.numbers.join(', ');
            setBulkText((prev) => (prev ? `${prev}, ${extractedStr}` : extractedStr));
            setImageSuccessCount(data.numbers.length);
          } else {
            setImageError('Nenhum número de roleta (0-36) foi identificado na imagem. Tente enviar uma foto mais nítida do painel.');
          }
        } catch (err: any) {
          console.error(err);
          setImageError(err.message || 'Erro ao processar imagem.');
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setImageError('Erro ao carregar arquivo de imagem.');
      setIsAnalyzingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Reverse sequence in bulk text (from current list order)
  const handleReverseText = () => {
    if (!bulkText.trim()) return;
    const nums = bulkText
      .replace(/[^0-9\s,-]/g, ' ')
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (nums.length > 0) {
      setBulkText(nums.reverse().join(', '));
    }
  };

  // Single Spin Submit
  const handleQuickClick = (num: number) => {
    onAddSpin(num, multiplier > 1 ? multiplier : undefined);
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
    <div className="space-y-2.5">
      {/* 🚀 100 Spin Warmup / Calibration Progress Banner */}
      {showWarmupBanner && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">
                  COLETA DE DADOS DA MESA (AQUECIMENTO DE 100 GIROS)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  totalSpins >= 100
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {totalSpins >= 100 ? 'AMOSTRA DADOS PRONTA' : `FASE DE COLETA (${totalSpins}/100)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {totalSpins >= 100
                  ? 'Amostra de 100 giros concluída! O Saldo da Banca está ativo e contabilizando lucros e perdas reais a partir do Giro 101.'
                  : `Os primeiros 100 giros são para amostragem/aquecimento (saldo de banca preservado). O Saldo começará a contar a partir do Giro 101. Faltam ${100 - totalSpins} rodadas.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <div className="w-full sm:w-32 bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold block">Progresso Amostra</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs font-black text-emerald-400 font-mono">{warmupProgress}%</span>
                <span className="text-[9px] text-slate-400 font-mono">{totalSpins}/100</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${warmupProgress}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" /> Lançar Lote (100+)
              </button>
              {totalSpins > 0 ? (
                <button
                  onClick={onClearAllSpins}
                  title="Limpar toda a base de dados para iniciar uma nova mesa do zero"
                  className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white rounded-xl border border-rose-800/80 transition-all flex items-center gap-1 text-[11px] font-black shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Limpar Mesa</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowBulkModal(true)}
                  title="Mesa limpa e pronta para colar seus 100 giros"
                  className="px-2.5 py-2 bg-slate-950 text-emerald-400 rounded-xl border border-emerald-500/30 text-[11px] font-bold"
                >
                  Mesa Pronta (0 Giros)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Quick Input Bento Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
                  Lançamento Rápido de Números
                </h3>
                {lastNumber !== null && lastNumber !== undefined && (
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-sm animate-fadeIn">
                    <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider">ÚLTIMO SAIU:</span>
                    <span className={`px-1.5 py-0.2 rounded font-black text-[11px] text-white shadow ${
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
              <p className="text-[10px] text-slate-400">
                Clique nos números do teclado abaixo para lançar na mesa
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Multiplier Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-1.5 hidden sm:inline">Mult:</span>
              {[1, 2, 5, 10, 20, 50, 100].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMultiplier(m)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    multiplier === m
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>

            {/* Bulk / Batch Import Button */}
            <button
              type="button"
              onClick={() => {
                setImageError(null);
                setImageSuccessCount(null);
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Cole números ou envie um print da tela para extração por IA"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar Lote / Print IA</span>
            </button>

            {/* Undo Button */}
            <button
              type="button"
              onClick={onUndoLastSpin}
              disabled={totalSpins === 0}
              title="Desfazer último número lançado"
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 disabled:hover:bg-rose-500/10 text-rose-400 border border-rose-500/30 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Undo2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Desfazer</span>
            </button>
          </div>
        </div>

        {/* Visual Roulette Number Pad Grid */}
        <div className="grid grid-cols-12 sm:grid-cols-13 gap-1">
          {/* Zero */}
          {(() => {
            const isZeroLast = lastNumber === 0;
            return (
              <button
                onClick={() => handleQuickClick(0)}
                className={`col-span-12 sm:col-span-1 h-8 sm:h-9 rounded-lg text-slate-950 font-black text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center border relative ${
                  isZeroLast
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md scale-105 z-10 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40'
                }`}
              >
                <span>0</span>
                {isZeroLast && (
                  <span className="text-[7px] bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase tracking-tighter -mt-0.5 border border-amber-400/50 leading-none">
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
                className={`h-8 sm:h-9 rounded-lg font-black text-xs shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center border relative ${
                  isLast
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md scale-105 z-10 font-black'
                    : isRed
                    ? 'bg-rose-950/80 hover:bg-rose-800 border-rose-800/80 text-rose-200'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
              >
                <span>{num}</span>
                {isLast && (
                  <span className="text-[7px] bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase tracking-tighter -mt-0.5 border border-amber-400/50 leading-none">
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
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* 📸 AI Gemini Print Upload Zone */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Camera className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Extração por Print / Foto (IA Gemini)
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                    Automático
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Envie o print da tela da roleta (como na Evolution, Pragmatic, Playtech) e a IA extrairá todos os números em sequência.
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzingImage}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
                >
                  {isAnalyzingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-amber-300 font-extrabold">
                        IA Gemini Analisando Print e Lendo Números...
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>Clique para Enviar Imagem do Print (PNG / JPG)</span>
                    </>
                  )}
                </button>

                {imageSuccessCount !== null && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sucesso! {imageSuccessCount} números extraídos do print da roleta.</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-normal pl-6">
                      A ordem foi ajustada automaticamente (do mais antigo ao mais recente) para que o número no topo-esquerda do print seja o <strong>ÚLTIMO SAIU (#1)</strong>.
                    </p>
                  </div>
                )}

                {imageError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2 animate-fadeIn">
                    <span className="shrink-0">⚠️</span>
                    <span>{imageError}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    Sequência de Números Sorteados (Do Antigo ao Recente):
                  </label>
                  <button
                    type="button"
                    onClick={handleReverseText}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
                    title="Inverter a sequência dos números de trás para a frente"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                    <span>Inverter Ordem</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Exemplo: 32, 15, 19, 4, 0, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-slate-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Os números são processados da esquerda para a direita. O <strong>último número da lista</strong> acima será registrado como o <strong>ÚLTIMO SAIU (#1)</strong>.
                </p>
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
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl max-h-28 overflow-y-auto space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold">
                    <span>Primeiro a Entrar (Giro Inicial) ➔</span>
                    <span className="text-amber-400 font-black">🎯 ÚLTIMO SAIU (#1)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {parsedBulkNumbers.map((num, i) => {
                      const isLastItem = i === parsedBulkNumbers.length - 1;
                      return (
                        <span
                          key={`preview-${i}`}
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg text-white relative ${
                            isLastItem
                              ? 'bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-md ring-2 ring-amber-400/40'
                              : RED_NUMBERS.includes(num)
                              ? 'bg-rose-700'
                              : num === 0
                              ? 'bg-emerald-600'
                              : 'bg-slate-800'
                          }`}
                        >
                          {num}
                          {isLastItem && <span className="ml-1 text-[9px]">★</span>}
                        </span>
                      );
                    })}
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
