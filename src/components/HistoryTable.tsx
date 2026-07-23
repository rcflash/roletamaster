import React, { useState } from 'react';
import { History, Trash2, Plus, Filter, FileSpreadsheet, Search, ArrowUpDown, Copy, Check, Download, Share2, Sparkles } from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';

interface HistoryTableProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onDeleteSpin: (id: string) => void;
  onEditSpin: (spin: SpinRecord) => void;
  onAddCustomSpin: (number: number, winAmount: number, lossAmount: number) => void;
  onClearAllSpins?: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  spins,
  config,
  onDeleteSpin,
  onAddCustomSpin,
  onClearAllSpins,
}) => {
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchNum, setSearchNum] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [newNum, setNewNum] = useState<number>(0);
  const [newWin, setNewWin] = useState<number>(30);
  const [newLoss, setNewLoss] = useState<number>(15);

  const filteredSpins = spins.filter((s) => {
    if (filterColor !== 'all' && s.color !== filterColor) return false;
    if (filterStatus !== 'all' && s.cycleStatus !== filterStatus) return false;
    if (searchNum.trim() !== '' && s.numero.toString() !== searchNum.trim()) return false;
    return true;
  });

  const sortedSpins = [...filteredSpins].sort((a, b) => {
    return sortOrder === 'desc' ? b.giro - a.giro : a.giro - b.giro;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomSpin(newNum, newWin, newLoss);
    setShowAddModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      {/* Header & Sheet Reference Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                HISTÓRICO DA PLANILHA (COLUNA B)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-black text-emerald-400 font-mono">
                {spins.length} GIROS REGISTRADOS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Valores equivalentes à Coluna B do Histórico. Cada número lançado atualiza estatísticas e alertas do bot.
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar Nº..."
              value={searchNum}
              onChange={(e) => setSearchNum(e.target.value)}
              className="w-20 bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-bold cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todas as Cores</option>
              <option value="red" className="bg-slate-900">Vermelho</option>
              <option value="black" className="bg-slate-900">Preto</option>
              <option value="green" className="bg-slate-900">Verde (Zero)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-bold cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todos os Status</option>
              <option value="WIN" className="bg-slate-900">Somente WIN</option>
              <option value="LOSS" className="bg-slate-900">Somente LOSS</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
              title="Ordem de exibição dos giros no histórico"
            >
              <option value="desc" className="bg-slate-900 text-slate-200">
                Último Giro Primeiro (Decrescente)
              </option>
              <option value="asc" className="bg-slate-900 text-slate-200">
                Primeiro Giro Primeiro (Crescente)
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
            title="Copiar ou baixar todos os giros registrados para colar no chat do assistente"
          >
            <Copy className="w-4 h-4" /> Copiar / Exportar (Chat)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Giro Manual
          </button>

          {spins.length > 0 && onClearAllSpins && (
            <button
              onClick={onClearAllSpins}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              title="Limpar toda a base de dados para iniciar uma nova mesa"
            >
              <Trash2 className="w-4 h-4" /> Limpar Base
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th 
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                title="Clique para alternar a ordenação dos giros"
              >
                <div className="flex items-center gap-1">
                  <span>Giro (Col A)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="py-3 px-4 text-emerald-400 bg-emerald-500/10 border-x border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                title="Clique para alternar a ordenação dos giros"
              >
                <div className="flex items-center gap-1">
                  <span>Número (Coluna B) ★</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                </div>
              </th>
              <th className="py-3 px-4">Cor</th>
              <th className="py-3 px-4">Dúzia</th>
              <th className="py-3 px-4">Coluna</th>
              <th className="py-3 px-4">Par/Ímpar</th>
              <th className="py-3 px-4 text-right">Ganho</th>
              <th className="py-3 px-4 text-right">Perda</th>
              <th className="py-3 px-4 text-right">Resultado</th>
              <th className="py-3 px-4 text-right">Saldo Acumulado</th>
              <th className="py-3 px-4 text-center">Nível Bot</th>
              <th className="py-3 px-4">Sugestão de Aposta</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200 font-mono">
            {sortedSpins.length > 0 ? (
              sortedSpins.map((spin) => {
                const isWin = spin.cycleStatus === 'WIN';
                const isLoss = spin.cycleStatus === 'LOSS';

                return (
                  <tr key={spin.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-400">#{spin.giro}</td>
                    {/* Column B Highlight */}
                    <td className="py-3 px-4 bg-emerald-500/5 border-x border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm text-white shadow-md ${
                          spin.color === 'red'
                            ? 'bg-rose-600 border border-rose-400/30'
                            : spin.color === 'black'
                            ? 'bg-slate-950 border border-slate-700'
                            : 'bg-emerald-600 border border-emerald-400/40'
                        }`}>
                          {spin.numero}
                        </span>
                        {spin.multiplier && spin.multiplier > 1 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-sans">
                            {spin.multiplier}x
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold font-sans">
                      <span className={spin.color === 'red' ? 'text-rose-400' : spin.color === 'black' ? 'text-slate-300' : 'text-emerald-400'}>
                        {spin.color === 'red' ? 'VERMELHO' : spin.color === 'black' ? 'PRETO' : 'VERDE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {spin.dozen === '1a' ? '1ª Dúzia (1-12)' : spin.dozen === '2a' ? '2ª Dúzia (13-24)' : spin.dozen === '3a' ? '3ª Dúzia (25-36)' : 'Zero'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {spin.column === 'col1' ? 'Coluna 1' : spin.column === 'col2' ? 'Coluna 2' : spin.column === 'col3' ? 'Coluna 3' : 'Zero'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {spin.parity === 'par' ? 'PAR' : spin.parity === 'impar' ? 'ÍMPAR' : 'Zero'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {config.currency} {spin.winAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-400 font-bold">
                      {config.currency} {spin.lossAmount.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right font-black ${
                      spin.netResult > 0 ? 'text-emerald-400' : spin.netResult < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {spin.netResult > 0 ? '+' : ''}{config.currency} {spin.netResult.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-300">
                      {config.currency} {spin.accumulatedBalance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30 px-2 py-0.5 rounded-lg font-extrabold text-[10px]">
                        {spin.botLevel || 'N1'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans font-semibold truncate max-w-[220px]">
                      {spin.nextBetSuggestion || 'R$ 10 no VERMELHO'}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                        isWin
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {spin.cycleStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteSpin(spin.id)}
                        title="Excluir este giro"
                        className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-500 italic font-sans">
                  Nenhum giro registrado com os filtros informados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Spin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-800 pb-3">
              Adicionar Giro Manual ao Histórico
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-extrabold uppercase tracking-wider">
                  Número Sorteado (Coluna B: 0-36):
                </label>
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={newNum}
                  onChange={(e) => setNewNum(Math.min(36, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono font-black text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-extrabold uppercase tracking-wider">
                    Valor Ganho ({config.currency}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newWin}
                    onChange={(e) => setNewWin(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-extrabold uppercase tracking-wider">
                    Valor Apostado ({config.currency}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newLoss}
                    onChange={(e) => setNewLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  Registrar Giro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Exportar / Copiar Lançamentos para o Chat */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    Exportar / Copiar 300 Lançamentos
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {spins.length} giros gravados. Copie para colar na nossa conversa do Chat!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Escolha um formato abaixo e clique em <strong className="text-emerald-400">Copiar</strong>. Depois, basta colar (<kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono text-[10px]">Ctrl+V</kbd>) aqui na nossa conversa para que eu analise quais seriam as melhores estratégias!
            </p>

            {/* Formato 1: Sequência de Números Separados por Vírgula */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  1. Sequência Direta (Recomendado para o Chat)
                </span>
                <button
                  onClick={() => {
                    const rawNumbers = [...spins].sort((a, b) => a.giro - b.giro).map(s => s.numero).join(', ');
                    navigator.clipboard.writeText(`Lista de 300 giros da roleta:\n${rawNumbers}`);
                    setCopiedText('raw');
                    setTimeout(() => setCopiedText(null), 2500);
                  }}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow transition-all"
                >
                  {copiedText === 'raw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === 'raw' ? 'Copiado!' : 'Copiar Sequência'}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={[...spins].sort((a, b) => a.giro - b.giro).map(s => s.numero).join(', ')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[11px] font-mono text-slate-300 focus:outline-none resize-none"
              />
            </div>

            {/* Formato 2: Tabela / Lista com Giro */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  2. Lista Detalhada com Número do Giro
                </span>
                <button
                  onClick={() => {
                    const detailedList = [...spins]
                      .sort((a, b) => a.giro - b.giro)
                      .map(s => `Giro #${s.giro}: ${s.numero} (${s.color.toUpperCase()})`)
                      .join('\n');
                    navigator.clipboard.writeText(`Histórico detalhado da mesa:\n${detailedList}`);
                    setCopiedText('detailed');
                    setTimeout(() => setCopiedText(null), 2500);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                >
                  {copiedText === 'detailed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === 'detailed' ? 'Copiado!' : 'Copiar Detalhado'}
                </button>
              </div>
            </div>

            {/* Ações de Fechar / Download */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const rawNumbers = [...spins].sort((a, b) => a.giro - b.giro).map(s => s.numero).join(', ');
                  const blob = new Blob([`Histórico de Giros da Roleta (${spins.length} giros):\n\n${rawNumbers}`], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `historico_roleta_${spins.length}_giros.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-amber-400" /> Baixar TXT
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
