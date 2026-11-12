import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Calendar,
  FileEdit,
  BarChart3,
  TrendingUp,
  History,
  Settings,
  HardDrive,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type NavSection =
  | 'dashboard'
  | 'teams'
  | 'players'
  | 'matches'
  | 'data_entry'
  | 'analytics'
  | 'prediction'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  teamsCount: number;
  matchesCount: number;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  teamsCount,
  matchesCount,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teams', label: 'Teams', icon: Shield, badgeCount: teamsCount },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'matches', label: 'Match Center', icon: Calendar, badgeCount: matchesCount },
    { id: 'data_entry', label: 'Data Entry', icon: FileEdit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'prediction', label: 'Prediction', icon: TrendingUp },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1219] border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
          EP
        </div>
        <div>
          <div className="font-mono font-bold text-sm tracking-wider text-white">EPL PREDICT</div>
          <div className="text-[10px] text-slate-500 font-mono">OFFLINE ANALYTICS</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                isActive
                  ? 'bg-[#162130] text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121924]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#0a0e14]">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">Local IndexedDB</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono uppercase">Offline</span>
        </div>
        <div className="pt-1">
          <PWAInstallButton />
        </div>
      </div>
    </aside>
  );
};
