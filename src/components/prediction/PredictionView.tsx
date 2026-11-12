import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Save,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
} from 'lucide-react';
import {
  MatchRecord,
  Team,
  AppSettings,
  PredictionResult,
} from '../../types';
import { runPredictionEngine } from '../../engine/predictionEngine';
import { calculateBrierScore, calculateLogLoss, determineOutcome } from '../../engine/metrics';
import { getEligibleTeamsForSeason } from '../../utils/teamUtils';

interface PredictionViewProps {
  matches: MatchRecord[];
  teams: Team[];
  selectedMatchId?: string | null;
  settings: AppSettings;
  selectedSeason: string;
  onSavePrediction: (pred: PredictionResult) => Promise<void>;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  matches,
  teams,
  selectedMatchId,
  settings,
  selectedSeason,
  onSavePrediction,
}) => {
  const [matchId, setMatchId] = useState<string>(selectedMatchId || '');
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedMatchId) {
      setMatchId(selectedMatchId);
      const match = matches.find((m) => m.id === selectedMatchId);
      if (match) {
        setHomeTeamId(match.homeTeamId);
        setAwayTeamId(match.awayTeamId);
      }
    } else if (matches.length > 0 && !matchId) {
      setMatchId(matches[0].id);
      setHomeTeamId(matches[0].homeTeamId);
      setAwayTeamId(matches[0].awayTeamId);
    }
  }, [selectedMatchId, matches]);

  const handleMatchSelect = (mId: string) => {
    setMatchId(mId);
    setPrediction(null);
    setSaveSuccess(false);
    const match = matches.find((m) => m.id === mId);
    if (match) {
      setHomeTeamId(match.homeTeamId);
      setAwayTeamId(match.awayTeamId);
    }
  };

  const handleRunPrediction = () => {
    const homeTeam = teams.find((t) => t.id === homeTeamId);
    const awayTeam = teams.find((t) => t.id === awayTeamId);
    if (!homeTeam || !awayTeam) return;

    setIsSimulating(true);
    setSaveSuccess(false);

    // Get match record if linked
    const match = matches.find((m) => m.id === matchId);

    setTimeout(() => {
      const pred = runPredictionEngine({
        homeTeam,
        awayTeam,
        homeStats: match?.homeStats || null,
        awayStats: match?.awayStats || null,
        historicalMatches: matches,
        settings,
        season: match?.season || (selectedSeason !== 'ALL' ? selectedSeason : '2025-2026'),
        matchId: match?.id || null,
      });

      // If match is already completed, evaluate accuracy
      if (match && match.score.homeGoals !== null && match.score.awayGoals !== null) {
        const actualOutcome = determineOutcome(match.score.homeGoals, match.score.awayGoals);
        const actualScoreStr = `${match.score.homeGoals}-${match.score.awayGoals}`;

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

        pred.actualScore = actualScoreStr;
        pred.actualHomeGoals = match.score.homeGoals;
        pred.actualAwayGoals = match.score.awayGoals;
        pred.actualOutcome = actualOutcome;
        pred.isCorrectOutcome = topOutcome === actualOutcome;
        pred.brierScore = brier;
        pred.logLoss = logloss;
      }

      setPrediction(pred);
      setIsSimulating(false);
    }, 150);
  };

  const handleSaveToHistory = async () => {
    if (!prediction) return;
    await onSavePrediction(prediction);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const eligibleTeams = getEligibleTeamsForSeason(teams, selectedSeason);
  const sortedTeams = eligibleTeams.length > 0 ? eligibleTeams : [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const homeTeam = teams.find((t) => t.id === homeTeamId);
  const awayTeam = teams.find((t) => t.id === awayTeamId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Configuration & Simulation Control */}
      <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Match Fixture</span>
              <select
                value={matchId}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="">(Manual Team Pair)</option>
                {matches.map((m) => {
                  const h = teams.find((t) => t.id === m.homeTeamId)?.name || 'Home';
                  const a = teams.find((t) => t.id === m.awayTeamId)?.name || 'Away';
                  return (
                    <option key={m.id} value={m.id}>
                      {m.date} · {h} vs {a}
                    </option>
                  );
                })}
              </select>
            </div>

            {!matchId && (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Home Team</span>
                  <select
                    value={homeTeamId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHomeTeamId(val);
                      if (awayTeamId === val) {
                        setAwayTeamId('');
                      }
                    }}
                    className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
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
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Away Team</span>
                  <select
                    value={awayTeamId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAwayTeamId(val);
                      if (homeTeamId === val) {
                        setHomeTeamId('');
                      }
                    }}
                    className="bg-[#0a0e14] border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
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
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunPrediction}
              disabled={isSimulating || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId}
              className="flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Simulating...' : 'Run Prediction Engine'}</span>
            </button>
          </div>
        </div>

        {/* Engine Configuration Metadata */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <div>
            <span>Monte Carlo Iterations:</span>{' '}
            <span className="text-white font-semibold tabular-nums">
              {settings.monteCarloIterations.toLocaleString()}
            </span>
          </div>
          <div>
            <span>Dixon-Coles Rho:</span>{' '}
            <span className="text-white font-semibold tabular-nums">{settings.dixonColesRho}</span>
          </div>
          <div>
            <span>Home Advantage Multiplier:</span>{' '}
            <span className="text-white font-semibold tabular-nums">
              {settings.homeAdvantageMultiplier}x
            </span>
          </div>
        </div>
      </div>

      {/* Prediction Output Section */}
      {prediction ? (
        <div className="space-y-6">
          {/* Main Outcome Card */}
          <div className="bg-[#111822] border border-slate-800 rounded p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Match Simulation Forecast
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {prediction.homeTeamName} vs {prediction.awayTeamName}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveToHistory}
                  disabled={saveSuccess}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#162130] hover:bg-[#1c2a3e] border border-slate-700 text-slate-200 rounded transition-colors"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Saved in History</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-slate-400" />
                      <span>Save Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3-Way Win Probability Bar & Numbers */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-3 text-center">
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase">{prediction.homeTeamName} Win</div>
                  <div className="mt-1 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {prediction.homeWinProb}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase">Draw</div>
                  <div className="mt-1 text-3xl font-extrabold font-mono text-slate-300 tabular-nums">
                    {prediction.drawProb}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase">{prediction.awayTeamName} Win</div>
                  <div className="mt-1 text-3xl font-extrabold font-mono text-blue-400 tabular-nums">
                    {prediction.awayWinProb}%
                  </div>
                </div>
              </div>

              {/* Graphical Probability Strip */}
              <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                <div
                  style={{ width: `${prediction.homeWinProb}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                  title={`Home Win: ${prediction.homeWinProb}%`}
                />
                <div
                  style={{ width: `${prediction.drawProb}%` }}
                  className="bg-slate-500 transition-all duration-300"
                  title={`Draw: ${prediction.drawProb}%`}
                />
                <div
                  style={{ width: `${prediction.awayWinProb}%` }}
                  className="bg-blue-500 transition-all duration-300"
                  title={`Away Win: ${prediction.awayWinProb}%`}
                />
              </div>
            </div>

            {/* Expected Goals Summary */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-[#0d1219] p-3 rounded border border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Exp Home Goals</div>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {prediction.expectedHomeGoals}
                </div>
              </div>
              <div className="bg-[#0d1219] p-3 rounded border border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Exp Away Goals</div>
                <div className="mt-1 text-xl font-bold font-mono text-blue-400 tabular-nums">
                  {prediction.expectedAwayGoals}
                </div>
              </div>
              <div className="bg-[#0d1219] p-3 rounded border border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Total Exp Goals</div>
                <div className="mt-1 text-xl font-bold font-mono text-white tabular-nums">
                  {prediction.totalExpectedGoals}
                </div>
              </div>
              <div className="bg-[#0d1219] p-3 rounded border border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Most Likely Score</div>
                <div className="mt-1 text-xl font-bold font-mono text-emerald-300 tabular-nums">
                  {prediction.mostLikelyScore}
                </div>
              </div>
            </div>
          </div>

          {/* Correct Scores & Goal Markets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Correct Scores Matrix */}
            <div className="bg-[#111822] border border-slate-800 rounded p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Most Likely Correct Scores
                </h4>
                <span className="text-[11px] font-mono text-slate-500">Bivariate Dixon-Coles</span>
              </div>

              <div className="space-y-2">
                {prediction.topCorrectScores.map((scoreObj, idx) => {
                  const pct = (scoreObj.probability * 100).toFixed(1);
                  return (
                    <div
                      key={scoreObj.score}
                      className="flex items-center justify-between py-1.5 px-3 bg-[#0d1219] rounded border border-slate-800/80 font-mono text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px] w-4">{idx + 1}.</span>
                        <span className="font-bold text-white tabular-nums">{scoreObj.score}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Number(pct) * 4)}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                        <span className="text-emerald-400 font-semibold tabular-nums w-12 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Goal Markets */}
            <div className="bg-[#111822] border border-slate-800 rounded p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Goal Line Markets
                </h4>
                <span className="text-[11px] font-mono text-slate-500">Calculated Distribution</span>
              </div>

              <div className="divide-y divide-slate-800/80 text-xs font-mono">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">Over 0.5 Goals</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {(prediction.over05Prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">Over 1.5 Goals</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {(prediction.over15Prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">Over 2.5 Goals</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {(prediction.over25Prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">Under 2.5 Goals</span>
                  <span className="font-bold text-slate-300 tabular-nums">
                    {(prediction.under25Prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">Both Teams To Score (BTTS)</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {(prediction.bttsProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">{prediction.homeTeamName} Clean Sheet</span>
                  <span className="font-bold text-slate-300 tabular-nums">
                    {(prediction.homeCleanSheetProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-300">{prediction.awayTeamName} Clean Sheet</span>
                  <span className="font-bold text-slate-300 tabular-nums">
                    {(prediction.awayCleanSheetProb * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Halves & Strength Analysis & Reliability */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Half Probabilities</div>
              <div className="pt-2 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">1st Half Goal Prob:</span>
                  <span className="text-white font-bold tabular-nums">
                    {(prediction.firstHalfGoalProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">2nd Half Goal Prob:</span>
                  <span className="text-white font-bold tabular-nums">
                    {(prediction.secondHalfGoalProb * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Team Strength Indices</div>
              <div className="pt-2 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Home Attack / Def:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {prediction.homeAttackStrength} / {prediction.homeDefenseStrength}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Away Attack / Def:</span>
                  <span className="text-blue-400 font-bold tabular-nums">
                    {prediction.awayAttackStrength} / {prediction.awayDefenseStrength}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#111822] border border-slate-800 rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 uppercase">
                  Data Coverage & Reliability
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    prediction.reliabilityStatus === 'SUFFICIENT'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                  }`}
                >
                  {prediction.reliabilityGrade}
                </span>
              </div>
              <div className="pt-2 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">{prediction.homeTeamName} Metrics:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {prediction.homeDataCoverageCount} / 110 ({prediction.homeDataCoveragePct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{prediction.awayTeamName} Metrics:</span>
                  <span className="text-blue-400 font-bold tabular-nums">
                    {prediction.awayDataCoverageCount} / 110 ({prediction.awayDataCoveragePct}%)
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Reliability Score:</span>
                  <span className="text-white font-bold tabular-nums">
                    {prediction.modelReliabilityScore} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {prediction.reliabilityStatus === 'INSUFFICIENT' && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/50 rounded flex items-start gap-2.5 text-xs font-mono text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold uppercase tracking-wider block">
                  Insufficient Data Coverage
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                  Very few or zero statistical metrics have been populated for this fixture. Missing metrics have been strictly excluded from mathematical calculations rather than assumed as zero.
                </span>
              </div>
            </div>
          )}

          {/* Verification with Actual Result if recorded */}
          {prediction.actualScore && (
            <div className="bg-[#111822] border border-slate-800 rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Actual Match Result Verification
                </h4>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    prediction.isCorrectOutcome
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                  }`}
                >
                  {prediction.isCorrectOutcome ? 'Outcome Hit' : 'Outcome Miss'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 font-mono text-xs">
                <div>
                  <div className="text-slate-500 text-[11px]">Final Score</div>
                  <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                    {prediction.actualScore}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Actual Outcome</div>
                  <div className="text-white font-semibold mt-0.5">{prediction.actualOutcome}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Brier Score</div>
                  <div className="text-emerald-400 font-bold tabular-nums mt-0.5">
                    {prediction.brierScore !== null && prediction.brierScore !== undefined
                      ? prediction.brierScore
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">Log Loss</div>
                  <div className="text-emerald-400 font-bold tabular-nums mt-0.5">
                    {prediction.logLoss !== null && prediction.logLoss !== undefined
                      ? prediction.logLoss
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-slate-600" />
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Select a match fixture or team pair and click "Run Prediction Engine" to compute Poisson, Dixon-Coles and Monte Carlo probabilities.
          </p>
        </div>
      )}
    </div>
  );
};
