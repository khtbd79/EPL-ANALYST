import React, { useState } from 'react';
import { BarChart3, Filter, ArrowRight, Shield } from 'lucide-react';
import { Team, MatchRecord, TeamMatchStats } from '../../types';
import { CATEGORY_NAMES, STAT_FIELD_DEFINITIONS } from '../../utils/statDefinitions';
import { getEligibleTeamsForSeason } from '../../utils/teamUtils';

interface AnalyticsViewProps {
  teams: Team[];
  matches: MatchRecord[];
  selectedSeason: string;
}

export type PeriodFilter =
  | 'ALL_SEASON'
  | 'LAST_5'
  | 'LAST_10'
  | 'LAST_15'
  | 'HOME_ONLY'
  | 'AWAY_ONLY'
  | 'FIRST_HALF'
  | 'SECOND_HALF'
  | 'HEAD_TO_HEAD';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  teams,
  matches,
  selectedSeason,
}) => {
  const eligibleTeams = getEligibleTeamsForSeason(teams, selectedSeason);
  const sortedTeams = eligibleTeams.length > 0 ? eligibleTeams : [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const [teamAId, setTeamAId] = useState<string>(sortedTeams[0]?.id || '');
  const [teamBId, setTeamBId] = useState<string>('');
  const [period, setPeriod] = useState<PeriodFilter>('ALL_SEASON');
  const [activeCategory, setActiveCategory] = useState<string>('cat01');

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  // Filter completed matches for Team A & Team B
  const filterMatchesForTeam = (teamId: string, opponentId?: string): MatchRecord[] => {
    let pool = matches.filter(
      (m) =>
        (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
        m.status === 'Completed'
    );

    if (selectedSeason !== 'ALL') {
      pool = pool.filter((m) => m.season === selectedSeason);
    }

    if (period === 'HEAD_TO_HEAD' && opponentId) {
      pool = pool.filter(
        (m) =>
          (m.homeTeamId === teamId && m.awayTeamId === opponentId) ||
          (m.homeTeamId === opponentId && m.awayTeamId === teamId)
      );
    } else if (period === 'HOME_ONLY') {
      pool = pool.filter((m) => m.homeTeamId === teamId);
    } else if (period === 'AWAY_ONLY') {
      pool = pool.filter((m) => m.awayTeamId === teamId);
    }

    // Sort descending by date
    pool = [...pool].sort((a, b) => b.date.localeCompare(a.date));

    if (period === 'LAST_5') return pool.slice(0, 5);
    if (period === 'LAST_10') return pool.slice(0, 10);
    if (period === 'LAST_15') return pool.slice(0, 15);

    return pool;
  };

  const matchesA = teamAId ? filterMatchesForTeam(teamAId, teamBId) : [];
  const matchesB = teamBId ? filterMatchesForTeam(teamBId, teamAId) : [];

  // Calculate average for a metric for a given team over its filtered matches
  const calculateMetricAvg = (teamId: string, teamMatches: MatchRecord[], category: string, key: string): { avg: number | null; count: number } => {
    let sum = 0;
    let count = 0;

    for (const m of teamMatches) {
      const statsObj: TeamMatchStats = m.homeTeamId === teamId ? m.homeStats : m.awayStats;
      if (!statsObj) continue;

      const catData = (statsObj[category as keyof TeamMatchStats] as unknown) as Record<string, unknown>;
      if (!catData) continue;

      const val = catData[key];
      if (typeof val === 'number' && !isNaN(val)) {
        sum += val;
        count++;
      }
    }

    return {
      avg: count > 0 ? Number((sum / count).toFixed(2)) : null,
      count,
    };
  };

  const fieldsForCat = STAT_FIELD_DEFINITIONS[activeCategory] || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Selector & Period Filter Strip */}
      <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Team A</span>
              <select
                value={teamAId}
                onChange={(e) => {
                  const val = e.target.value;
                  setTeamAId(val);
                  if (teamBId === val) {
                    setTeamBId('');
                  }
                }}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Team</option>
                {sortedTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">
                Team B (Comparison)
              </span>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="">(None - Single Team View)</option>
                {sortedTeams
                  .filter((t) => t.id !== teamAId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Historical Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Filter:</span>
            {[
              { id: 'ALL_SEASON', label: 'Current Season' },
              { id: 'LAST_5', label: 'Last 5' },
              { id: 'LAST_10', label: 'Last 10' },
              { id: 'LAST_15', label: 'Last 15' },
              { id: 'HOME_ONLY', label: 'Home' },
              { id: 'AWAY_ONLY', label: 'Away' },
              { id: 'HEAD_TO_HEAD', label: 'H2H' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPeriod(f.id as PeriodFilter)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  period === f.id
                    ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white bg-[#0e141c]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Sample Summary */}
        <div className="flex items-center gap-6 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            <span className="text-emerald-400 font-semibold">{teamA?.name || 'Team A'}:</span>{' '}
            <span className="text-white font-bold tabular-nums">{matchesA.length}</span> matches used
          </div>
          {teamB && (
            <div>
              <span className="text-blue-400 font-semibold">{teamB.name}:</span>{' '}
              <span className="text-white font-bold tabular-nums">{matchesB.length}</span> matches used
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#111822] border border-slate-800 p-1.5 rounded">
        {CATEGORY_NAMES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{cat.number}. {cat.title}</span>
          </button>
        ))}
      </div>

      {/* Numerical Comparison Grid */}
      <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Metric</th>
              <th className="py-3 px-4 text-right text-emerald-400">
                {teamA?.shortName || 'Team A'} Avg
              </th>
              {teamB && (
                <th className="py-3 px-4 text-right text-blue-400">
                  {teamB.shortName} Avg
                </th>
              )}
              {teamB && <th className="py-3 px-4 text-right">Delta (A - B)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
            {fieldsForCat.map((field) => {
              if (field.type === 'select') {
                return (
                  <tr key={field.key} className="hover:bg-[#162130]/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[11px] tabular-nums">
                      {field.fieldNumber}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 font-medium">
                      {field.label}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">N/A</td>
                    {teamB && <td className="py-3 px-4 text-right text-slate-500">N/A</td>}
                    {teamB && <td className="py-3 px-4 text-right text-slate-500">N/A</td>}
                  </tr>
                );
              }

              const statA = calculateMetricAvg(teamAId, matchesA, field.category, field.key);
              const statB = teamBId ? calculateMetricAvg(teamBId, matchesB, field.category, field.key) : null;
              const delta =
                statA.avg !== null && statB && statB.avg !== null
                  ? Number((statA.avg - statB.avg).toFixed(2))
                  : null;

              return (
                <tr key={field.key} className="hover:bg-[#162130]/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-[11px] tabular-nums">
                    {field.fieldNumber}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-200 font-medium">
                    {field.label}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-400">
                    {statA.avg !== null ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span>
                          {statA.avg}
                          {field.type === 'percentage' ? '%' : ''}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (n={statA.count})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-normal">N/A</span>
                    )}
                  </td>
                  {teamB && (
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-blue-400">
                      {statB && statB.avg !== null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span>
                            {statB.avg}
                            {field.type === 'percentage' ? '%' : ''}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            (n={statB.count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-normal">N/A</span>
                      )}
                    </td>
                  )}
                  {teamB && (
                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {delta !== null ? (
                        <span
                          className={
                            delta > 0
                              ? 'text-emerald-400'
                              : delta < 0
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
