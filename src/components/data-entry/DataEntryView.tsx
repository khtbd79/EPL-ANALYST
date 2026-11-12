import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Check,
  AlertCircle,
  Users,
  ShieldAlert,
  Coins,
  Plus,
  X,
} from 'lucide-react';
import {
  MatchRecord,
  Team,
  Player,
  TeamMatchStats,
  LineupEntry,
  InjuryEntry,
  OddsData,
} from '../../types';
import {
  createEmptyTeamStats,
  CATEGORY_NAMES,
  STAT_FIELD_DEFINITIONS,
  COMMON_FORMATIONS,
  WEATHER_CONDITIONS,
  PITCH_CONDITIONS,
  countAvailableStats,
  isStatAvailable,
} from '../../utils/statDefinitions';
import { getEligibleTeamsForSeason } from '../../utils/teamUtils';

interface DataEntryViewProps {
  matches: MatchRecord[];
  teams: Team[];
  players: Player[];
  selectedMatchId?: string | null;
  selectedSeason: string;
  onSaveMatch: (match: MatchRecord) => Promise<void>;
  onDeleteMatch: (id: string) => Promise<void>;
  onNavigateToPrediction: (matchId: string) => void;
}

export const DataEntryView: React.FC<DataEntryViewProps> = ({
  matches,
  teams,
  players,
  selectedMatchId,
  selectedSeason,
  onSaveMatch,
  onDeleteMatch,
  onNavigateToPrediction,
}) => {
  // Current active match ID
  const [currentMatchId, setCurrentMatchId] = useState<string>(selectedMatchId || '');

  // Match Header State - Do not auto-select teams when creating new match
  const [season, setSeason] = useState(selectedSeason !== 'ALL' ? selectedSeason : '2026/27');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');

  // 110 Statistics State for Home & Away
  const [homeStats, setHomeStats] = useState<TeamMatchStats>(createEmptyTeamStats());
  const [awayStats, setAwayStats] = useState<TeamMatchStats>(createEmptyTeamStats());

  // Lineups & Injuries & Odds
  const [homeLineup, setHomeLineup] = useState<LineupEntry[]>([]);
  const [awayLineup, setAwayLineup] = useState<LineupEntry[]>([]);
  const [injuries, setInjuries] = useState<InjuryEntry[]>([]);
  const [odds, setOdds] = useState<OddsData>({
    homeOdds: null,
    drawOdds: null,
    awayOdds: null,
    over25Odds: null,
    under25Odds: null,
  });

  // Active Category Tab: 'cat01' to 'cat08' or 'lineups_injuries' or 'odds'
  const [activeTab, setActiveTab] = useState<string>('cat01');

  // UI status
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync when selectedMatchId prop changes or when user selects a match from dropdown
  useEffect(() => {
    if (selectedMatchId) {
      loadMatch(selectedMatchId);
    } else if (matches.length > 0 && !currentMatchId) {
      loadMatch(matches[0].id);
    }
  }, [selectedMatchId, matches]);

  const loadMatch = (matchId: string) => {
    const found = matches.find((m) => m.id === matchId);
    if (found) {
      setCurrentMatchId(found.id);
      setSeason(found.season);
      setDate(found.date);
      setHomeTeamId(found.homeTeamId);
      setAwayTeamId(found.awayTeamId);
      setHomeStats(found.homeStats || createEmptyTeamStats());
      setAwayStats(found.awayStats || createEmptyTeamStats());
      setHomeLineup(found.homeLineup || []);
      setAwayLineup(found.awayLineup || []);
      setInjuries(found.injuries || []);
      setOdds(found.odds || { homeOdds: null, drawOdds: null, awayOdds: null });
      setStatusMsg(null);
    }
  };

  const handleCreateNewMatch = () => {
    setCurrentMatchId('');
    setSeason(selectedSeason !== 'ALL' ? selectedSeason : '2026/27');
    setDate(new Date().toISOString().split('T')[0]);
    setHomeTeamId('');
    setAwayTeamId('');
    setHomeStats(createEmptyTeamStats());
    setAwayStats(createEmptyTeamStats());
    setHomeLineup([]);
    setAwayLineup([]);
    setInjuries([]);
    setOdds({ homeOdds: null, drawOdds: null, awayOdds: null });
    setStatusMsg(null);
  };

  // Helper to update a statistic field in home or away stats
  const handleStatChange = (
    side: 'home' | 'away',
    category: string,
    key: string,
    valStr: string,
    type: 'number' | 'percentage' | 'select'
  ) => {
    const setter = side === 'home' ? setHomeStats : setAwayStats;

    let parsedVal: unknown = null;
    if (valStr !== '' && valStr !== null && valStr !== undefined) {
      if (type === 'number' || type === 'percentage') {
        const num = parseFloat(valStr);
        parsedVal = isNaN(num) ? null : num;
      } else {
        parsedVal = valStr;
      }
    }

    setter((prev) => {
      const catObj = { ...((prev[category as keyof TeamMatchStats] as unknown) as Record<string, unknown>) };
      catObj[key] = parsedVal;
      return {
        ...prev,
        [category]: catObj,
      };
    });
  };

  const handleSave = async () => {
    if (!homeTeamId || !awayTeamId) {
      setStatusMsg({ text: 'Please select both Home and Away teams.', type: 'error' });
      return;
    }
    if (homeTeamId === awayTeamId) {
      setStatusMsg({ text: 'Home team and Away team must be different.', type: 'error' });
      return;
    }

    const matchIdToSave = currentMatchId || `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = matches.find((m) => m.id === matchIdToSave);

    const matchToSave: MatchRecord = {
      id: matchIdToSave,
      season,
      date,
      homeTeamId,
      awayTeamId,
      status: existing ? existing.status : 'Scheduled',
      homeStats,
      awayStats,
      homeLineup,
      awayLineup,
      injuries,
      odds,
      score: existing ? existing.score : { homeGoals: null, awayGoals: null },
      referee: existing?.referee || null,
      notes: existing?.notes || null,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveMatch(matchToSave);
    setCurrentMatchId(matchIdToSave);
    setStatusMsg({ text: 'Match record and 110-statistics saved successfully.', type: 'success' });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const homeFilledCount = countAvailableStats(homeStats).available;
  const awayFilledCount = countAvailableStats(awayStats).available;
  const totalStatsPerTeam = 110;

  const eligibleTeams = getEligibleTeamsForSeason(teams, season);
  const sortedTeams = eligibleTeams.length > 0 ? eligibleTeams : [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  // Available players for lineups
  const homeAvailablePlayers = players.filter((p) => p.teamId === homeTeamId);
  const awayAvailablePlayers = players.filter((p) => p.teamId === awayTeamId);

  // Add lineup entry
  const addLineupPlayer = (side: 'home' | 'away', player: Player) => {
    const list = side === 'home' ? homeLineup : awayLineup;
    const setList = side === 'home' ? setHomeLineup : setAwayLineup;
    if (list.some((e) => e.playerId === player.id)) return;

    setList([
      ...list,
      {
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        isStarter: list.length < 11,
      },
    ]);
  };

  const removeLineupPlayer = (side: 'home' | 'away', playerId: string) => {
    const setList = side === 'home' ? setHomeLineup : setAwayLineup;
    setList((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Match Selector & Actions Bar */}
      <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Active Fixture</span>
              <select
                value={currentMatchId}
                onChange={(e) => {
                  if (e.target.value === 'NEW') {
                    handleCreateNewMatch();
                  } else {
                    loadMatch(e.target.value);
                  }
                }}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="NEW">+ Create New Fixture</option>
                {matches.map((m) => {
                  const h = teams.find((t) => t.id === m.homeTeamId)?.name || 'Home';
                  const a = teams.find((t) => t.id === m.awayTeamId)?.name || 'Away';
                  return (
                    <option key={m.id} value={m.id}>
                      {m.date} · {h} vs {a} ({m.season})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Season</span>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-mono w-28 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Match Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Statistics</span>
            </button>
            {currentMatchId && (
              <button
                onClick={() => onNavigateToPrediction(currentMatchId)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded transition-colors"
              >
                <span>Run Prediction</span>
              </button>
            )}
          </div>
        </div>

        {/* Home & Away Selection Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3 bg-[#0e141c] p-3 rounded border border-slate-800">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">
              H
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Home Team</label>
              <select
                value={homeTeamId}
                onChange={(e) => {
                  const val = e.target.value;
                  setHomeTeamId(val);
                  if (awayTeamId === val) {
                    setAwayTeamId('');
                  }
                }}
                className="w-full bg-[#111822] border border-slate-700 text-slate-100 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Team</option>
                {sortedTeams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right pl-2">
              <div className="text-[10px] font-mono text-slate-500">Filled</div>
              <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {homeFilledCount} / {totalStatsPerTeam}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#0e141c] p-3 rounded border border-slate-800">
            <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">
              A
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Away Team</label>
              <select
                value={awayTeamId}
                onChange={(e) => {
                  const val = e.target.value;
                  setAwayTeamId(val);
                  if (homeTeamId === val) {
                    setHomeTeamId('');
                  }
                }}
                className="w-full bg-[#111822] border border-slate-700 text-slate-100 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Team</option>
                {sortedTeams
                  .filter((t) => t.id !== homeTeamId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName})
                    </option>
                  ))}
              </select>
            </div>
            <div className="text-right pl-2">
              <div className="text-[10px] font-mono text-slate-500">Filled</div>
              <div className="text-xs font-mono font-bold text-blue-400 tabular-nums">
                {awayFilledCount} / {totalStatsPerTeam}
              </div>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-2.5 rounded font-mono text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/50 border border-rose-800 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Categories Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-[#111822] border border-slate-800 p-1.5 rounded">
        {CATEGORY_NAMES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3 py-2 text-xs font-mono rounded transition-colors whitespace-nowrap ${
              activeTab === cat.id
                ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141c28]'
            }`}
          >
            <span>{cat.number}. {cat.title}</span>
            <span className="ml-1.5 text-[10px] text-slate-500 tabular-nums">({cat.count})</span>
          </button>
        ))}

        <button
          onClick={() => setActiveTab('lineups_injuries')}
          className={`px-3 py-2 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeTab === 'lineups_injuries'
              ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141c28]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Lineups & Injuries</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('odds')}
          className={`px-3 py-2 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeTab === 'odds'
              ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141c28]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>Odds Data</span>
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab.startsWith('cat') && (
        <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-[#0e141c] text-slate-400 border-b border-slate-800 px-4 py-3 font-mono text-[11px] uppercase">
            <div className="col-span-6">Metric (# & Name)</div>
            <div className="col-span-3 text-right pr-4 font-semibold text-emerald-400">
              {homeTeam?.shortName || 'Home'} Value
            </div>
            <div className="col-span-3 text-right pr-2 font-semibold text-blue-400">
              {awayTeam?.shortName || 'Away'} Value
            </div>
          </div>

          {/* Formations Selector for Cat 01 */}
          {activeTab === 'cat01' && (
            <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-800/80 bg-[#141c28]/40 text-xs">
              <div className="col-span-6 font-mono text-slate-300">
                Starting Tactical Formation
              </div>
              <div className="col-span-3 pr-4">
                <select
                  value={homeStats.formation || ''}
                  onChange={(e) => setHomeStats({ ...homeStats, formation: e.target.value || null })}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">(Select Formation)</option>
                  {COMMON_FORMATIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 pr-2">
                <select
                  value={awayStats.formation || ''}
                  onChange={(e) => setAwayStats({ ...awayStats, formation: e.target.value || null })}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">(Select Formation)</option>
                  {COMMON_FORMATIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Metric Fields List */}
          <div className="divide-y divide-slate-800/60">
            {(STAT_FIELD_DEFINITIONS[activeTab] || []).map((field) => {
              const homeVal = ((homeStats[field.category as keyof TeamMatchStats] as unknown) as Record<string, unknown>)?.[field.key];
              const awayVal = ((awayStats[field.category as keyof TeamMatchStats] as unknown) as Record<string, unknown>)?.[field.key];

              const homeDisplay =
                typeof homeVal === 'number'
                  ? String(homeVal)
                  : homeVal !== null && homeVal !== undefined
                  ? String(homeVal)
                  : '';
              const awayDisplay =
                typeof awayVal === 'number'
                  ? String(awayVal)
                  : awayVal !== null && awayVal !== undefined
                  ? String(awayVal)
                  : '';

              return (
                <div
                  key={`${field.category}_${field.key}`}
                  className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-[#141c28]/40 transition-colors text-xs"
                >
                  {/* Metric Label */}
                  <div className="col-span-6 flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px] w-6 shrink-0">
                      {field.fieldNumber}.
                    </span>
                    <span className="text-slate-200 font-medium">{field.label}</span>
                  </div>

                  {/* Home Value Input */}
                  <div className="col-span-3 pr-4">
                    {field.type === 'select' ? (
                      <select
                        value={homeDisplay}
                        onChange={(e) =>
                          handleStatChange('home', field.category, field.key, e.target.value, 'select')
                        }
                        className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 text-right"
                      >
                        <option value="">—</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step={field.step || 0.01}
                        min={field.min}
                        max={field.max}
                        placeholder="—"
                        value={homeDisplay}
                        onChange={(e) =>
                          handleStatChange('home', field.category, field.key, e.target.value, field.type)
                        }
                        className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs text-right focus:outline-none focus:border-emerald-500 tabular-nums placeholder-slate-700"
                      />
                    )}
                  </div>

                  {/* Away Value Input */}
                  <div className="col-span-3 pr-2">
                    {field.type === 'select' ? (
                      <select
                        value={awayDisplay}
                        onChange={(e) =>
                          handleStatChange('away', field.category, field.key, e.target.value, 'select')
                        }
                        className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 text-right"
                      >
                        <option value="">—</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step={field.step || 0.01}
                        min={field.min}
                        max={field.max}
                        placeholder="—"
                        value={awayDisplay}
                        onChange={(e) =>
                          handleStatChange('away', field.category, field.key, e.target.value, field.type)
                        }
                        className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-xs text-right focus:outline-none focus:border-emerald-500 tabular-nums placeholder-slate-700"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lineups and Injuries Tab */}
      {activeTab === 'lineups_injuries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team Squad & Lineup */}
          <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase">
                {homeTeam?.name || 'Home Team'} Lineup
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {homeLineup.length} Selected
              </span>
            </div>

            {/* Quick Player Selection */}
            <div className="flex items-center gap-2">
              <select
                id="homePlayerSelect"
                className="flex-1 bg-[#0a0e14] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                defaultValue=""
              >
                <option value="" disabled>
                  Select player to add...
                </option>
                {homeAvailablePlayers
                  .filter((p) => !homeLineup.some((l) => l.playerId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.squadNumber ? `#${p.squadNumber} ` : ''}
                      {p.name} ({p.position})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const sel = document.getElementById('homePlayerSelect') as HTMLSelectElement;
                  const pl = homeAvailablePlayers.find((p) => p.id === sel?.value);
                  if (pl) {
                    addLineupPlayer('home', pl);
                    sel.value = '';
                  }
                }}
                className="px-2.5 py-1 text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              >
                Add
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              {homeLineup.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No players in lineup yet.
                </div>
              ) : (
                homeLineup.map((item) => (
                  <div
                    key={item.playerId}
                    className="py-2 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{item.position}</span>
                      <span className="text-slate-200">{item.playerName}</span>
                      {item.isStarter && (
                        <span className="text-[10px] text-slate-500 uppercase">Starter</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeLineupPlayer('home', item.playerId)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Away Team Squad & Lineup */}
          <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-mono font-bold text-blue-400 uppercase">
                {awayTeam?.name || 'Away Team'} Lineup
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {awayLineup.length} Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                id="awayPlayerSelect"
                className="flex-1 bg-[#0a0e14] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                defaultValue=""
              >
                <option value="" disabled>
                  Select player to add...
                </option>
                {awayAvailablePlayers
                  .filter((p) => !awayLineup.some((l) => l.playerId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.squadNumber ? `#${p.squadNumber} ` : ''}
                      {p.name} ({p.position})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const sel = document.getElementById('awayPlayerSelect') as HTMLSelectElement;
                  const pl = awayAvailablePlayers.find((p) => p.id === sel?.value);
                  if (pl) {
                    addLineupPlayer('away', pl);
                    sel.value = '';
                  }
                }}
                className="px-2.5 py-1 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white rounded"
              >
                Add
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              {awayLineup.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No players in lineup yet.
                </div>
              ) : (
                awayLineup.map((item) => (
                  <div
                    key={item.playerId}
                    className="py-2 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">{item.position}</span>
                      <span className="text-slate-200">{item.playerName}</span>
                      {item.isStarter && (
                        <span className="text-[10px] text-slate-500 uppercase">Starter</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeLineupPlayer('away', item.playerId)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Odds Tab */}
      {activeTab === 'odds' && (
        <div className="bg-[#111822] border border-slate-800 rounded p-6 max-w-xl mx-auto space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold text-white uppercase">
              Pre-Match Market Odds
            </h4>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Decimal odds used to compute market-implied probabilities and model edge.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Home Win Odds</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                placeholder="e.g. 1.85"
                value={odds.homeOdds !== null && odds.homeOdds !== undefined ? String(odds.homeOdds) : ''}
                onChange={(e) =>
                  setOdds({ ...odds, homeOdds: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Draw Odds</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                placeholder="e.g. 3.60"
                value={odds.drawOdds !== null && odds.drawOdds !== undefined ? String(odds.drawOdds) : ''}
                onChange={(e) =>
                  setOdds({ ...odds, drawOdds: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Away Win Odds</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                placeholder="e.g. 4.20"
                value={odds.awayOdds !== null && odds.awayOdds !== undefined ? String(odds.awayOdds) : ''}
                onChange={(e) =>
                  setOdds({ ...odds, awayOdds: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Over 2.5 Goals Odds</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                placeholder="e.g. 1.72"
                value={odds.over25Odds !== null && odds.over25Odds !== undefined ? String(odds.over25Odds) : ''}
                onChange={(e) =>
                  setOdds({ ...odds, over25Odds: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400">Under 2.5 Goals Odds</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                placeholder="e.g. 2.10"
                value={odds.under25Odds !== null && odds.under25Odds !== undefined ? String(odds.under25Odds) : ''}
                onChange={(e) =>
                  setOdds({ ...odds, under25Odds: e.target.value ? parseFloat(e.target.value) : null })
                }
                className="w-full bg-[#0a0e14] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
