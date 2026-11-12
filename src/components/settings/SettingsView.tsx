import React, { useState } from 'react';
import {
  Sliders,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, DEFAULT_WEIGHTS, DEFAULT_SETTINGS, AnalyticsWeights } from '../../types';
import { localDB } from '../../db/indexedDB';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onRefreshData,
}) => {
  const [weights, setWeights] = useState<AnalyticsWeights>(settings.weights);
  const [iterations, setIterations] = useState<number>(settings.monteCarloIterations);
  const [rho, setRho] = useState<number>(settings.dixonColesRho);
  const [homeAdv, setHomeAdv] = useState<number>(settings.homeAdvantageMultiplier);
  const [defaultSeason, setDefaultSeason] = useState<string>(settings.defaultSeason);

  const [saveMsg, setSaveMsg] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Calculate sum of weights for real-time normalized percentage display
  const sumWeights =
    weights.teamPerformance +
    weights.attackingPerformance +
    weights.defensivePerformance +
    weights.playerPerformance +
    weights.tacticalPerformance +
    weights.matchConditions +
    weights.historicalPerformance +
    weights.marketInformation || 1;

  const handleWeightChange = (key: keyof AnalyticsWeights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleSaveAllSettings = async () => {
    const newSettings: AppSettings = {
      weights,
      monteCarloIterations: Number(iterations) || 20000,
      dixonColesRho: Number(rho) || -0.04,
      homeAdvantageMultiplier: Number(homeAdv) || 1.15,
      defaultSeason,
      theme: 'dark',
    };
    await onSaveSettings(newSettings);
    setSaveMsg('Settings saved successfully.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // Full JSON Export
  const handleExportJSON = async () => {
    const jsonStr = await localDB.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epl_predict_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Full JSON Import
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await localDB.importBackupJSON(text);
      setImportStatus(
        `Imported: ${res.teams} teams, ${res.players} players, ${res.matches} matches, ${res.predictions} predictions.`
      );
      await onRefreshData();
    } catch (err: unknown) {
      setImportStatus(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON file'}`);
    }
  };

  // CSV Matches Export
  const handleExportCSV = async () => {
    const csvStr = await localDB.exportMatchesCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epl_predict_matches_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Wipe All Data
  const handleClearDatabase = async () => {
    if (
      window.confirm('WARNING: Are you sure you want to permanently clear all local EPL PREDICT data? This cannot be undone.')
    ) {
      if (window.confirm('Please confirm one more time: Wipe all teams, matches, and prediction records?')) {
        await localDB.clearAllData();
        await onRefreshData();
        alert('All local database records cleared.');
      }
    }
  };

  const weightFields: { key: keyof AnalyticsWeights; label: string }[] = [
    { key: 'teamPerformance', label: 'Team Performance' },
    { key: 'attackingPerformance', label: 'Attacking Performance' },
    { key: 'defensivePerformance', label: 'Defensive Performance' },
    { key: 'playerPerformance', label: 'Player Performance' },
    { key: 'tacticalPerformance', label: 'Tactical Performance' },
    { key: 'matchConditions', label: 'Match Conditions' },
    { key: 'historicalPerformance', label: 'Historical Performance' },
    { key: 'marketInformation', label: 'Market Information' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Analytical Weighting Engine */}
      <div className="bg-[#111822] border border-slate-800 rounded p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold font-mono uppercase text-white tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Analytical Weighting Engine</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Adjust relative analytical importance across the 8 prediction factors. Automatically normalized.
            </p>
          </div>
          <button
            onClick={handleResetWeights}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white bg-[#0a0e14] border border-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <div className="space-y-4">
          {weightFields.map((field) => {
            const rawVal = weights[field.key];
            const normPct = ((rawVal / sumWeights) * 100).toFixed(1);

            return (
              <div key={field.key} className="space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{field.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 tabular-nums">Weight: {rawVal}</span>
                    <span className="text-emerald-400 font-bold tabular-nums w-14 text-right">
                      {normPct}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={rawVal}
                    onChange={(e) => handleWeightChange(field.key, Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rawVal}
                    onChange={(e) => handleWeightChange(field.key, Number(e.target.value))}
                    className="w-16 bg-[#0a0e14] border border-slate-700 text-white rounded px-2 py-0.5 text-right tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model & Simulation Parameters */}
      <div className="bg-[#111822] border border-slate-800 rounded p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold font-mono uppercase text-white tracking-wider">
            Mathematical Engine Hyperparameters
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure Monte Carlo simulation runs and Dixon-Coles bivariate low-score adjustments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-slate-300 block">Monte Carlo Iterations</label>
            <input
              type="number"
              min={1000}
              max={100000}
              step={1000}
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full bg-[#0a0e14] border border-slate-700 text-white rounded px-3 py-1.5 tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 block">Default: 20,000 runs</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 block">Dixon-Coles Rho (ρ)</label>
            <input
              type="number"
              step={0.01}
              min={-0.15}
              max={0.1}
              value={rho}
              onChange={(e) => setRho(Number(e.target.value))}
              className="w-full bg-[#0a0e14] border border-slate-700 text-white rounded px-3 py-1.5 tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 block">Default: -0.04</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 block">Home Advantage Factor</label>
            <input
              type="number"
              step={0.01}
              min={1.0}
              max={1.4}
              value={homeAdv}
              onChange={(e) => setHomeAdv(Number(e.target.value))}
              className="w-full bg-[#0a0e14] border border-slate-700 text-white rounded px-3 py-1.5 tabular-nums focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 block">Default: 1.15x</span>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-slate-800">
          <div className="text-xs font-mono text-emerald-400">{saveMsg}</div>
          <button
            onClick={handleSaveAllSettings}
            className="px-4 py-2 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
          >
            Save All Settings
          </button>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="bg-[#111822] border border-slate-800 rounded p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold font-mono uppercase text-white tracking-wider">
            Backup & Data Management
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Export or restore complete IndexedDB snapshots without loss of historical records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono text-slate-200 bg-[#162130] hover:bg-[#1c2a3e] border border-slate-700 rounded transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export JSON Backup</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono text-slate-200 bg-[#162130] hover:bg-[#1c2a3e] border border-slate-700 rounded cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore JSON Backup</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono text-slate-200 bg-[#162130] hover:bg-[#1c2a3e] border border-slate-700 rounded transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Export Matches CSV</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-[#0e141c] border border-slate-700 rounded text-xs font-mono text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Danger Zone: Purge all local tables
          </div>
          <button
            onClick={handleClearDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Local Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
