import React, { useState } from 'react';
import { X, Save, Sliders } from 'lucide-react';
import { BankrollConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BankrollConfig;
  onSaveConfig: (updated: BankrollConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<BankrollConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wide">
              CONFIGURAÇÃO DA BANCA E REGRAS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Moeda / Símbolo Monetário:
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="R$">R$ (Real Brasileiro)</option>
              <option value="$">$ (Dólar Americano)</option>
              <option value="€">€ (Euro)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Banca Inicial ({formData.currency}):
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.initialBankroll}
                onChange={(e) =>
                  setFormData({ ...formData, initialBankroll: Math.max(1, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Meta Diária ({formData.currency}):
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.dailyGoal}
                onChange={(e) =>
                  setFormData({ ...formData, dailyGoal: Math.max(1, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Stop Loss / Limite Perda ({formData.currency}):
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.stopLossLimit}
                onChange={(e) =>
                  setFormData({ ...formData, stopLossLimit: Math.max(1, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Custo Padrão por Giro ({formData.currency}):
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={formData.defaultSpinCost}
                onChange={(e) =>
                  setFormData({ ...formData, defaultSpinCost: Math.max(0.1, parseFloat(e.target.value) || 0) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow transition-colors"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
