import React from 'react';
import { Flame, Snowflake, AlertCircle, Palette, Bot, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TempItem } from '../types';

interface TemperaturesPanelProps {
  dozenItems: TempItem[];
  columnItems: TempItem[];
  colorItems?: TempItem[];
}

const renderTop3Badges = (top3: number[] = []) => {
  return (
    <div className="flex items-center justify-center gap-0.5 font-mono text-[9px]">
      {top3.map((val, idx) => (
        <span
          key={idx}
          className={`px-1 py-0.5 rounded font-extrabold border leading-none ${
            idx === 0 && val > 0
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : val > 0
              ? 'bg-slate-950 text-slate-300 border-slate-800'
              : 'bg-slate-950/40 text-slate-600 border-slate-800/40'
          }`}
          title={`${idx + 1}º maior atraso registrado: ${val} giros`}
        >
          {val > 0 ? `${val}x` : '-'}
        </span>
      ))}
    </div>
  );
};

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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {/* 🌡️ Temperatura das Dúzias */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2.5 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">
                TEMPERATURA DAS DÚZIAS
              </h3>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Bot className="w-2.5 h-2.5 text-amber-400" /> BOT DÚZIAS
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 font-bold uppercase text-[9px] tracking-tight">
                  <th className="py-1.5 px-1">Dúzia</th>
                  <th className="py-1.5 px-0.5 text-center">Freq.</th>
                  <th className="py-1.5 px-0.5 text-center">Atraso</th>
                  <th className="py-1.5 px-0.5 text-center">Top 3</th>
                  <th className="py-1.5 px-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-semibold">
                {dozenItems.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-1 text-slate-200 font-bold text-[11px] whitespace-nowrap">{item.name}</td>
                    <td className="py-2 px-0.5 text-center text-slate-300">
                      <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 font-mono text-[10px]">
                        {item.frequencyPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-0.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[11px] ${
                        item.spinsWithoutHit >= 8
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'text-slate-300'
                      }`}>
                        {item.spinsWithoutHit}
                      </span>
                    </td>
                    <td className="py-2 px-0.5 text-center">
                      {renderTop3Badges(item.top3AbsenceStreaks)}
                    </td>
                    <td className="py-2 px-1 text-right">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-extrabold text-[9px] leading-none ${
                        item.status === 'ALERT'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : item.status === 'HOT'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.status === 'ALERT' && <AlertCircle className="w-2.5 h-2.5" />}
                        {item.status === 'HOT' && <Flame className="w-2.5 h-2.5" />}
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
        <div className={`mt-2.5 p-2 rounded-lg border text-[11px] font-semibold flex items-start gap-1.5 ${
          hasDozenAlert
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasDozenAlert ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[10px] flex items-center gap-1 text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              Bot de Dúzias:
            </div>
            {hasDozenAlert ? (
              <span className="text-rose-300 leading-tight block text-[10px]">
                🚨 <strong>ALERTA DE DÚZIA ATRASADA:</strong> Entrada recomendada na <strong>{alertDozen.name}</strong> (Atrasada há {alertDozen.spinsWithoutHit} giros! Top 3: {alertDozen.top3AbsenceStreaks?.map(s => `${s}x`).join(', ')}).
              </span>
            ) : (
              <span className="text-slate-400 leading-tight block text-[10px]">
                Frequência equilibrada. Monitorando atrasos.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🌡️ Temperatura das Colunas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2.5 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">
                TEMPERATURA DAS COLUNAS
              </h3>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 shrink-0">
              <Bot className="w-2.5 h-2.5 text-cyan-400" /> BOT COLUNAS
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 font-bold uppercase text-[9px] tracking-tight">
                  <th className="py-1.5 px-1">Coluna</th>
                  <th className="py-1.5 px-0.5 text-center">Freq.</th>
                  <th className="py-1.5 px-0.5 text-center">Atraso</th>
                  <th className="py-1.5 px-0.5 text-center">Top 3</th>
                  <th className="py-1.5 px-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-semibold">
                {columnItems.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-1 text-slate-200 font-bold text-[11px] whitespace-nowrap">{item.name}</td>
                    <td className="py-2 px-0.5 text-center text-slate-300">
                      <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 font-mono text-[10px]">
                        {item.frequencyPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-0.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded font-black text-[11px] ${
                        item.spinsWithoutHit >= 8
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'text-slate-300'
                      }`}>
                        {item.spinsWithoutHit}
                      </span>
                    </td>
                    <td className="py-2 px-0.5 text-center">
                      {renderTop3Badges(item.top3AbsenceStreaks)}
                    </td>
                    <td className="py-2 px-1 text-right">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-extrabold text-[9px] leading-none ${
                        item.status === 'COLD'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : item.status === 'HOT'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.status === 'COLD' && <Snowflake className="w-2.5 h-2.5" />}
                        {item.status === 'HOT' && <Flame className="w-2.5 h-2.5" />}
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
        <div className={`mt-2.5 p-2 rounded-lg border text-[11px] font-semibold flex items-start gap-1.5 ${
          hasColumnAlert
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasColumnAlert ? (
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[10px] flex items-center gap-1 text-cyan-300 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              Bot de Colunas:
            </div>
            {hasColumnAlert ? (
              <span className="text-cyan-200 leading-tight block text-[10px]">
                🚨 <strong>ALERTA DE COLUNA ATRASADA:</strong> Entrada sugerida na <strong>{alertColumn.name}</strong> (Atrasada há {alertColumn.spinsWithoutHit} giros! Top 3: {alertColumn.top3AbsenceStreaks?.map(s => `${s}x`).join(', ')}).
              </span>
            ) : (
              <span className="text-slate-400 leading-tight block text-[10px]">
                Colunas equilibradas. Aguardando gatilhos.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🎨 Porcentagem de Cores e Zero */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl md:col-span-2 xl:col-span-1 flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2.5 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">
                PORCENTAGEM CORES & ZERO
              </h3>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1 shrink-0">
              <Bot className="w-2.5 h-2.5 text-purple-400" /> BOT CORES & ZERO
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 font-bold uppercase text-[9px] tracking-tight">
                  <th className="py-1.5 px-1">Cor / Zero</th>
                  <th className="py-1.5 px-0.5 text-center">Freq.</th>
                  <th className="py-1.5 px-0.5 text-center">Atraso</th>
                  <th className="py-1.5 px-0.5 text-center">Top 3</th>
                  <th className="py-1.5 px-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-semibold">
                {colorItems.map((item) => {
                  const isRed = item.code === 'red';
                  const isBlack = item.code === 'black';

                  return (
                    <tr key={item.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-1 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm shrink-0 ${
                              isRed
                                ? 'bg-rose-500 shadow-rose-500/50'
                                : isBlack
                                ? 'bg-slate-900 border border-slate-700'
                                : 'bg-emerald-500 shadow-emerald-500/50'
                            }`}
                          />
                          <span className={`font-bold text-[11px] ${
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
                      <td className="py-2 px-0.5 text-center text-slate-300">
                        <span className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 font-mono text-[10px] font-bold">
                          {item.frequencyPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-0.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-black text-[11px] ${
                          item.spinsWithoutHit >= 6
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'text-slate-300'
                        }`}>
                          {item.spinsWithoutHit}
                        </span>
                      </td>
                      <td className="py-2 px-0.5 text-center">
                        {renderTop3Badges(item.top3AbsenceStreaks)}
                      </td>
                      <td className="py-2 px-1 text-right">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-extrabold text-[9px] leading-none ${
                          item.status === 'ALERT'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : item.status === 'HOT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.status === 'ALERT' && <AlertCircle className="w-2.5 h-2.5" />}
                          {item.status === 'HOT' && <Flame className="w-2.5 h-2.5" />}
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
        <div className={`mt-2.5 p-2 rounded-lg border text-[11px] font-semibold flex items-start gap-1.5 ${
          hasZeroAlert || hasColorAlert
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          {hasZeroAlert ? (
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          ) : hasColorAlert ? (
            <AlertCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-extrabold text-[10px] flex items-center gap-1 text-purple-300 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              Bot de Cores & Zero:
            </div>
            {hasZeroAlert ? (
              <span className="text-emerald-300 leading-tight block text-[10px]">
                🟢 <strong>PROTEÇÃO DE ZERO:</strong> Zero atrasado há <strong>{zeroItem?.spinsWithoutHit} giros</strong>! (Top 3: {zeroItem?.top3AbsenceStreaks?.map(s => `${s}x`).join(', ')}).
              </span>
            ) : hasColorAlert && delayedColor ? (
              <span className="text-purple-200 leading-tight block text-[10px]">
                🚨 <strong>ATRASO DE COR:</strong> <strong>{delayedColor.name}</strong> atrasada há {delayedColor.spinsWithoutHit} giros (Top 3: {delayedColor.top3AbsenceStreaks?.map(s => `${s}x`).join(', ')}).
              </span>
            ) : (
              <span className="text-slate-400 leading-tight block text-[10px]">
                Proporção de cores estável. Zero sob controle.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


