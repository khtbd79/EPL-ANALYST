import React from 'react';
import { Percent, TrendingUp, AlertCircle, ShieldCheck, Target, ArrowUpRight } from 'lucide-react';
import { ValueBetReport, OddsData } from '../../types/index.ts';

interface ValueBetCardProps {
  valueReport: ValueBetReport;
  odds: OddsData;
  homeTeamName: string;
  awayTeamName: string;
  thresholdPct?: number;
  onOddsChange?: (updatedOdds: OddsData) => void;
}

export const ValueBetCard: React.FC<ValueBetCardProps> = ({
  valueReport,
  odds,
  homeTeamName,
  awayTeamName,
  thresholdPct = 5.0,
  onOddsChange,
}) => {
  const { hasAnyValueBet, alerts, topValueBet, bookmakerOverroundPct } = valueReport;

  const handleOddsFieldChange = (key: keyof OddsData, valStr: string) => {
    if (!onOddsChange) return;
    const parsed = valStr ? parseFloat(valStr) : null;
    onOddsChange({
      ...odds,
      [key]: parsed && parsed > 0 ? parsed : null,
    });
  };

  return (
    <div className="bg-[#111822] border border-slate-800 rounded p-5 space-y-5">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Value Edge & Implied Probability Analyzer
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Model Fair Odds vs Market Odds
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Identifies pure statistical edge where Model Forecast exceeds Market Implied Probability (1 / Odds).
            </p>
          </div>
        </div>

        {/* Overround Margin and Status */}
        <div className="flex items-center gap-2">
          {bookmakerOverroundPct !== null && (
            <div className="text-[11px] font-mono text-slate-400 bg-[#0d1219] px-2.5 py-1 rounded border border-slate-800">
              <span>Bookmaker Margin: </span>
              <span className="text-amber-400 font-bold tabular-nums">+{bookmakerOverroundPct}%</span>
            </div>
          )}

          {hasAnyValueBet ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 border border-emerald-500/60 text-emerald-400 rounded text-xs font-mono font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>VALUE EDGE DETECTED ({alerts.filter((a) => a.isValue).length})</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-400 rounded text-xs font-mono">
              <span>NO VALUE EDGE (&gt;+{thresholdPct}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Comparative Matrix */}
      {alerts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase">
                <th className="py-2.5 px-3">Market / Selection</th>
                <th className="py-2.5 px-3 text-right">Model Probability</th>
                <th className="py-2.5 px-3 text-right">Model Fair Odds</th>
                <th className="py-2.5 px-3 text-right">Market Odds (Input)</th>
                <th className="py-2.5 px-3 text-right">Implied Probability</th>
                <th className="py-2.5 px-3 text-right">Value Edge (%)</th>
                <th className="py-2.5 px-3 text-right">CLV Advantage</th>
                <th className="py-2.5 px-3 text-center">Statistical Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((item) => {
                const isPositiveEdge = item.edgePct > 0;
                const isSignificant = item.isValue;

                // Match with respective field in odds
                const oddsFieldKey: keyof OddsData =
                  item.market === 'HOME_WIN' ? 'homeOdds'
                  : item.market === 'DRAW' ? 'drawOdds'
                  : item.market === 'AWAY_WIN' ? 'awayOdds'
                  : item.market === 'OVER_25' ? 'over25Odds'
                  : 'under25Odds';

                return (
                  <tr
                    key={item.market}
                    className={`transition-colors ${
                      isSignificant
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {item.selection}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.marketLabel}</div>
                    </td>

                    {/* Model Probability */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                      {item.modelProbPct}%
                    </td>

                    {/* Model Fair Value Odds */}
                    <td className="py-3 px-3 text-right font-bold text-slate-100 tabular-nums">
                      {item.fairOdds.toFixed(2)}
                    </td>

                    {/* Market / Bookmaker Odds with inline editing */}
                    <td className="py-3 px-3 text-right">
                      {onOddsChange ? (
                        <input
                          type="number"
                          step="0.01"
                          min="1.01"
                          value={odds[oddsFieldKey] !== null && odds[oddsFieldKey] !== undefined ? String(odds[oddsFieldKey]) : ''}
                          onChange={(e) => handleOddsFieldChange(oddsFieldKey, e.target.value)}
                          className="w-20 bg-[#0d1219] border border-slate-700 text-right px-2 py-1 rounded text-white font-mono text-xs focus:outline-none focus:border-emerald-500 tabular-nums"
                          placeholder="e.g. 2.10"
                        />
                      ) : (
                        <span className="font-bold text-slate-300 tabular-nums">
                          {item.decimalOdds.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Implied Probability */}
                    <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                      {item.impliedProbPct}%
                    </td>

                    {/* Exact Value Edge (%) */}
                    <td className="py-3 px-3 text-right tabular-nums">
                      {isPositiveEdge ? (
                        <span
                          className={`font-bold inline-block px-2 py-0.5 rounded text-xs ${
                            isSignificant
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'text-emerald-400'
                          }`}
                        >
                          +{item.edgePct}% Edge
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          No Value ({item.edgePct}%)
                        </span>
                      )}
                    </td>

                    {/* Closing Line Value Ratio */}
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className={item.clvRatio > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {item.clvRatio > 0 ? `+${(item.clvRatio * 100).toFixed(1)}%` : `${(item.clvRatio * 100).toFixed(1)}%`}
                      </span>
                    </td>

                    {/* Statistical Verdict */}
                    <td className="py-3 px-3 text-center">
                      {isSignificant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          <Target className="w-2.5 h-2.5 fill-current" />
                          VALUE EDGE
                        </span>
                      ) : isPositiveEdge ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                          Marginal Edge
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-500">
                          Fair / Negative
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-[#0d1219] rounded border border-slate-800 text-center space-y-2">
          <AlertCircle className="w-5 h-5 mx-auto text-slate-500" />
          <p className="text-xs text-slate-400 font-mono">
            Enter market decimal odds above to calculate implied probabilities and compute exact value edge percentage.
          </p>
        </div>
      )}

      {/* Methodology Footnote */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Implied Prob = 100 / Odds · Fair Odds = 100 / Model Prob · Value Edge = Model Prob - Implied Prob
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Target className="w-3 h-3 text-emerald-400" />
          <span>Strictly pure probability &amp; statistical discrepancy analysis</span>
        </div>
      </div>
    </div>
  );
};
