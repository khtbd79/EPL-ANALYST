import React from 'react';
import {
  Shield,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
  FileEdit,
  ArrowRight,
} from 'lucide-react';
import { Team, MatchRecord, PredictionResult } from '../../types';
import { NavSection } from '../layout/Sidebar';

interface DashboardViewProps {
  teams: Team[];
  matches: MatchRecord[];
  predictions: PredictionResult[];
  onNavigate: (section: NavSection) => void;
  onSelectPrediction: (pred: PredictionResult) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teams,
  matches,
  predictions,
  onNavigate,
  onSelectPrediction,
}) => {
  // Compute accuracy from verified predictions only
  const verifiedPredictions = predictions.filter(
    (p) =>
      typeof p.actualHomeGoals === 'number' &&
      !isNaN(p.actualHomeGoals) &&
      typeof p.actualAwayGoals === 'number' &&
      !isNaN(p.actualAwayGoals)
  );
  const correctPredictions = verifiedPredictions.filter((p) => p.isCorrectOutcome === true);
  const accuracyPct =
    verifiedPredictions.length > 0
      ? ((correctPredictions.length / verifiedPredictions.length) * 100).toFixed(1)
      : null;

  const validBriers = verifiedPredictions
    .map((p) => p.brierScore)
    .filter((b): b is number => typeof b === 'number' && !isNaN(b));

  const avgBrier =
    validBriers.length > 0
      ? (validBriers.reduce((acc, b) => acc + b, 0) / validBriers.length).toFixed(4)
      : null;

  const hasData = teams.length > 0 || matches.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* KPI Numerical Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Teams</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            {teams.length}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Matches</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            {matches.length}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Predictions</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            {predictions.length}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Verified</div>
          <div className="mt-1 text-2xl font-bold font-mono text-white tabular-nums">
            {verifiedPredictions.length}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Accuracy</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {accuracyPct !== null ? `${accuracyPct}%` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Avg Brier</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-300 tabular-nums">
            {avgBrier !== null ? avgBrier : 'N/A'}
          </div>
        </div>
      </div>

      {!hasData ? (
        /* Clean Empty State */
        <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 mx-auto rounded bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white font-mono">No Local Data Found</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            The local database is currently empty. To start generating EPL predictions, add Premier League teams and record match statistics.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('teams')}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
            >
              Add First Team
            </button>
            <button
              onClick={() => onNavigate('data_entry')}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-[#162130] hover:bg-[#1c2a3e] border border-slate-700 rounded transition-colors"
            >
              Enter Match Data
            </button>
          </div>
        </div>
      ) : (
        /* Active Data Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Predictions Table */}
          <div className="bg-[#111822] border border-slate-800 rounded p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                  Recent Predictions
                </h3>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {predictions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No predictions calculated yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {predictions.slice(0, 5).map((pred) => (
                  <div
                    key={pred.id}
                    onClick={() => onSelectPrediction(pred)}
                    className="py-3 flex items-center justify-between hover:bg-[#162130]/40 px-2 rounded cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-200">
                        {pred.homeTeamName} vs {pred.awayTeamName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>{pred.predictionDate.split('T')[0]}</span>
                        <span className="mx-1.5">·</span>
                        <span>Exp Score: {pred.mostLikelyScore}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
                        {pred.homeWinProb}% - {pred.drawProb}% - {pred.awayWinProb}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {pred.actualScore ? (
                          <span className={pred.isCorrectOutcome ? 'text-emerald-400' : 'text-rose-400'}>
                            Actual: {pred.actualScore} ({pred.isCorrectOutcome ? 'Correct' : 'Missed'})
                          </span>
                        ) : (
                          <span>Pending Result</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Matches Table */}
          <div className="bg-[#111822] border border-slate-800 rounded p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                  Recorded Matches
                </h3>
              </div>
              <button
                onClick={() => onNavigate('matches')}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono"
              >
                <span>Match Center</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No matches entered yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {matches.slice(0, 5).map((match) => {
                  const homeTeam = teams.find((t) => t.id === match.homeTeamId);
                  const awayTeam = teams.find((t) => t.id === match.awayTeamId);
                  return (
                    <div
                      key={match.id}
                      className="py-3 flex items-center justify-between hover:bg-[#162130]/40 px-2 rounded transition-colors"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-200">
                          {homeTeam?.name || 'Home'} vs {awayTeam?.name || 'Away'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{match.date}</span>
                          <span className="mx-1.5">·</span>
                          <span>{match.season}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-white tabular-nums">
                          {match.score.homeGoals !== null && match.score.awayGoals !== null
                            ? `${match.score.homeGoals} - ${match.score.awayGoals}`
                            : 'Unplayed'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {match.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
