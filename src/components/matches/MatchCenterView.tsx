import React, { useState } from 'react';
import { Plus, Search, Calendar, Trash2, TrendingUp, FileEdit, CheckCircle, X } from 'lucide-react';
import { MatchRecord, Team, MatchStatus } from '../../types';
import { createEmptyTeamStats } from '../../utils/statDefinitions';
import { getEligibleTeamsForSeason } from '../../utils/teamUtils';

interface MatchCenterViewProps {
  matches: MatchRecord[];
  teams: Team[];
  selectedSeason: string;
  onSaveMatch: (match: MatchRecord) => Promise<void>;
  onDeleteMatch: (id: string) => Promise<void>;
  onNavigateToDataEntry: (matchId: string) => void;
  onNavigateToPrediction: (matchId: string) => void;
}

export const MatchCenterView: React.FC<MatchCenterViewProps> = ({
  matches,
  teams,
  selectedSeason,
  onSaveMatch,
  onDeleteMatch,
  onNavigateToDataEntry,
  onNavigateToPrediction,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scoreModalMatch, setScoreModalMatch] = useState<MatchRecord | null>(null);

  // New Match Form - Do not auto-select teams
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [matchSeason, setMatchSeason] = useState(selectedSeason !== 'ALL' ? selectedSeason : '2026/27');
  const [referee, setReferee] = useState('');
  const [formError, setFormError] = useState('');

  // Score Modal Form
  const [scoreHome, setScoreHome] = useState<string>('');
  const [scoreAway, setScoreAway] = useState<string>('');

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  const eligibleTeams = getEligibleTeamsForSeason(teams, matchSeason);
  const sortedTeams = eligibleTeams.length > 0 ? eligibleTeams : [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId) {
      setFormError('Both teams must be selected.');
      return;
    }
    if (homeTeamId === awayTeamId) {
      setFormError('Home team and Away team cannot be the same.');
      return;
    }

    const newMatch: MatchRecord = {
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      season: matchSeason,
      date: matchDate,
      homeTeamId,
      awayTeamId,
      status: 'Scheduled',
      homeStats: createEmptyTeamStats(),
      awayStats: createEmptyTeamStats(),
      homeLineup: [],
      awayLineup: [],
      injuries: [],
      odds: { homeOdds: null, drawOdds: null, awayOdds: null },
      score: { homeGoals: null, awayGoals: null },
      referee: referee.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveMatch(newMatch);
    setShowCreateModal(false);
  };

  const openScoreModal = (match: MatchRecord) => {
    setScoreModalMatch(match);
    setScoreHome(
      typeof match.score.homeGoals === 'number' && !isNaN(match.score.homeGoals)
        ? String(match.score.homeGoals)
        : ''
    );
    setScoreAway(
      typeof match.score.awayGoals === 'number' && !isNaN(match.score.awayGoals)
        ? String(match.score.awayGoals)
        : ''
    );
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreModalMatch) return;

    const hGoals = scoreHome.trim() !== '' ? parseInt(scoreHome.trim(), 10) : null;
    const aGoals = scoreAway.trim() !== '' ? parseInt(scoreAway.trim(), 10) : null;

    const isCompleted =
      typeof hGoals === 'number' && !isNaN(hGoals) && typeof aGoals === 'number' && !isNaN(aGoals);

    const updated: MatchRecord = {
      ...scoreModalMatch,
      status: isCompleted ? 'Completed' : 'Scheduled',
      score: {
        ...scoreModalMatch.score,
        homeGoals: hGoals,
        awayGoals: aGoals,
      },
      updatedAt: new Date().toISOString(),
    };

    await onSaveMatch(updated);
    setScoreModalMatch(null);
  };

  const filteredMatches = matches.filter((m) => {
    const matchesSeason = selectedSeason === 'ALL' || m.season === selectedSeason;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const homeName = teamMap.get(m.homeTeamId) || '';
    const awayName = teamMap.get(m.awayTeamId) || '';
    const matchesSearch =
      homeName.toLowerCase().includes(search.toLowerCase()) ||
      awayName.toLowerCase().includes(search.toLowerCase()) ||
      m.date.includes(search);
    return matchesSeason && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search matches by team or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111822] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded pl-9 pr-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111822] border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#1a2536] text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                statusFilter === 'Scheduled'
                  ? 'bg-[#1a2536] text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                statusFilter === 'Completed'
                  ? 'bg-[#1a2536] text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setHomeTeamId('');
            setAwayTeamId('');
            setMatchDate(new Date().toISOString().split('T')[0]);
            setMatchSeason(selectedSeason !== 'ALL' ? selectedSeason : '2026/27');
            setReferee('');
            setFormError('');
            setShowCreateModal(true);
          }}
          disabled={teams.length < 2}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Match</span>
        </button>
      </div>

      {teams.length < 2 ? (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Please register at least 2 teams before creating fixtures.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <Calendar className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            {search ? 'No matches match your filter.' : 'No matches registered in this view.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4">Fixture</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredMatches.map((m) => {
                const homeName = teamMap.get(m.homeTeamId) || m.homeTeamId;
                const awayName = teamMap.get(m.awayTeamId) || m.awayTeamId;
                const hasScore =
                  typeof m.score.homeGoals === 'number' &&
                  !isNaN(m.score.homeGoals) &&
                  typeof m.score.awayGoals === 'number' &&
                  !isNaN(m.score.awayGoals);

                return (
                  <tr key={m.id} className="hover:bg-[#162130]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{m.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{m.season}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{homeName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">vs</span>
                        <span>{awayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded ${
                          m.status === 'Completed'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-white">
                      {hasScore ? (
                        <button
                          onClick={() => openScoreModal(m)}
                          className="hover:text-emerald-400 underline decoration-slate-600 underline-offset-2"
                          title="Click to edit final score"
                        >
                          {m.score.homeGoals} - {m.score.awayGoals}
                        </button>
                      ) : (
                        <button
                          onClick={() => openScoreModal(m)}
                          className="text-slate-500 hover:text-slate-300 text-[11px]"
                        >
                          + Record Score
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 font-mono">
                        <button
                          onClick={() => onNavigateToDataEntry(m.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-[#162130] hover:bg-[#1c2a3e] rounded border border-slate-700/80 transition-colors"
                          title="Enter/Edit 110 Statistics"
                        >
                          <FileEdit className="w-3 h-3 text-emerald-400" />
                          <span>Stats</span>
                        </button>
                        <button
                          onClick={() => onNavigateToPrediction(m.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/50 rounded border border-emerald-800/60 transition-colors"
                          title="Generate Prediction"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>Predict</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this match record?')) {
                              onDeleteMatch(m.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#111822] border border-slate-800 rounded w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Create Fixture
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded font-mono text-[11px]">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Season *</label>
                  <input
                    type="text"
                    required
                    value={matchSeason}
                    onChange={(e) => setMatchSeason(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Match Date *</label>
                  <input
                    type="date"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Home Team *</label>
                  <select
                    required
                    value={homeTeamId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHomeTeamId(val);
                      if (awayTeamId === val) {
                        setAwayTeamId('');
                      }
                    }}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">Select Team</option>
                    {sortedTeams.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Away Team *</label>
                  <select
                    required
                    value={awayTeamId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAwayTeamId(val);
                      if (homeTeamId === val) {
                        setHomeTeamId('');
                      }
                    }}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">Select Team</option>
                    {sortedTeams
                      .filter((t) => t.id !== homeTeamId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[11px]">Referee</label>
                <input
                  type="text"
                  placeholder="e.g. Michael Oliver"
                  value={referee}
                  onChange={(e) => setReferee(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors font-medium"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record / Edit Final Score Modal */}
      {scoreModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#111822] border border-slate-800 rounded w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Record Final Score
              </h3>
              <button
                onClick={() => setScoreModalMatch(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="p-5 space-y-4 text-xs">
              <div className="text-center pb-2">
                <div className="text-sm font-semibold text-white">
                  {teamMap.get(scoreModalMatch.homeTeamId)} vs {teamMap.get(scoreModalMatch.awayTeamId)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {scoreModalMatch.date} · {scoreModalMatch.season}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px] block text-center">
                    Home Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    placeholder="—"
                    value={scoreHome}
                    onChange={(e) => setScoreHome(e.target.value)}
                    className="w-full text-center text-lg font-bold bg-[#0a0e14] border border-slate-800 rounded py-2 text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px] block text-center">
                    Away Goals
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    placeholder="—"
                    value={scoreAway}
                    onChange={(e) => setScoreAway(e.target.value)}
                    className="w-full text-center text-lg font-bold bg-[#0a0e14] border border-slate-800 rounded py-2 text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScoreModalMatch(null)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors font-medium"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
