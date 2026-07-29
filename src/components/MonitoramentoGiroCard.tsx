import React from 'react';
import { Radar, Activity } from 'lucide-react';
import { SpinRecord } from '../types';
import { calculateTemperatures } from '../lib/roulette';

interface MonitoramentoGiroCardProps {
  spins: SpinRecord[];
}

export const MonitoramentoGiroCard: React.FC<MonitoramentoGiroCardProps> = ({ spins }) => {
  const temps = calculateTemperatures(spins);
  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;

  const alertDozen = temps.dozenItems.find((d) => d.status === 'ALERT');
  const alertCol = temps.columnItems.find((c) => c.status === 'ALERT');

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/30 relative shrink-0">
            <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> MONITORAMENTO GIRO A GIRO ATIVO
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono font-extrabold rounded-full border border-slate-700">
                {spins.length} Giros Registrados
              </span>
            </div>
            <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
              {lastSpin ? (
                <>
                  Último Giro registrado: <strong className="text-amber-400 font-mono">#{lastSpin.giro} (Nº {lastSpin.numero})</strong> — O algoritmo reavaliou todas as probabilidades e tendências instantaneamente!
                </>
              ) : (
                'Insira ou Cole giros para iniciar o radar de mudança de direção.'
              )}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-xl text-right shrink-0 w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Status da Mesa</span>
          <span className="text-xs font-black text-amber-300 flex items-center justify-start sm:justify-end gap-1 mt-0.5">
            {alertDozen || alertCol ? '⚠️ MUDANÇA DE PADRÃO DETECTADA' : '🟢 TENDÊNCIA ESTÁVEL'}
          </span>
        </div>
      </div>
    </div>
  );
};
