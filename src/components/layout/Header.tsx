import React from 'react';
import { NavSection } from './Sidebar';

interface HeaderProps {
  activeSection: NavSection;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  availableSeasons: string[];
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  teams: 'Teams Database',
  players: 'Players Database',
  matches: 'Match Center',
  data_entry: '110-Metric Data Entry',
  analytics: 'Statistical Analytics & Comparison',
  prediction: 'Prediction Engine',
  history: 'Prediction History & Model Validation',
  settings: 'System Settings & Data Management',
};

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  selectedSeason,
  onSeasonChange,
  availableSeasons,
}) => {
  return (
    <header className="h-16 px-6 bg-[#0d1219] border-b border-slate-800/80 flex items-center justify-between shrink-0">
      {/* Breadcrumb Zone */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono">EPL PREDICT</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{SECTION_TITLES[activeSection]}</span>
      </div>

      {/* Season Selection & Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] font-mono text-slate-500">Season:</span>
          <select
            value={selectedSeason}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="bg-[#121924] border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Seasons</option>
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
