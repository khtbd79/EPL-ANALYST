/**
 * EPL PREDICT - Master Application Root
 * 100% Offline English Premier League Analytics & Prediction Application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TeamsView } from './components/teams/TeamsView';
import { PlayersView } from './components/players/PlayersView';
import { MatchCenterView } from './components/matches/MatchCenterView';
import { DataEntryView } from './components/data-entry/DataEntryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { PredictionView } from './components/prediction/PredictionView';
import { PredictionHistoryView } from './components/history/PredictionHistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { localDB } from './db/indexedDB';
import {
  Team,
  Player,
  MatchRecord,
  PredictionResult,
  AppSettings,
  DEFAULT_SETTINGS,
} from './types';
import { determineOutcome, calculateBrierScore, calculateLogLoss } from './engine/metrics';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026/27');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Database Data States
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      // Ensure the official 2026/27 Premier League clubs are preloaded without duplicates
      await localDB.preloadDefaultTeams();

      const [allTeams, allPlayers, allMatches, allPreds, appSettings] = await Promise.all([
        localDB.getTeams(),
        localDB.getPlayers(),
        localDB.getMatches('ALL'),
        localDB.getPredictions('ALL'),
        localDB.getSettings(),
      ]);

      setTeams(allTeams);
      setPlayers(allPlayers);
      setMatches(allMatches);
      setPredictions(allPreds);
      setSettings(appSettings);
      if (appSettings.defaultSeason) {
        setSelectedSeason(appSettings.defaultSeason);
      }
    } catch (err) {
      console.error('Error loading IndexedDB data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic available seasons list
  const seasonsSet = new Set<string>(['2026/27', '2025/26']);
  teams.forEach((t) => {
    if (t.seasons) t.seasons.forEach((s) => seasonsSet.add(s));
    else if (t.season) seasonsSet.add(t.season);
  });
  matches.forEach((m) => {
    if (m.season) seasonsSet.add(m.season);
  });
  const availableSeasons = Array.from(seasonsSet).sort().reverse();

  // --- CRUD Handlers ---

  const handleSaveTeam = async (team: Team) => {
    await localDB.saveTeam(team);
    await loadData();
  };

  const handleDeleteTeam = async (teamId: string) => {
    await localDB.deleteTeam(teamId);
    await loadData();
  };

  const handleSavePlayer = async (player: Player) => {
    await localDB.savePlayer(player);
    await loadData();
  };

  const handleDeletePlayer = async (playerId: string) => {
    await localDB.deletePlayer(playerId);
    await loadData();
  };

  const handleSaveMatch = async (match: MatchRecord) => {
    await localDB.saveMatch(match);

    // If match was completed, update any existing predictions linked to this match
    if (
      typeof match.score.homeGoals === 'number' &&
      !isNaN(match.score.homeGoals) &&
      typeof match.score.awayGoals === 'number' &&
      !isNaN(match.score.awayGoals)
    ) {
      const actualOutcome = determineOutcome(match.score.homeGoals, match.score.awayGoals);
      const actualScoreStr = `${match.score.homeGoals}-${match.score.awayGoals}`;

      const linkedPreds = predictions.filter((p) => p.matchId === match.id);
      for (const pred of linkedPreds) {
        let topOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' = 'HOME_WIN';
        let maxP = pred.homeWinProb;
        if (pred.drawProb > maxP) {
          maxP = pred.drawProb;
          topOutcome = 'DRAW';
        }
        if (pred.awayWinProb > maxP) {
          maxP = pred.awayWinProb;
          topOutcome = 'AWAY_WIN';
        }

        const brier = calculateBrierScore(pred.homeWinProb, pred.drawProb, pred.awayWinProb, actualOutcome);
        const logloss = calculateLogLoss(pred.homeWinProb, pred.drawProb, pred.awayWinProb, actualOutcome);

        const updatedPred: PredictionResult = {
          ...pred,
          actualScore: actualScoreStr,
          actualHomeGoals: match.score.homeGoals,
          actualAwayGoals: match.score.awayGoals,
          actualOutcome,
          isCorrectOutcome: topOutcome === actualOutcome,
          brierScore: brier,
          logLoss: logloss,
        };
        await localDB.savePrediction(updatedPred);
      }
    }

    await loadData();
  };

  const handleDeleteMatch = async (matchId: string) => {
    await localDB.deleteMatch(matchId);
    if (selectedMatchId === matchId) setSelectedMatchId(null);
    await loadData();
  };

  const handleSavePrediction = async (pred: PredictionResult) => {
    await localDB.savePrediction(pred);
    await loadData();
  };

  const handleDeletePrediction = async (predId: string) => {
    await localDB.deletePrediction(predId);
    await loadData();
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    await localDB.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Cross-Navigation Navigation Helpers
  const navigateToDataEntry = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveSection('data_entry');
  };

  const navigateToPrediction = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveSection('prediction');
  };

  const handleSelectPredictionFromHistory = (pred: PredictionResult) => {
    if (pred.matchId) {
      setSelectedMatchId(pred.matchId);
    }
    setActiveSection('prediction');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING EPL PREDICT...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0f14] text-slate-100 overflow-hidden font-sans">
      {/* Fixed Desktop-first Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        teamsCount={teams.length}
        matchesCount={matches.length}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeSection={activeSection}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          availableSeasons={availableSeasons}
        />

        <main className="flex-1 overflow-y-auto bg-[#0b0f14]">
          {activeSection === 'dashboard' && (
            <DashboardView
              teams={teams}
              matches={matches}
              predictions={predictions}
              onNavigate={setActiveSection}
              onSelectPrediction={handleSelectPredictionFromHistory}
            />
          )}

          {activeSection === 'teams' && (
            <TeamsView
              teams={teams}
              players={players}
              matches={matches}
              onSaveTeam={handleSaveTeam}
              onDeleteTeam={handleDeleteTeam}
            />
          )}

          {activeSection === 'players' && (
            <PlayersView
              players={players}
              teams={teams}
              onSavePlayer={handleSavePlayer}
              onDeletePlayer={handleDeletePlayer}
            />
          )}

          {activeSection === 'matches' && (
            <MatchCenterView
              matches={matches}
              teams={teams}
              selectedSeason={selectedSeason}
              onSaveMatch={handleSaveMatch}
              onDeleteMatch={handleDeleteMatch}
              onNavigateToDataEntry={navigateToDataEntry}
              onNavigateToPrediction={navigateToPrediction}
            />
          )}

          {activeSection === 'data_entry' && (
            <DataEntryView
              matches={matches}
              teams={teams}
              players={players}
              selectedMatchId={selectedMatchId}
              selectedSeason={selectedSeason}
              onSaveMatch={handleSaveMatch}
              onDeleteMatch={handleDeleteMatch}
              onNavigateToPrediction={navigateToPrediction}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsView
              teams={teams}
              matches={matches}
              selectedSeason={selectedSeason}
            />
          )}

          {activeSection === 'prediction' && (
            <PredictionView
              matches={matches}
              teams={teams}
              selectedMatchId={selectedMatchId}
              settings={settings}
              selectedSeason={selectedSeason}
              onSavePrediction={handleSavePrediction}
            />
          )}

          {activeSection === 'history' && (
            <PredictionHistoryView
              predictions={predictions}
              teams={teams}
              selectedSeason={selectedSeason}
              onDeletePrediction={handleDeletePrediction}
              onSelectPrediction={handleSelectPredictionFromHistory}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onRefreshData={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
