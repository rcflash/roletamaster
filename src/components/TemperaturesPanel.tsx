import React from 'react';
import { Flame, Snowflake, AlertCircle, Palette } from 'lucide-react';
import { TempItem } from '../types';

interface TemperaturesPanelProps {
  dozenItems: TempItem[];
  columnItems: TempItem[];
  colorItems?: TempItem[];
}

export const TemperaturesPanel: React.FC<TemperaturesPanelProps> = ({
  dozenItems,
  columnItems,
  colorItems = [],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
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
                <th className="py-2 px-2 text-center">Giros sem Sair</th>
                <th className="py-2 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {columnItems.map((item) => (
                <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-2 text-slate-200 font-bold">{item.name}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
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

      {/* 🎨 Porcentagem de Cores e Zero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl md:col-span-2 xl:col-span-1">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
          <Palette className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ 🎨 PORCENTAGEM DE CORES E ZERO
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2 px-2">Cor / Zero</th>
                <th className="py-2 px-2 text-center">Frequência</th>
                <th className="py-2 px-2 text-center">Giros sem Sair</th>
                <th className="py-2 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {colorItems.map((item) => {
                const isRed = item.code === 'red';
                const isBlack = item.code === 'black';
                const isZero = item.code === 'green';

                return (
                  <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full inline-block shadow-sm ${
                            isRed
                              ? 'bg-rose-500 shadow-rose-500/50'
                              : isBlack
                              ? 'bg-slate-900 border border-slate-700'
                              : 'bg-emerald-500 shadow-emerald-500/50'
                          }`}
                        />
                        <span className={`font-bold ${
                          isRed
                            ? 'text-rose-400'
                            : isBlack
                            ? 'text-slate-200'
                            : 'text-emerald-400'
                        }`}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-300">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold">
                        {item.frequencyPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${
                        item.spinsWithoutHit >= 6
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

