import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Shield, X } from 'lucide-react';
import { Team, Player, MatchRecord } from '../../types';

interface TeamsViewProps {
  teams: Team[];
  players: Player[];
  matches: MatchRecord[];
  onSaveTeam: (team: Team) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  players,
  matches,
  onSaveTeam,
  onDeleteTeam,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [stadium, setStadium] = useState('');
  const [foundedYear, setFoundedYear] = useState<string>('');
  const [manager, setManager] = useState('');
  const [eloRating, setEloRating] = useState<number>(1500);
  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingTeam(null);
    setName('');
    setShortName('');
    setStadium('');
    setFoundedYear('');
    setManager('');
    setEloRating(1500);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setShortName(team.shortName);
    setStadium(team.stadium);
    setFoundedYear(team.foundedYear ? String(team.foundedYear) : '');
    setManager(team.manager || '');
    setEloRating(team.eloRating || 1500);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Team name is required.');
      return;
    }
    if (!shortName.trim()) {
      setErrorMsg('Short name (e.g. ARS, CHE) is required.');
      return;
    }

    // Check duplicate name
    const existing = teams.find(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== editingTeam?.id
    );
    if (existing) {
      setErrorMsg('A team with this name already exists.');
      return;
    }

    const teamObj: Team = {
      id: editingTeam ? editingTeam.id : `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      stadium: stadium.trim(),
      foundedYear: foundedYear.trim() !== '' ? parseInt(foundedYear.trim(), 10) : null,
      manager: manager.trim() || null,
      eloRating: Number(eloRating) || 1500,
      season: editingTeam?.season || '2026/27',
      seasons: editingTeam?.seasons || ['2026/27'],
      createdAt: editingTeam ? editingTeam.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveTeam(teamObj);
    setShowModal(false);
  };

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const filteredTeams = sortedTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shortName.toLowerCase().includes(search.toLowerCase()) ||
      t.stadium.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams by name, code or stadium..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111822] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded pl-9 pr-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team</span>
        </button>
      </div>

      {/* Teams Grid / List */}
      {filteredTeams.length === 0 ? (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <Shield className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            {search ? 'No teams match your search criteria.' : 'No teams found. Add your first Premier League team.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Stadium</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4 text-right">Elo Rating</th>
                <th className="py-3 px-4 text-right">Players</th>
                <th className="py-3 px-4 text-right">Matches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredTeams.map((team) => {
                const teamPlayers = players.filter((p) => p.teamId === team.id);
                const teamMatches = matches.filter(
                  (m) => m.homeTeamId === team.id || m.awayTeamId === team.id
                );
                return (
                  <tr key={team.id} className="hover:bg-[#162130]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {team.shortName}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{team.name}</td>
                    <td className="py-3 px-4 text-slate-400">{team.stadium || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">{team.manager || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                      {team.eloRating}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                      {teamPlayers.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                      {teamMatches.length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(team)}
                          className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${team.name}? Associated players will also be removed.`)) {
                              onDeleteTeam(team.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Team"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#111822] border border-slate-800 rounded w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                {editingTeam ? 'Edit Team' : 'Add Premier League Team'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded font-mono text-[11px]">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arsenal FC"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Code (3-4 chars) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. ARS"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Home Stadium</label>
                  <input
                    type="text"
                    placeholder="e.g. Emirates Stadium"
                    value={stadium}
                    onChange={(e) => setStadium(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Manager / Head Coach</label>
                  <input
                    type="text"
                    placeholder="e.g. Mikel Arteta"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Founded Year</label>
                  <input
                    type="number"
                    placeholder="e.g. 1886"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Initial Elo Rating</label>
                  <input
                    type="number"
                    min={500}
                    max={2500}
                    value={eloRating}
                    onChange={(e) => setEloRating(Number(e.target.value))}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors font-medium"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
