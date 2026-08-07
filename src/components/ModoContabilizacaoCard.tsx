import React, { useState, useEffect } from 'react';
import { Sliders, Compass, Sparkles, Coins, TrendingUp, Info, Calculator, Settings2 } from 'lucide-react';
import { StrategyConfig, BankrollConfig, SpinRecord } from '../types';
import { generateBotSuggestion, getWheelNeighbors } from '../lib/roulette';

interface ModoContabilizacaoCardProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  config: BankrollConfig;
  spins: SpinRecord[];
}

export const ModoContabilizacaoCard: React.FC<ModoContabilizacaoCardProps> = ({
  strategy,
  onUpdateStrategy,
  spins,
}) => {
  const radius = strategy.neighborRadius || 2;
  const chipValue = strategy.neighborChipValue || 2.5;
  const tableMult = strategy.tablePayoutMultiplier || 36;
  const payoutMode = strategy.tablePayoutMode || (tableMult === 36 ? '36x' : tableMult === 30 ? '30x' : 'custom');

  const botInfo = generateBotSuggestion(spins, strategy);
  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const targetNum = lastSpin ? lastSpin.numero : 0;
  const neighbors = getWheelNeighbors(targetNum, radius);

  const numHouses = neighbors.length; // e.g. 15 for 7 VIZ
  const totalBet = numHouses * chipValue; // e.g. 15 * 2.50 = R$ 37.50
  const grossReturn = chipValue * tableMult; // e.g. 2.50 * 36 = R$ 90.00
  const netProfitOnWin = grossReturn - totalBet; // e.g. 90 - 37.50 = R$ 52.50
  const profitUnits = totalBet > 0 ? (netProfitOnWin / totalBet).toFixed(2) : '1.40';

  // Input states for custom typing
  const [chipInput, setChipInput] = useState<string>(chipValue.toString());
  const [returnInput, setReturnInput] = useState<string>(grossReturn.toFixed(2));
  const [multInput, setMultInput] = useState<string>(tableMult.toString());

  // Keep input fields in sync if strategy changes externally
  useEffect(() => {
    setChipInput(chipValue.toString());
    setReturnInput((chipValue * tableMult).toFixed(2));
    setMultInput(tableMult.toString());
  }, [chipValue, tableMult]);

  // Handle preset chip button clicks
  const handleSelectPresetChip = (val: number) => {
    setChipInput(val.toString());
    const newGross = val * tableMult;
    setReturnInput(newGross.toFixed(2));
    onUpdateStrategy({ neighborChipValue: val });
  };

  // Handle typing custom chip value
  const handleChipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setChipInput(raw);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      const newGross = parsed * tableMult;
      setReturnInput(newGross.toFixed(2));
      onUpdateStrategy({ neighborChipValue: parsed });
    }
  };

  // Handle selecting preset table payout mode
  const handleSelectPayoutMode = (mode: '36x' | '30x' | '1:1' | 'custom') => {
    if (mode === '36x') {
      const mult = 36;
      setMultInput('36');
      const gross = chipValue * mult;
      setReturnInput(gross.toFixed(2));
      onUpdateStrategy({ tablePayoutMultiplier: mult, tablePayoutMode: '36x' });
    } else if (mode === '30x') {
      const mult = 30;
      setMultInput('30');
      const gross = chipValue * mult;
      setReturnInput(gross.toFixed(2));
      onUpdateStrategy({ tablePayoutMultiplier: mult, tablePayoutMode: '30x' });
    } else if (mode === '1:1') {
      // 1:1 payout means win profit equals total bet, so total return = 2 * totalBet
      // Return = 2 * (numHouses * chipValue), so multiplier per chip = 2 * numHouses
      const mult = numHouses * 2;
      setMultInput(mult.toString());
      const gross = 2 * totalBet;
      setReturnInput(gross.toFixed(2));
      onUpdateStrategy({ tablePayoutMultiplier: mult, tablePayoutMode: '1:1' });
    } else {
      onUpdateStrategy({ tablePayoutMode: 'custom' });
    }
  };

  // Handle typing custom total win return in R$
  const handleReturnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setReturnInput(raw);
    const parsedReturn = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsedReturn) && parsedReturn > 0 && chipValue > 0) {
      const calculatedMult = parsedReturn / chipValue;
      setMultInput(calculatedMult.toFixed(2));
      onUpdateStrategy({
        tablePayoutMultiplier: calculatedMult,
        customWinReturn: parsedReturn,
        tablePayoutMode: 'custom',
      });
    }
  };

  // Handle typing custom multiplier directly (e.g. 36x, 30x, 29x)
  const handleMultInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMultInput(raw);
    const parsedMult = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsedMult) && parsedMult > 0) {
      const newGross = chipValue * parsedMult;
      setReturnInput(newGross.toFixed(2));
      onUpdateStrategy({
        tablePayoutMultiplier: parsedMult,
        tablePayoutMode: 'custom',
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ CONFIGURAÇÃO DE FICHAS E RETORNO DA MESA
          </h3>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
          <Compass className="w-3 h-3 text-amber-400" />
          ALERTA DE VIZINHOS
        </span>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 p-3 rounded-xl border border-amber-500/30 space-y-2 text-xs">
        <span className="font-black text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Estratégia Principal: Vizinhos do Cilindro ({radius} VIZ - {numHouses} Casas)
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          O saldo e os lucros são contabilizados com base no valor da ficha e no multiplicador de retorno da sua mesa. Ajuste os valores abaixo conforme a roleta que você estiver jogando.
        </p>
        <div className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-1">
          <span>Próxima Aposta Sugerida: {botInfo.suggestion}</span>
          <span className="text-amber-400 font-extrabold text-xs">Aposta Total: R$ {totalBet.toFixed(2)}</span>
        </div>
      </div>

      {/* 1. Cobertura no Cilindro (Vizinhos) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            1. Cobertura de Vizinhos no Cilindro:
          </label>
          <span className="text-[10px] font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {numHouses} casas cobertas
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {([2, 3, 4, 5, 6, 7] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => onUpdateStrategy({ neighborRadius: cnt })}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                radius === cnt
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cnt} VIZ ({cnt * 2 + 1} casas)
            </button>
          ))}
        </div>
      </div>

      {/* 2. Valor da Ficha (Selecionar Presets ou Digitar) */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            2. Valor da Ficha (Por casa apostada):
          </label>
          <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
            Atual: R$ {chipValue.toFixed(2)}
          </span>
        </div>

        {/* Preset Chip Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {([0.5, 1, 2.5, 5, 20, 50] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleSelectPresetChip(val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chipValue === val
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>R$ {val.toFixed(2)}</span>
            </button>
          ))}
        </div>

        {/* Custom Chip Input */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-medium text-slate-400">Ou digite o valor da ficha:</span>
          <div className="relative flex-1 max-w-[160px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
            <input
              type="number"
              step="0.10"
              min="0.01"
              value={chipInput}
              onChange={handleChipInputChange}
              className="w-full pl-8 pr-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="2.50"
            />
          </div>
        </div>
      </div>

      {/* 3. Valor do Retorno da Mesa / Multiplicador por Vitória */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            3. Regra de Retorno da Mesa (Multiplicador de Vitória):
          </label>
          <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
            Retorno: R$ {grossReturn.toFixed(2)} por acerto
          </span>
        </div>

        {/* Preset Payout Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 36x Standard */}
          <button
            type="button"
            onClick={() => handleSelectPayoutMode('36x')}
            className={`p-2 rounded-xl text-left border transition-all ${
              payoutMode === '36x'
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-black flex items-center justify-between">
              <span>36x (Pleno Padrão 35:1)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Padrão</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Aposta R$ {totalBet.toFixed(2)} ➔ Retorno <strong>R$ {(chipValue * 36).toFixed(2)}</strong> (+R$ {(chipValue * 36 - totalBet).toFixed(2)} lucro)
            </div>
          </button>

          {/* 30x Lightning/Quantum Base */}
          <button
            type="button"
            onClick={() => handleSelectPayoutMode('30x')}
            className={`p-2 rounded-xl text-left border transition-all ${
              payoutMode === '30x'
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-black flex items-center justify-between">
              <span>30x (Lightning / Quantum)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Base</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Aposta R$ {totalBet.toFixed(2)} ➔ Retorno <strong>R$ {(chipValue * 30).toFixed(2)}</strong> (+R$ {(chipValue * 30 - totalBet).toFixed(2)} lucro)
            </div>
          </button>

          {/* 1:1 Paritário */}
          <button
            type="button"
            onClick={() => handleSelectPayoutMode('1:1')}
            className={`p-2 rounded-xl text-left border transition-all ${
              payoutMode === '1:1'
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-black flex items-center justify-between">
              <span>1:1 (Um para Um)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">100% Lucro</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Aposta R$ {totalBet.toFixed(2)} ➔ Retorno <strong>R$ {(totalBet * 2).toFixed(2)}</strong> (+R$ {totalBet.toFixed(2)} lucro)
            </div>
          </button>
        </div>

        {/* Custom Inputs for Multiplier and Return in R$ */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 mt-2">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Personalizar Valores do Retorno da Mesa:
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Input Multiplicador */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">
                Multiplicador da Ficha no Pleno (x):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={multInput}
                  onChange={handleMultInputChange}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                  placeholder="36"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">x por ficha</span>
              </div>
            </div>

            {/* Input Retorno em R$ */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">
                OU Retorno Total por Vitória (R$):
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="1.00"
                  min="0.1"
                  value={returnInput}
                  onChange={handleReturnInputChange}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  placeholder="90.00"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Table Financial Simulation Summary */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Settings2 className="w-3.5 h-3.5" />
            Simulação da Sua Mesa Atual:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Ficha: R$ {chipValue.toFixed(2)} | Retorno: {tableMult.toFixed(1)}x
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-sans">Aposta Total ({numHouses} casas)</span>
            <span className="text-xs font-black text-slate-200">R$ {totalBet.toFixed(2)}</span>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
            <span className="text-[9px] text-slate-400 block font-sans">Retorno Bruto no WIN</span>
            <span className="text-xs font-black text-indigo-400">R$ {grossReturn.toFixed(2)}</span>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30 col-span-2 sm:col-span-1">
            <span className="text-[9px] text-emerald-400/80 block font-sans">Lucro Líquido no WIN</span>
            <span className="text-xs font-black text-emerald-400">
              +{netProfitOnWin >= 0 ? `R$ ${netProfitOnWin.toFixed(2)}` : `R$ ${netProfitOnWin.toFixed(2)}`} (+{profitUnits}u)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
