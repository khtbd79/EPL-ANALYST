import React, { useState } from 'react';
import { History, Trash2, CheckCircle2, XCircle, Search, BarChart, Zap } from 'lucide-react';
import { PredictionResult, Team } from '../../types';
import { evaluateModelPerformance } from '../../engine/metrics';
import { getEligibleTeamsForSeason } from '../../utils/teamUtils';

interface PredictionHistoryViewProps {
  predictions: PredictionResult[];
  teams?: Team[];
  selectedSeason: string;
  onDeletePrediction: (id: string) => Promise<void>;
  onSelectPrediction: (pred: PredictionResult) => void;
}

export const PredictionHistoryView: React.FC<PredictionHistoryViewProps> = ({
  predictions,
  teams = [],
  selectedSeason,
  onDeletePrediction,
  onSelectPrediction,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'records' | 'calibration'>('records');

  const eligibleTeams = getEligibleTeamsForSeason(teams, selectedSeason);
  const sortedTeams = eligibleTeams.length > 0 ? eligibleTeams : [...teams].sort((a, b) => a.name.localeCompare(b.name));

  const filteredPredictions = predictions.filter((p) => {
    const matchesSeason = selectedSeason === 'ALL' || p.season === selectedSeason;
    const matchesTeam = selectedTeamId === 'ALL' || !selectedTeamId || p.homeTeamId === selectedTeamId || p.awayTeamId === selectedTeamId;
    const matchesSearch =
      p.homeTeamName.toLowerCase().includes(search.toLowerCase()) ||
      p.awayTeamName.toLowerCase().includes(search.toLowerCase()) ||
      p.predictionDate.includes(search);
    return matchesSeason && matchesTeam && matchesSearch;
  });

  const accuracyReport = evaluateModelPerformance(filteredPredictions);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Model Calibration & Brier Score Tracker Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Evaluated Matches</div>
          <div className="mt-1 text-2xl font-bold text-white tabular-nums">
            {accuracyReport.totalEvaluated}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {accuracyReport.correctOutcomes} hits recorded
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Win / Hit Rate</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">
            {accuracyReport.overallAccuracyPct !== null ? `${accuracyReport.overallAccuracyPct}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top pick outcome hit</div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Brier Score</div>
          <div className="mt-1 text-2xl font-bold text-slate-200 tabular-nums">
            {accuracyReport.avgBrierScore !== null ? accuracyReport.avgBrierScore : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {accuracyReport.avgBrierScore !== null && accuracyReport.avgBrierScore < 0.22 ? 'High Precision' : 'Calibration index'}
          </div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Brier Skill (BSS)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">
            {accuracyReport.brierSkillScorePct !== null ? `+${accuracyReport.brierSkillScorePct}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">vs random baseline</div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Avg CLV Edge</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {accuracyReport.avgCLVPct !== null ? (
              <span className={accuracyReport.avgCLVPct > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                {accuracyReport.avgCLVPct > 0 ? `+${accuracyReport.avgCLVPct}%` : `${accuracyReport.avgCLVPct}%`}
              </span>
            ) : (
              <span className="text-slate-500">N/A</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Closing line edge</div>
        </div>

        <div className="bg-[#111822] border border-slate-800 p-4 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Multi-Class Log Loss</div>
          <div className="mt-1 text-2xl font-bold text-slate-300 tabular-nums">
            {accuracyReport.avgLogLoss !== null ? accuracyReport.avgLogLoss : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Entropy penalty</div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'records'
                ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/40'
                : 'text-slate-400 hover:text-white bg-[#111822]'
            }`}
          >
            Prediction Records ({filteredPredictions.length})
          </button>
          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'calibration'
                ? 'bg-[#182333] text-emerald-400 font-semibold border border-emerald-500/40'
                : 'text-slate-400 hover:text-white bg-[#111822]'
            }`}
          >
            Calibration & Backtesting
          </button>
        </div>

        {activeTab === 'records' && (
          <div className="flex items-center gap-2 max-w-md w-full">
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter predictions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111822] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded pl-9 pr-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'records' ? (
        filteredPredictions.length === 0 ? (
          <div className="bg-[#111822] border border-slate-800 rounded p-12 text-center">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <p className="mt-3 text-xs text-slate-400 font-mono">
              {search ? 'No historical predictions match your query.' : 'No saved predictions in history.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#111822] border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Match</th>
                  <th className="py-3 px-4 text-center">Home Win %</th>
                  <th className="py-3 px-4 text-center">Draw %</th>
                  <th className="py-3 px-4 text-center">Away Win %</th>
                  <th className="py-3 px-4 text-center">Exp Score</th>
                  <th className="py-3 px-4 text-center">Actual</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-right">Brier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredPredictions.map((pred) => (
                  <tr
                    key={pred.id}
                    className="hover:bg-[#162130]/50 transition-colors cursor-pointer"
                    onClick={() => onSelectPrediction(pred)}
                  >
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {pred.predictionDate.split('T')[0]}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{pred.homeTeamName} vs {pred.awayTeamName}</span>
                        {(pred.hasValueBet || (pred.valueBets && pred.valueBets.some((v) => v.isValue))) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            Value Bet
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-emerald-400 font-semibold">
                      {pred.homeWinProb}%
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-300">
                      {pred.drawProb}%
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-blue-400 font-semibold">
                      {pred.awayWinProb}%
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-200">
                      {pred.mostLikelyScore}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums font-bold">
                      {pred.actualScore ? (
                        <span className="text-white">{pred.actualScore}</span>
                      ) : (
                        <span className="text-slate-600 font-normal">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pred.isCorrectOutcome !== null && pred.isCorrectOutcome !== undefined ? (
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] rounded ${
                            pred.isCorrectOutcome
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {pred.isCorrectOutcome ? 'Hit' : 'Miss'}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Unverified</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {pred.brierScore !== null && pred.brierScore !== undefined
                        ? pred.brierScore
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this prediction record?')) {
                            onDeletePrediction(pred.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Prediction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Calibration & Backtesting View */
        <div className="space-y-6">
          <div className="bg-[#111822] border border-slate-800 rounded p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-emerald-400" />
                  Empirical Probability Calibration Curve
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Assesses model reliability: compares predicted probabilistic confidence against actual observed outcome frequency.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Calibration Metric: <span className="text-emerald-400 font-bold">Brier Score = {accuracyReport.avgBrierScore}</span>
              </div>
            </div>

            {accuracyReport.totalEvaluated === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No verified matches available for calibration analysis yet. Record actual final scores in Match Center.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0e141c] text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Probability Bin</th>
                        <th className="py-3 px-4 text-right">Sample Count</th>
                        <th className="py-3 px-4 text-right">Avg Forecast Prob</th>
                        <th className="py-3 px-4 text-right">Actual Hit Rate</th>
                        <th className="py-3 px-4 text-right">Calibration Gap</th>
                        <th className="py-3 px-4 text-center">Visual Reliability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {accuracyReport.calibrationBins.map((bin) => {
                        const gap =
                          bin.actualObservedFreq !== null && bin.avgPredictedProb !== null
                            ? Number((bin.actualObservedFreq - bin.avgPredictedProb).toFixed(3))
                            : null;
                        const forecastPct = bin.avgPredictedProb !== null ? bin.avgPredictedProb * 100 : 0;
                        const actualPct = bin.actualObservedFreq !== null ? bin.actualObservedFreq * 100 : 0;

                        return (
                          <tr key={bin.binRange} className="hover:bg-[#162130]/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{bin.binRange}</td>
                            <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                              {bin.count}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                              {bin.avgPredictedProb !== null
                                ? `${(bin.avgPredictedProb * 100).toFixed(1)}%`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-400">
                              {bin.actualObservedFreq !== null
                                ? `${(bin.actualObservedFreq * 100).toFixed(1)}%`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {gap !== null ? (
                                <span
                                  className={
                                    Math.abs(gap) <= 0.05
                                      ? 'text-emerald-400'
                                      : 'text-amber-400'
                                  }
                                >
                                  {gap > 0 ? `+${gap}` : gap}
                                </span>
                              ) : (
                                <span className="text-slate-500">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-32 mx-auto space-y-1">
                                <div className="flex justify-between text-[9px] text-slate-400">
                                  <span>Fcst: {forecastPct.toFixed(0)}%</span>
                                  <span>Act: {actualPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-blue-500/70"
                                    style={{ width: `${Math.min(100, forecastPct)}%` }}
                                    title={`Forecast: ${forecastPct.toFixed(1)}%`}
                                  />
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${Math.min(100, actualPct)}%` }}
                                    title={`Actual: ${actualPct.toFixed(1)}%`}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical Calibration Guide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <div className="p-3 bg-[#0a0f16] border border-slate-800/80 rounded">
                    <span className="text-emerald-400 font-bold block mb-1">Brier Score Metric</span>
                    Strict proper scoring rule (BS = ⅓ · Σ(p - y)²). Scores range from 0.00 (perfect deterministic foresight) to 0.667 (naive uniform guessing).
                  </div>
                  <div className="p-3 bg-[#0a0f16] border border-slate-800/80 rounded">
                    <span className="text-blue-400 font-bold block mb-1">Brier Skill Score (BSS)</span>
                    Relative calibration advantage against the uniform uninformative benchmark (BSS = 1 - BS / 0.667). Positive values indicate positive predictive alpha.
                  </div>
                  <div className="p-3 bg-[#0a0f16] border border-slate-800/80 rounded">
                    <span className="text-purple-400 font-bold block mb-1">Closing Line Value (CLV)</span>
                    Ratio of model probability to market implied probability (P_model / P_market). Model beats closing line prices when CLV &gt; 1.000 (+0.0%).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
