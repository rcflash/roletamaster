import React from 'react';
import { Flame, Snowflake, AlertCircle } from 'lucide-react';
import { TempItem } from '../types';

interface TemperaturesPanelProps {
  dozenItems: TempItem[];
  columnItems: TempItem[];
}

export const TemperaturesPanel: React.FC<TemperaturesPanelProps> = ({
  dozenItems,
  columnItems,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 🌡️ Temperatura das Dúzias */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ 🌡️ TEMPERATURA DAS DÚZIAS
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2 px-2">Dúzia</th>
                <th className="py-2 px-2 text-center">Frequência</th>
                <th className="py-2 px-2 text-center">Giros sem Sair</th>
                <th className="py-2 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {dozenItems.map((item) => (
                <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-2 text-slate-200 font-bold">{item.name}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.frequencyPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded font-black ${
                      item.spinsWithoutHit >= 8
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'text-slate-300'
                    }`}>
                      {item.spinsWithoutHit}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      item.status === 'ALERT'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : item.status === 'HOT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.status === 'ALERT' && <AlertCircle className="w-3 h-3" />}
                      {item.status === 'HOT' && <Flame className="w-3 h-3" />}
                      {item.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌡️ Temperatura das Colunas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
          <Snowflake className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ 🌡️ TEMPERATURA DAS COLUNAS
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2 px-2">Coluna</th>
                <th className="py-2 px-2 text-center">Frequência</th>
                <th className="py-2 px-2 text-center">Contagem</th>
                <th className="py-2 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {columnItems.map((item) => (
                <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-2 text-slate-200 font-bold">{item.name}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.frequencyPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{item.count}</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      item.status === 'COLD'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : item.status === 'HOT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.status === 'COLD' && <Snowflake className="w-3 h-3" />}
                      {item.status === 'HOT' && <Flame className="w-3 h-3" />}
                      {item.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
