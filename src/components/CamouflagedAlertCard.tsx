import React from 'react';
import { Dices, Sparkles, Zap, HelpCircle, Eye, Crosshair, ArrowRight } from 'lucide-react';
import { SpinRecord, StrategyConfig } from '../types';
import { getNumberColor } from '../lib/roulette';
import {
  calculateCamouflagedAlert,
  getTerminalOfNumber,
  getRepresentedTerminals,
  getHorseFamilyOfNumber,
  HORSE_FAMILIES_DATA
} from '../lib/camouflagedStrategy';

interface CamouflagedAlertCardProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
  onNavigateToPanel?: () => void;
}

export const CamouflagedAlertCard: React.FC<CamouflagedAlertCardProps> = ({
  spins,
  strategy,
  onUpdateStrategy,
  onNavigateToPanel,
}) => {
  const chipValue = strategy?.neighborChipValue || 2.5;
  const alertData = calculateCamouflagedAlert(spins, 'smart', chipValue);

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const targetNum = lastSpin ? lastSpin.numero : 0;
  const targetTerminal = getTerminalOfNumber(targetNum);
  const targetFamily = getHorseFamilyOfNumber(targetNum);
  const represented = getRepresentedTerminals(targetNum);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2 border-b border-amber-500/20 pb-1.5 flex-wrap gap-1.5">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
              ALERTA DE NÚMEROS CAMUFLADOS
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {HORSE_FAMILIES_DATA[targetFamily].name}
            </span>
          </div>
        </div>

        {/* Target info */}
        <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 mb-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              Último Número: <span className="text-amber-400 font-extrabold text-sm">#{targetNum}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Terminal {targetTerminal} • Camufla [{represented.map(t=>`T${t}`).join(', ')}])
              </span>
            </span>
            {alertData?.hasAlert ? (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                SINAL ATIVO 🔥
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                MONITORANDO
              </span>
            )}
          </div>

          {/* Numbers preview */}
          {alertData && (
            <div className="flex items-center justify-center gap-1 flex-wrap py-1">
              {alertData.betNumbers.slice(0, 14).map((num) => {
                const isCenter = num === targetNum;
                const colorType = getNumberColor(num);
                let colorStyle = 'bg-slate-950 border-slate-700/80 text-white';
                if (colorType === 'red') {
                  colorStyle = 'bg-rose-600/90 border-rose-500/90 text-white';
                } else if (colorType === 'green') {
                  colorStyle = 'bg-emerald-600 border-emerald-400 text-white';
                }

                return (
                  <div
                    key={`cam-chip-${num}`}
                    className={`flex items-center justify-center rounded-lg px-2 py-0.5 text-xs transition-all border ${colorStyle} ${
                      isCenter ? 'ring-2 ring-amber-400 font-black shadow-md scale-105' : 'font-bold'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
              {alertData.betNumbers.length > 14 && (
                <span className="text-[10px] text-slate-400 font-bold">
                  +{alertData.betNumbers.length - 14} casas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Message box */}
        <div
          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-2 mb-2 ${
            alertData?.hasAlert
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          {alertData?.hasAlert ? (
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-[11px] leading-tight">
              {alertData?.reason || 'Monitore a sequência de terminais e famílias de cavalos para ativar a entrada.'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
        {alertData ? (
          <span className="text-amber-400 font-bold">
            Aposta {alertData.betNumbersCount} casas: R$ {alertData.estimatedCost.toFixed(2)} | Retorno: R$ {alertData.expectedGrossReturn.toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-400">Aguardando entrada</span>
        )}

        {onNavigateToPanel && (
          <button
            onClick={onNavigateToPanel}
            className="flex items-center gap-1 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Ver Painel Completo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
