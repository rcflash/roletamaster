import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Save,
  Trash2,
  Edit3,
  Eye,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Hash,
  Download,
  PlusCircle,
  Clock,
  Dices,
  BarChart3,
  Flame,
  X
} from 'lucide-react';
import { SpinRecord, SavedRouletteSession, StrategyConfig } from '../types';

interface SavedSessionsPanelProps {
  currentSpins: SpinRecord[];
  initialBankroll: number;
  strategy?: StrategyConfig;
  onLoadSessionToTable: (spins: SpinRecord[]) => void;
  onClearTableSpins?: () => void;
}

const STORAGE_KEY_SAVED_SESSIONS = 'roleta_master_saved_sessions_v1';

export const SavedSessionsPanel: React.FC<SavedSessionsPanelProps> = ({
  currentSpins,
  initialBankroll,
  strategy,
  onLoadSessionToTable,
  onClearTableSpins,
}) => {
  const [savedSessions, setSavedSessions] = useState<SavedRouletteSession[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SAVED_SESSIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'session-demo-1',
        title: 'Mesa Immersive - Estratégia Vizinhos (Tarde)',
        date: new Date(Date.now() - 86400000 * 1).toLocaleDateString('pt-BR'),
        timestamp: Date.now() - 86400000 * 1,
        tableName: 'Roleta Immersive VIP',
        strategyName: 'Vizinhos do Cilindro (Raio 2)',
        initialBankroll: 100,
        finalBankroll: 180,
        netProfit: 80,
        totalSpins: 32,
        winCount: 20,
        lossCount: 12,
        winRatePct: 62.5,
        notes: 'Sessão com boa sequência de acertos no setor zero e orphelins.',
        spins: currentSpins.slice(0, 15),
      },
    ];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SESSIONS, JSON.stringify(savedSessions));
    } catch (e) {
      console.error(e);
    }
  }, [savedSessions]);

  // Modal for saving current active session
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [tableNameInput, setTableNameInput] = useState<string>('Roleta Brasileira / VIP');
  const [strategyNameInput, setStrategyNameInput] = useState<string>(strategy?.activePreset || 'Vizinhos do Cilindro');
  const [sessionNotesInput, setSessionNotesInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Modal for viewing session details
  const [selectedSession, setSelectedSession] = useState<SavedRouletteSession | null>(null);

  // Modal for editing existing session title/notes
  const [editingSession, setEditingSession] = useState<SavedRouletteSession | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Current session metrics preview
  const currentNetProfit = currentSpins.reduce((acc, s) => acc + s.netResult, 0);
  const currentWins = currentSpins.filter((s) => s.netResult > 0).length;
  const currentLosses = currentSpins.filter((s) => s.netResult < 0).length;
  const currentTotal = currentSpins.length;
  const currentWinRate = currentTotal > 0 ? (currentWins / currentTotal) * 100 : 0;

  // Open Save Modal
  const handleOpenSaveModal = () => {
    const defaultTitle = `Sessão Roleta - ${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;
    setSessionTitle(defaultTitle);
    setShowSaveModal(true);
  };

  // Execute Save Current Session
  const handleSaveCurrentSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSpins.length === 0) return;

    const newSession: SavedRouletteSession = {
      id: `session-${Date.now()}`,
      title: sessionTitle || `Sessão ${new Date().toLocaleDateString('pt-BR')}`,
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      tableName: tableNameInput || 'Mesa Padrão',
      strategyName: strategyNameInput || 'Estratégia Padrão',
      initialBankroll: initialBankroll,
      finalBankroll: initialBankroll + currentNetProfit,
      netProfit: currentNetProfit,
      totalSpins: currentTotal,
      winCount: currentWins,
      lossCount: currentLosses,
      winRatePct: currentWinRate,
      spins: [...currentSpins],
      notes: sessionNotesInput || 'Sessão salva manualmente para análises futuras.',
    };

    setSavedSessions((prev) => [newSession, ...prev]);
    setShowSaveModal(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sessão salva do histórico?')) {
      setSavedSessions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSession?.id === id) setSelectedSession(null);
    }
  };

  // Start Editing
  const handleStartEdit = (session: SavedRouletteSession) => {
    setEditingSession(session);
    setEditTitle(session.title);
    setEditNotes(session.notes || '');
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    setSavedSessions((prev) =>
      prev.map((s) =>
        s.id === editingSession.id
          ? {
              ...s,
              title: editTitle || s.title,
              notes: editNotes,
            }
          : s
      )
    );
    setEditingSession(null);
  };

  // Re-load session back to active table
  const handleLoadSession = (session: SavedRouletteSession) => {
    if (
      currentSpins.length > 0 &&
      !confirm('Carregar esta sessão irá substituir os giros atuais da mesa. Deseja continuar?')
    ) {
      return;
    }

    onLoadSessionToTable(session.spins);
    alert(`Sessão "${session.title}" recarregada com sucesso na mesa! (${session.spins.length} giros)`);
  };

  // Summary Metrics across all saved sessions
  const totalSavedSessionsCount = savedSessions.length;
  const totalNetProfitAllSessions = savedSessions.reduce((acc, s) => acc + s.netProfit, 0);
  const totalSpinsAllSessions = savedSessions.reduce((acc, s) => acc + s.totalSpins, 0);
  const totalWinsAllSessions = savedSessions.reduce((acc, s) => acc + s.winCount, 0);
  const avgWinRateAll = totalSpinsAllSessions > 0 ? (totalWinsAllSessions / totalSpinsAllSessions) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <FolderArchive className="w-3.5 h-3.5" /> Repositório de Sessões
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                Histórico & Análises de Mesas Passadas
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Sessões Salvas da Roleta
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Sempre que terminar uma mesa ou for começar uma nova sessão do zero, grave aqui os giros e métricas para consultar o desempenho histórico, estatísticas e recarregar quando quiser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleOpenSaveModal}
              disabled={currentSpins.length === 0}
              className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>Gravar Sessão Atual da Mesa ({currentSpins.length} giros)</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sessão gravada com sucesso! Você pode consultá-la na lista abaixo quando desejar.</span>
          </div>
        )}
      </div>

      {/* Global Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Sessões</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-400">{totalSavedSessionsCount} sessões</span>
          <span className="text-[10px] text-slate-500 block">Arquivadas para estudo</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Total Acumulado</span>
          <span className={`text-xl sm:text-2xl font-black ${totalNetProfitAllSessions >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalNetProfitAllSessions >= 0 ? '+' : ''}R$ {totalNetProfitAllSessions.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">Soma de todas as sessões</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Giros Registrados</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400">{totalSpinsAllSessions} giros</span>
          <span className="text-[10px] text-slate-500 block">Amostragem histórica</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Acerto Geral</span>
          <span className="text-xl sm:text-2xl font-black text-teal-400">{avgWinRateAll.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block">Media % de greens</span>
        </div>
      </div>

      {/* Lista de Sessões Salvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Histórico Guardado</span>
              <h3 className="text-lg font-black text-slate-100">Sessões Gravadas de Roleta</h3>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-bold">{savedSessions.length} sessões encontradas</span>
        </div>

        {savedSessions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <FolderArchive className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-bold text-sm">Nenhuma sessão gravada até o momento.</p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Adicione giros na mesa e clique no botão verde <strong>"Gravar Sessão Atual da Mesa"</strong> para guardar os dados antes de iniciar uma nova rodada!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedSessions.map((session) => {
              const isProfit = session.netProfit >= 0;

              return (
                <div
                  key={session.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl transition-all relative group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-amber-400 font-bold text-[10px] rounded-md border border-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {session.date}
                        </span>
                        {session.tableName && (
                          <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-bold text-[10px] rounded-md border border-indigo-500/20">
                            {session.tableName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {session.title}
                      </h4>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${
                        isProfit
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isProfit ? '+' : ''}R$ {session.netProfit.toFixed(2)}
                    </span>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/80 p-3 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Giros</span>
                      <span className="text-sm font-mono font-black text-slate-200">{session.totalSpins}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Greens / Reds</span>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {session.winCount} <span className="text-slate-500">/</span> <span className="text-rose-400">{session.lossCount}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Taxa Acerto</span>
                      <span className="text-sm font-mono font-black text-teal-400">{session.winRatePct.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {session.notes && (
                    <p className="text-xs text-slate-400 italic line-clamp-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40">
                      "{session.notes}"
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Detalhes ({session.spins.length})
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLoadSession(session)}
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title="Carregar esta sessão de volta para a mesa de jogo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurar Mesa
                      </button>

                      <button
                        onClick={() => handleStartEdit(session)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        title="Editar nome ou notas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs transition-colors"
                        title="Excluir sessão salva"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE GRAVAÇÃO DE SESSÃO */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Save className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-100">Gravar Sessão Atual da Mesa</h3>
              </div>

              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preview of Session */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Total de Giros</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{currentTotal}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Resultado</span>
                <span className={`font-mono font-bold text-sm ${currentNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currentNetProfit >= 0 ? '+' : ''}R$ {currentNetProfit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Acertos</span>
                <span className="font-mono font-bold text-teal-400 text-sm">{currentWinRate.toFixed(1)}%</span>
              </div>
            </div>

            <form onSubmit={handleSaveCurrentSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Título da Sessão:</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Mesa / Cassino:</label>
                  <input
                    type="text"
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: Roleta Brasileira"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Estratégia Usada:</label>
                  <input
                    type="text"
                    value={strategyNameInput}
                    onChange={(e) => setStrategyNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: Vizinhos do Cilindro"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Observações / Anotações:</label>
                <textarea
                  value={sessionNotesInput}
                  onChange={(e) => setSessionNotesInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: Padrão forte na dezena 2 e coluna 1. Bateu meta rapidamente."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Salvar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE SESSÃO SALVA */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-100 border-b border-slate-800 pb-2">Editar Sessão Salva</h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Título:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notas / Observações:</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-black uppercase rounded-xl shadow"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO COMPLETA DA SESSÃO */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Análise de Sessão Guardada</span>
                <h3 className="text-xl font-black text-slate-100">{selectedSession.title}</h3>
                <span className="text-xs text-slate-400">{selectedSession.date} • {selectedSession.tableName || 'Mesa Padrão'}</span>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Resultado Líquido</span>
                <span className={`text-base font-black ${selectedSession.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedSession.netProfit >= 0 ? '+' : ''}R$ {selectedSession.netProfit.toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Giros</span>
                <span className="text-base font-black text-amber-400">{selectedSession.totalSpins}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Greens / Reds</span>
                <span className="text-base font-black text-emerald-400">
                  {selectedSession.winCount} <span className="text-slate-500">/</span> <span className="text-rose-400">{selectedSession.lossCount}</span>
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Taxa de Acerto</span>
                <span className="text-base font-black text-teal-400">{selectedSession.winRatePct.toFixed(1)}%</span>
              </div>
            </div>

            {selectedSession.notes && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300">
                <strong>Notas:</strong> {selectedSession.notes}
              </div>
            )}

            {/* List of Spins in Session */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Histórico de Giros nesta Sessão</h4>
              <div className="overflow-x-auto max-h-[260px] overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Giro</th>
                      <th className="py-2 px-3">Número</th>
                      <th className="py-2 px-3">Sugestão</th>
                      <th className="py-2 px-3">Retorno</th>
                      <th className="py-2 px-3">Resultado</th>
                      <th className="py-2 px-3">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {selectedSession.spins.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-mono text-slate-400">#{s.giro}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${
                              s.color === 'red' ? 'bg-rose-600' : s.color === 'black' ? 'bg-slate-800 border border-slate-700' : 'bg-emerald-600'
                            }`}
                          >
                            {s.numero}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{s.nextBetSuggestion || '-'}</td>
                        <td className="py-2 px-3 font-mono text-indigo-300">{s.winAmount > 0 ? `R$ ${s.winAmount.toFixed(2)}` : '-'}</td>
                        <td className="py-2 px-3">
                          {s.netResult > 0 ? (
                            <span className="text-emerald-400 font-bold">+R$ {s.netResult.toFixed(2)}</span>
                          ) : s.netResult < 0 ? (
                            <span className="text-rose-400 font-bold">R$ {s.netResult.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-500">Amostragem</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-300">R$ {s.accumulatedBalance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-4">
              <button
                onClick={() => handleLoadSession(selectedSession)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar esta Sessão na Mesa Principal
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
