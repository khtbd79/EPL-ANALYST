/**
 * EPL PREDICT - Value Edge & Implied Probability Analyzer
 * Pure Quantitative Probability Modeling & Market Edge Detection
 *
 * Mathematical Principles:
 * 1. Bookmaker Implied Probability: P_implied = (1 / DecimalOdds) * 100%
 * 2. Model Fair Value Odds: FairOdds = 100 / P_model
 * 3. Value Edge: Edge = P_model - P_implied
 * 4. Closing Line Value (CLV Ratio): CLV = (DecimalOdds / FairOdds) - 1
 * 5. Bookmaker Overround (Vigorish): Overround = (Sum(1 / Odds_1x2) - 1) * 100%
 */

import { OddsData, ValueBetAlert, ValueBetReport, ValueBetVerdict } from '../types/index.ts';

export interface ModelMarketProbabilities {
  homeWinProb: number;       // 0 - 100
  drawProb: number;          // 0 - 100
  awayWinProb: number;       // 0 - 100
  over25Prob: number;        // 0 - 1 (or 0-100)
  under25Prob: number;       // 0 - 1 (or 0-100)
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * Detects statistical value edge across markets when model probability
 * exceeds bookmaker implied probability.
 */
export function detectValueBets(
  modelProbs: ModelMarketProbabilities,
  odds?: OddsData | null,
  thresholdPct = 5.0
): ValueBetReport {
  const alerts: ValueBetAlert[] = [];

  if (!odds) {
    return {
      hasAnyValueBet: false,
      alerts: [],
      topValueBet: null,
      bookmakerOverroundPct: null,
      avgEdgePct: null,
    };
  }

  // Standardize over/under probabilities to 0-100 range
  const over25Pct = modelProbs.over25Prob > 1 ? modelProbs.over25Prob : modelProbs.over25Prob * 100;
  const under25Pct = modelProbs.under25Prob > 1 ? modelProbs.under25Prob : modelProbs.under25Prob * 100;

  // 1. Calculate Overround if 1X2 odds are provided
  let bookmakerOverroundPct: number | null = null;
  if (
    odds.homeOdds && odds.homeOdds > 1 &&
    odds.drawOdds && odds.drawOdds > 1 &&
    odds.awayOdds && odds.awayOdds > 1
  ) {
    const rawSum = (1 / odds.homeOdds) + (1 / odds.drawOdds) + (1 / odds.awayOdds);
    bookmakerOverroundPct = Number(((rawSum - 1) * 100).toFixed(2));
  }

  const checkMarket = (
    market: ValueBetAlert['market'],
    marketLabel: string,
    selection: string,
    decimalOdds: number | null | undefined,
    modelProbPct: number
  ) => {
    if (!decimalOdds || isNaN(decimalOdds) || decimalOdds <= 1) {
      return;
    }

    const impliedProbPct = Number(((1 / decimalOdds) * 100).toFixed(2));
    const normalizedModelPct = Number(modelProbPct.toFixed(2));
    const edgePct = Number((normalizedModelPct - impliedProbPct).toFixed(2));
    const fairOdds = normalizedModelPct > 0 ? Number((100 / normalizedModelPct).toFixed(2)) : 0;
    const clvRatio = fairOdds > 0 ? Number(((decimalOdds / fairOdds) - 1).toFixed(4)) : 0;
    const hasEdge = edgePct > 0;
    const isValue = edgePct >= thresholdPct;

    let verdict: ValueBetVerdict = 'NO_VALUE';
    if (edgePct >= 10.0) {
      verdict = 'STRONG_VALUE';
    } else if (edgePct >= thresholdPct) {
      verdict = 'VALUE';
    } else if (edgePct > 0) {
      verdict = 'MARGINAL_EDGE';
    }

    alerts.push({
      market,
      marketLabel,
      selection,
      decimalOdds,
      modelProbPct: normalizedModelPct,
      impliedProbPct,
      fairOdds,
      edgePct,
      clvRatio,
      hasEdge,
      isValue,
      verdict,
    });
  };

  // Evaluate Home Win
  checkMarket(
    'HOME_WIN',
    'Full Time 1X2',
    `${modelProbs.homeTeamName} Win`,
    odds.homeOdds,
    modelProbs.homeWinProb
  );

  // Evaluate Draw
  checkMarket(
    'DRAW',
    'Full Time 1X2',
    'Draw (X)',
    odds.drawOdds,
    modelProbs.drawProb
  );

  // Evaluate Away Win
  checkMarket(
    'AWAY_WIN',
    'Full Time 1X2',
    `${modelProbs.awayTeamName} Win`,
    odds.awayOdds,
    modelProbs.awayWinProb
  );

  // Evaluate Over 2.5 Goals
  checkMarket(
    'OVER_25',
    'Total Goals 2.5',
    'Over 2.5 Goals',
    odds.over25Odds,
    over25Pct
  );

  // Evaluate Under 2.5 Goals
  checkMarket(
    'UNDER_25',
    'Total Goals 2.5',
    'Under 2.5 Goals',
    odds.under25Odds,
    under25Pct
  );

  const valueAlerts = alerts.filter((a) => a.isValue);
  const sortedValueAlerts = [...valueAlerts].sort((a, b) => b.edgePct - a.edgePct);

  const totalEdge = alerts.reduce((acc, curr) => acc + curr.edgePct, 0);
  const avgEdgePct = alerts.length > 0 ? Number((totalEdge / alerts.length).toFixed(2)) : null;

  return {
    hasAnyValueBet: valueAlerts.length > 0,
    alerts,
    topValueBet: sortedValueAlerts.length > 0 ? sortedValueAlerts[0] : null,
    bookmakerOverroundPct,
    avgEdgePct,
  };
}
