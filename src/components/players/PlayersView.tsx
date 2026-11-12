import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Users, X } from 'lucide-react';
import { Player, Team, PlayerPosition } from '../../types';

interface PlayersViewProps {
  players: Player[];
  teams: Team[];
  onSavePlayer: (player: Player) => Promise<void>;
  onDeletePlayer: (id: string) => Promise<void>;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  teams,
  onSavePlayer,
  onDeletePlayer,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MF');
  const [squadNumber, setSquadNumber] = useState<string>('');
  const [nationality, setNationality] = useState('');
  const [age, setAge] = useState<string>('');
  const [fitnessScore, setFitnessScore] = useState<string>('95');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [injuryNotes, setInjuryNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const openCreateModal = () => {
    setEditingPlayer(null);
    setName('');
    setTeamId(selectedTeamId !== 'ALL' ? selectedTeamId : '');
    setPosition('MF');
    setSquadNumber('');
    setNationality('');
    setAge('');
    setFitnessScore('95');
    setIsAvailable(true);
    setInjuryNotes('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (p: Player) => {
    setEditingPlayer(p);
    setName(p.name);
    setTeamId(p.teamId);
    setPosition(p.position);
    setSquadNumber(p.squadNumber !== null && p.squadNumber !== undefined ? String(p.squadNumber) : '');
    setNationality(p.nationality || '');
    setAge(p.age !== null && p.age !== undefined ? String(p.age) : '');
    setFitnessScore(p.fitnessScore !== null && p.fitnessScore !== undefined ? String(p.fitnessScore) : '');
    setIsAvailable(p.isAvailable);
    setInjuryNotes(p.injuryNotes || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Player name is required.');
      return;
    }
    if (!teamId) {
      setErrorMsg('Please select a team.');
      return;
    }

    const playerObj: Player = {
      id: editingPlayer ? editingPlayer.id : `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      teamId,
      position,
      squadNumber: squadNumber.trim() !== '' ? parseInt(squadNumber.trim(), 10) : null,
      nationality: nationality.trim() || null,
      age: age.trim() !== '' ? parseInt(age.trim(), 10) : null,
      fitnessScore: fitnessScore.trim() !== '' ? parseInt(fitnessScore.trim(), 10) : null,
      isAvailable,
      injuryNotes: injuryNotes.trim() || null,
      createdAt: editingPlayer ? editingPlayer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSavePlayer(playerObj);
    setShowModal(false);
  };

  const filteredPlayers = players.filter((p) => {
    const matchesTeam = selectedTeamId === 'ALL' || p.teamId === selectedTeamId;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nationality && p.nationality.toLowerCase().includes(search.toLowerCase()));
    return matchesTeam && matchesSearch;
  });

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111822] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded pl-9 pr-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-[#111822] border border-slate-800 text-slate-200 text-xs rounded px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Teams</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          disabled={teams.length === 0}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Player</span>
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <Users className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Please add at least one team before registering players.
          </p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <Users className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            {search ? 'No players match your search.' : 'No players found in this team.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Pos</th>
                <th className="py-3 px-4">Nationality</th>
                <th className="py-3 px-4 text-right">Age</th>
                <th className="py-3 px-4 text-right">Fitness</th>
                <th className="py-3 px-4 text-center">Availability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-[#162130]/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                    {player.squadNumber !== null && player.squadNumber !== undefined
                      ? player.squadNumber
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{player.name}</td>
                  <td className="py-3 px-4 text-slate-300">{teamMap.get(player.teamId) || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                    {player.position}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{player.nationality || 'N/A'}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {player.age !== null && player.age !== undefined ? player.age : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {player.fitnessScore !== null && player.fitnessScore !== undefined
                      ? `${player.fitnessScore}%`
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded ${
                        player.isAvailable
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {player.isAvailable ? 'Available' : 'Out / Injured'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(player)}
                        className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                        title="Edit Player"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${player.name}?`)) {
                            onDeletePlayer(player.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                {editingPlayer ? 'Edit Player' : 'Add Player'}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Player Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bukayo Saka"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Team *</label>
                  <select
                    required
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">Select Team</option>
                    {sortedTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="GK">Goalkeeper (GK)</option>
                    <option value="DF">Defender (DF)</option>
                    <option value="MF">Midfielder (MF)</option>
                    <option value="FW">Forward (FW)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Squad Number</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="e.g. 7"
                    value={squadNumber}
                    onChange={(e) => setSquadNumber(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Age</label>
                  <input
                    type="number"
                    min={15}
                    max={45}
                    placeholder="e.g. 23"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Nationality</label>
                  <input
                    type="text"
                    placeholder="e.g. England"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[11px]">Fitness Score (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={fitnessScore}
                    onChange={(e) => setFitnessScore(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailableCheck"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded bg-[#0a0e14] border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="isAvailableCheck" className="text-slate-300 font-mono text-[11px]">
                    Player is fit and available for selection
                  </label>
                </div>
                {!isAvailable && (
                  <div className="space-y-1">
                    <label className="text-slate-400 font-mono text-[11px]">Injury / Absence Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Hamstring strain, doubtful"
                      value={injuryNotes}
                      onChange={(e) => setInjuryNotes(e.target.value)}
                      className="w-full bg-[#0a0e14] border border-slate-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}
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
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
