import React from 'react';
import { Flame, Snowflake, AlertCircle, Palette, Bot, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
  // 🤖 Análise do Bot de Dúzias
  const alertDozen = dozenItems.reduce((prev, curr) => (curr.spinsWithoutHit > prev.spinsWithoutHit ? curr : prev), dozenItems[0] || { spinsWithoutHit: 0 });
  const hasDozenAlert = alertDozen && alertDozen.spinsWithoutHit >= 7;

  // 🤖 Análise do Bot de Colunas
  const alertColumn = columnItems.reduce((prev, curr) => (curr.spinsWithoutHit > prev.spinsWithoutHit ? curr : prev), columnItems[0] || { spinsWithoutHit: 0 });
  const hasColumnAlert = alertColumn && alertColumn.spinsWithoutHit >= 7;

  // 🤖 Análise do Bot de Cores e Zero
  const zeroItem = colorItems.find((c) => c.code === 'green');
  const redItem = colorItems.find((c) => c.code === 'red');
  const blackItem = colorItems.find((c) => c.code === 'black');

  const hasZeroAlert = zeroItem && zeroItem.spinsWithoutHit >= 30;
  const delayedColor = redItem && blackItem ? (redItem.spinsWithoutHit > blackItem.spinsWithoutHit ? redItem : blackItem) : null;
  const hasColorAlert = delayedColor && delayedColor.spinsWithoutHit >= 4;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* 🌡️ Temperatura das Dúzias */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                ▶ 🌡️ TEMPERATURA DAS DÚZIAS
              </h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Bot className="w-3 h-3 text-amber-400" /> BOT DÚZIAS
            </span>
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

        {/* 🤖 Bot Recomendação Dúzias */}
        <div className={`mt-3 p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-2 ${
          hasDozenAlert
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasDozenAlert ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[11px] flex items-center gap-1 text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Bot de Dúzias:
            </div>
            {hasDozenAlert ? (
              <span className="text-rose-300">
                🚨 <strong>ALERTA DE DÚZIA ATRASADA:</strong> Entrada recomendada na <strong>{alertDozen.name}</strong> (Atrasada há {alertDozen.spinsWithoutHit} giros! Payout 3x).
              </span>
            ) : (
              <span className="text-slate-400">
                Frequência de dúzias equilibrada. Monitorando atraso ≥ 7 giros.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🌡️ Temperatura das Colunas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                ▶ 🌡️ TEMPERATURA DAS COLUNAS
              </h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Bot className="w-3 h-3 text-cyan-400" /> BOT COLUNAS
            </span>
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

        {/* 🤖 Bot Recomendação Colunas */}
        <div className={`mt-3 p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-2 ${
          hasColumnAlert
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasColumnAlert ? (
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[11px] flex items-center gap-1 text-cyan-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Bot de Colunas:
            </div>
            {hasColumnAlert ? (
              <span className="text-cyan-200">
                🚨 <strong>ALERTA DE COLUNA ATRASADA:</strong> Entrada sugerida na <strong>{alertColumn.name}</strong> (Atrasada há {alertColumn.spinsWithoutHit} giros!).
              </span>
            ) : (
              <span className="text-slate-400">
                Colunas sem anomalia acentuada. Aguardando gatilho ≥ 7 giros.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🎨 Porcentagem de Cores e Zero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl md:col-span-2 xl:col-span-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                ▶ 🎨 PORCENTAGEM DE CORES E ZERO
              </h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-400" /> BOT CORES & ZERO
            </span>
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

        {/* 🤖 Bot Recomendação Cores & Zero */}
        <div className={`mt-3 p-2.5 rounded-lg border text-xs font-semibold flex items-start gap-2 ${
          hasZeroAlert || hasColorAlert
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasZeroAlert ? (
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : hasColorAlert ? (
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[11px] flex items-center gap-1 text-purple-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Bot de Cores & Zero:
            </div>
            {hasZeroAlert ? (
              <span className="text-emerald-300">
                🟢 <strong>PROTEÇÃO DE ZERO:</strong> O Zero está atrasado há <strong>{zeroItem?.spinsWithoutHit} giros</strong>! Sugerida aposta de proteção (Retorno 35:1).
              </span>
            ) : hasColorAlert && delayedColor ? (
              <span className="text-purple-200">
                🚨 <strong>SEQUÊNCIA/ATRASO DE COR:</strong> Cor <strong>{delayedColor.name}</strong> sem sair há {delayedColor.spinsWithoutHit} giros (Entrada 1:1).
              </span>
            ) : (
              <span className="text-slate-400">
                Proporção de cores estável. Zero sob controle normal.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

