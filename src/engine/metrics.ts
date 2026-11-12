/**
 * EPL PREDICT - Statistical Model Calibration & Verification Metrics
 * Computes Brier Score, Multi-class Log Loss, Calibration Curve, and Rolling Accuracy.
 *
 * CRITICAL DATA INTEGRITY:
 * When no evaluated matches exist, averages return null (rendered as N/A).
 * Actual numerical zeros are preserved and strictly distinguished from null/unverified states.
 */

import { PredictionResult } from '../types';

export interface CalibrationBin {
  binRange: string;
  minProb: number;
  maxProb: number;
  count: number;
  avgPredictedProb: number | null;
  actualObservedFreq: number | null;
}

export interface ModelAccuracyReport {
  totalEvaluated: number;
  correctOutcomes: number;
  overallAccuracyPct: number | null;
  winRatePct: number | null;
  avgBrierScore: number | null;
  brierSkillScorePct: number | null;
  avgLogLoss: number | null;
  avgCLVPct: number | null;
  homeWinAccuracyPct: number | null;
  drawAccuracyPct: number | null;
  awayWinAccuracyPct: number | null;
  calibrationBins: CalibrationBin[];
  rollingAccuracy: { date: string; accuracy: number; match: string }[];
}

/**
 * Calculates Multi-class Brier score for 1 match:
 * (1/3) * ((pH - yH)^2 + (pD - yD)^2 + (pA - yA)^2)
 */
export function calculateBrierScore(
  homeWinProb: number, // 0-100
  drawProb: number,    // 0-100
  awayWinProb: number,    // 0-100
  actualOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
): number {
  const pH = homeWinProb / 100;
  const pD = drawProb / 100;
  const pA = awayWinProb / 100;

  const yH = actualOutcome === 'HOME_WIN' ? 1 : 0;
  const yD = actualOutcome === 'DRAW' ? 1 : 0;
  const yA = actualOutcome === 'AWAY_WIN' ? 1 : 0;

  const brier = (Math.pow(pH - yH, 2) + Math.pow(pD - yD, 2) + Math.pow(pA - yA, 2)) / 3;
  return Number(brier.toFixed(4));
}

/**
 * Multi-class Log Loss:
 * - (yH * ln(pH) + yD * ln(pD) + yA * ln(pA))
 */
export function calculateLogLoss(
  homeWinProb: number,
  drawProb: number,
  awayWinProb: number,
  actualOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
): number {
  const eps = 1e-15;
  const pH = Math.max(eps, Math.min(1 - eps, homeWinProb / 100));
  const pD = Math.max(eps, Math.min(1 - eps, drawProb / 100));
  const pA = Math.max(eps, Math.min(1 - eps, awayWinProb / 100));

  let loss = 0;
  if (actualOutcome === 'HOME_WIN') loss = -Math.log(pH);
  else if (actualOutcome === 'DRAW') loss = -Math.log(pD);
  else if (actualOutcome === 'AWAY_WIN') loss = -Math.log(pA);

  return Number(loss.toFixed(4));
}

export function determineOutcome(homeGoals: number, awayGoals: number): 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' {
  if (homeGoals > awayGoals) return 'HOME_WIN';
  if (homeGoals === awayGoals) return 'DRAW';
  return 'AWAY_WIN';
}

export function evaluateModelPerformance(predictions: PredictionResult[]): ModelAccuracyReport {
  // Only evaluate predictions that have an actual score entered
  const verified = predictions.filter(
    (p) =>
      typeof p.actualHomeGoals === 'number' &&
      !isNaN(p.actualHomeGoals) &&
      typeof p.actualAwayGoals === 'number' &&
      !isNaN(p.actualAwayGoals)
  );

  if (verified.length === 0) {
    return {
      totalEvaluated: 0,
      correctOutcomes: 0,
      overallAccuracyPct: null,
      winRatePct: null,
      avgBrierScore: null,
      brierSkillScorePct: null,
      avgLogLoss: null,
      avgCLVPct: null,
      homeWinAccuracyPct: null,
      drawAccuracyPct: null,
      awayWinAccuracyPct: null,
      calibrationBins: [],
      rollingAccuracy: [],
    };
  }

  let correctCount = 0;
  let totalBrier = 0;
  let totalLogLoss = 0;
  let clvSum = 0;
  let clvCount = 0;

  let homeTotal = 0;
  let homeCorrect = 0;
  let drawTotal = 0;
  let drawCorrect = 0;
  let awayTotal = 0;
  let awayCorrect = 0;

  // Calibration bins: 5 bins [0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0]
  const bins = [
    { label: '0% - 20%', min: 0.0, max: 0.2, sumPred: 0, actualHits: 0, count: 0 },
    { label: '20% - 40%', min: 0.2, max: 0.4, sumPred: 0, actualHits: 0, count: 0 },
    { label: '40% - 60%', min: 0.4, max: 0.6, sumPred: 0, actualHits: 0, count: 0 },
    { label: '60% - 80%', min: 0.6, max: 0.8, sumPred: 0, actualHits: 0, count: 0 },
    { label: '80% - 100%', min: 0.8, max: 1.0, sumPred: 0, actualHits: 0, count: 0 },
  ];

  // Sort chronologically for rolling accuracy
  const sorted = [...verified].sort((a, b) => a.predictionDate.localeCompare(b.predictionDate));
  const rollingWindow: boolean[] = [];
  const rollingAccuracy: { date: string; accuracy: number; match: string }[] = [];

  for (const pred of sorted) {
    const outcome = determineOutcome(pred.actualHomeGoals!, pred.actualAwayGoals!);

    // Model's highest probability pick
    let predictedOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' = 'HOME_WIN';
    let maxP = pred.homeWinProb;
    if (pred.drawProb > maxP) {
      maxP = pred.drawProb;
      predictedOutcome = 'DRAW';
    }
    if (pred.awayWinProb > maxP) {
      maxP = pred.awayWinProb;
      predictedOutcome = 'AWAY_WIN';
    }

    const isCorrect = predictedOutcome === outcome;
    if (isCorrect) correctCount++;

    rollingWindow.push(isCorrect);
    if (rollingWindow.length > 5) rollingWindow.shift();
    const currentRollingAcc = Math.round(
      (rollingWindow.filter(Boolean).length / rollingWindow.length) * 100
    );
    rollingAccuracy.push({
      date: pred.predictionDate.split('T')[0],
      accuracy: currentRollingAcc,
      match: `${pred.homeTeamName} vs ${pred.awayTeamName}`,
    });

    // Breakdown
    if (outcome === 'HOME_WIN') {
      homeTotal++;
      if (isCorrect) homeCorrect++;
    } else if (outcome === 'DRAW') {
      drawTotal++;
      if (isCorrect) drawCorrect++;
    } else {
      awayTotal++;
      if (isCorrect) awayCorrect++;
    }

    // Brier & Log loss
    const brier = calculateBrierScore(pred.homeWinProb, pred.drawProb, pred.awayWinProb, outcome);
    const logloss = calculateLogLoss(pred.homeWinProb, pred.drawProb, pred.awayWinProb, outcome);
    totalBrier += brier;
    totalLogLoss += logloss;

    // Closing Line Value (CLV) Calculation
    if (pred.oddsUsed) {
      if (predictedOutcome === 'HOME_WIN' && pred.oddsUsed.homeOdds && pred.oddsUsed.homeOdds > 1) {
        const fairOdds = 100 / pred.homeWinProb;
        const clv = ((pred.oddsUsed.homeOdds / fairOdds) - 1) * 100;
        clvSum += clv;
        clvCount++;
      } else if (predictedOutcome === 'DRAW' && pred.oddsUsed.drawOdds && pred.oddsUsed.drawOdds > 1) {
        const fairOdds = 100 / pred.drawProb;
        const clv = ((pred.oddsUsed.drawOdds / fairOdds) - 1) * 100;
        clvSum += clv;
        clvCount++;
      } else if (predictedOutcome === 'AWAY_WIN' && pred.oddsUsed.awayOdds && pred.oddsUsed.awayOdds > 1) {
        const fairOdds = 100 / pred.awayWinProb;
        const clv = ((pred.oddsUsed.awayOdds / fairOdds) - 1) * 100;
        clvSum += clv;
        clvCount++;
      }
    }

    // Calibration: map each probability to bin
    const checkOutcomeInBin = (prob: number, didOccur: boolean) => {
      const p = prob / 100;
      const bin = bins.find((b) => p >= b.min && (p < b.max || (b.max === 1.0 && p <= 1.0)));
      if (bin) {
        bin.count++;
        bin.sumPred += p;
        if (didOccur) bin.actualHits++;
      }
    };

    checkOutcomeInBin(pred.homeWinProb, outcome === 'HOME_WIN');
    checkOutcomeInBin(pred.drawProb, outcome === 'DRAW');
    checkOutcomeInBin(pred.awayWinProb, outcome === 'AWAY_WIN');
  }

  const calibrationBins: CalibrationBin[] = bins.map((b) => ({
    binRange: b.label,
    minProb: b.min,
    maxProb: b.max,
    count: b.count,
    avgPredictedProb: b.count > 0 ? Number((b.sumPred / b.count).toFixed(3)) : null,
    actualObservedFreq: b.count > 0 ? Number((b.actualHits / b.count).toFixed(3)) : null,
  }));

  const avgBrier = Number((totalBrier / verified.length).toFixed(4));
  const brierSkillScore = Number(((1 - (avgBrier / 0.6667)) * 100).toFixed(1));
  const avgCLV = clvCount > 0 ? Number((clvSum / clvCount).toFixed(2)) : null;

  return {
    totalEvaluated: verified.length,
    correctOutcomes: correctCount,
    overallAccuracyPct: Number(((correctCount / verified.length) * 100).toFixed(1)),
    winRatePct: Number(((correctCount / verified.length) * 100).toFixed(1)),
    avgBrierScore: avgBrier,
    brierSkillScorePct: brierSkillScore,
    avgLogLoss: Number((totalLogLoss / verified.length).toFixed(4)),
    avgCLVPct: avgCLV,
    homeWinAccuracyPct: homeTotal > 0 ? Number(((homeCorrect / homeTotal) * 100).toFixed(1)) : null,
    drawAccuracyPct: drawTotal > 0 ? Number(((drawCorrect / drawTotal) * 100).toFixed(1)) : null,
    awayWinAccuracyPct: awayTotal > 0 ? Number(((awayCorrect / awayTotal) * 100).toFixed(1)) : null,
    calibrationBins,
    rollingAccuracy,
  };
}
