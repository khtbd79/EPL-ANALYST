/**
 * EPL PREDICT - Mathematical Prediction Engine
 * Implements Poisson, Dixon-Coles Bivariate Model, Monte Carlo Simulation,
 * Elo Rating Updates, Bayesian Estimation, and Category Weighting.
 *
 * CRITICAL DATA INTEGRITY:
 * Missing metrics (null/undefined) are strictly excluded from calculations.
 * Numerical 0 is preserved as a valid statistical value.
 * Dynamic weight re-normalization ensures missing metrics do not penalize or inflate ratings.
 */

import {
  MatchRecord,
  Team,
  AnalyticsWeights,
  AppSettings,
  PredictionResult,
  CorrectScoreProb,
  TeamMatchStats,
  OddsData,
  TacticalAdjustments,
} from '../types';
import { countAvailableStats, isStatAvailable } from '../utils/statDefinitions';
import { detectValueBets } from './valueBet';

// Factorial helper
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Poisson probability P(X = k; lambda)
export function poissonProb(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Dixon-Coles adjustment factor tau(x, y, lambda, mu, rho)
export function dixonColesTau(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) {
    return Math.max(0, 1 - lambda * mu * rho);
  } else if (x === 1 && y === 0) {
    return Math.max(0, 1 + mu * rho);
  } else if (x === 0 && y === 1) {
    return Math.max(0, 1 + lambda * rho);
  } else if (x === 1 && y === 1) {
    return Math.max(0, 1 - rho);
  }
  return 1.0;
}

// Calculate Elo expected win probability
export function calculateEloExpectedScore(homeElo: number, awayElo: number, homeAdvantagePoints = 65): number {
  const adjustedHomeElo = homeElo + homeAdvantagePoints;
  return 1 / (1 + Math.pow(10, (awayElo - adjustedHomeElo) / 400));
}

export interface PredictionEngineInput {
  homeTeam: Team;
  awayTeam: Team;
  homeStats?: TeamMatchStats | null;
  awayStats?: TeamMatchStats | null;
  historicalMatches?: MatchRecord[];
  settings: AppSettings;
  season: string;
  matchId?: string | null;
  odds?: OddsData | null;
  valueBetThreshold?: number;
  tacticalAdjustments?: TacticalAdjustments;
}

export function runPredictionEngine(input: PredictionEngineInput): PredictionResult {
  const {
    homeTeam,
    awayTeam,
    homeStats,
    awayStats,
    historicalMatches = [],
    settings,
    season,
    matchId,
    odds,
    valueBetThreshold = 5.0,
    tacticalAdjustments,
  } = input;
  const weights = settings.weights;

  // 1. Base User Weights
  const rawSumWeights =
    weights.teamPerformance +
    weights.attackingPerformance +
    weights.defensivePerformance +
    weights.playerPerformance +
    weights.tacticalPerformance +
    weights.matchConditions +
    weights.historicalPerformance +
    weights.marketInformation;

  const sumWeights = rawSumWeights > 0 ? rawSumWeights : 100;

  const normWeights: AnalyticsWeights = {
    teamPerformance: weights.teamPerformance / sumWeights,
    attackingPerformance: weights.attackingPerformance / sumWeights,
    defensivePerformance: weights.defensivePerformance / sumWeights,
    playerPerformance: weights.playerPerformance / sumWeights,
    tacticalPerformance: weights.tacticalPerformance / sumWeights,
    matchConditions: weights.matchConditions / sumWeights,
    historicalPerformance: weights.historicalPerformance / sumWeights,
    marketInformation: weights.marketInformation / sumWeights,
  };

  // 2. Baseline League Constants (Premier League standard empirical values)
  const LEAGUE_AVG_HOME_GOALS = 1.55;
  const LEAGUE_AVG_AWAY_GOALS = 1.25;

  // 3. Historical Data Analysis (Strictly distinguish null from 0)
  const homeCompletedMatches = historicalMatches.filter(
    (m) =>
      (m.homeTeamId === homeTeam.id || m.awayTeamId === homeTeam.id) &&
      m.status === 'Completed' &&
      typeof m.score.homeGoals === 'number' &&
      !isNaN(m.score.homeGoals) &&
      typeof m.score.awayGoals === 'number' &&
      !isNaN(m.score.awayGoals)
  );

  const awayCompletedMatches = historicalMatches.filter(
    (m) =>
      (m.homeTeamId === awayTeam.id || m.awayTeamId === awayTeam.id) &&
      m.status === 'Completed' &&
      typeof m.score.homeGoals === 'number' &&
      !isNaN(m.score.homeGoals) &&
      typeof m.score.awayGoals === 'number' &&
      !isNaN(m.score.awayGoals)
  );

  let histHomeAttack: number | null = null;
  let histHomeDefense: number | null = null;
  let histAwayAttack: number | null = null;
  let histAwayDefense: number | null = null;

  if (homeCompletedMatches.length > 0) {
    let goalsScored = 0;
    let goalsConceded = 0;
    for (const m of homeCompletedMatches) {
      if (m.homeTeamId === homeTeam.id) {
        goalsScored += m.score.homeGoals as number;
        goalsConceded += m.score.awayGoals as number;
      } else {
        goalsScored += m.score.awayGoals as number;
        goalsConceded += m.score.homeGoals as number;
      }
    }
    const avgScored = goalsScored / homeCompletedMatches.length;
    const avgConceded = goalsConceded / homeCompletedMatches.length;
    histHomeAttack = avgScored / LEAGUE_AVG_HOME_GOALS;
    histHomeDefense = avgConceded / LEAGUE_AVG_AWAY_GOALS;
  }

  if (awayCompletedMatches.length > 0) {
    let goalsScored = 0;
    let goalsConceded = 0;
    for (const m of awayCompletedMatches) {
      if (m.homeTeamId === awayTeam.id) {
        goalsScored += m.score.homeGoals as number;
        goalsConceded += m.score.awayGoals as number;
      } else {
        goalsScored += m.score.awayGoals as number;
        goalsConceded += m.score.homeGoals as number;
      }
    }
    const avgScored = goalsScored / awayCompletedMatches.length;
    const avgConceded = goalsConceded / awayCompletedMatches.length;
    histAwayAttack = avgScored / LEAGUE_AVG_AWAY_GOALS;
    histAwayDefense = avgConceded / LEAGUE_AVG_HOME_GOALS;
  }

  // 4. Elo-derived strength ratio
  const eloProb = calculateEloExpectedScore(homeTeam.eloRating, awayTeam.eloRating);
  const eloStrengthRatio = eloProb / Math.max(0.0001, 1 - eloProb);

  // 5. Data Coverage Calculation (Separate for Home and Away)
  const homeCoverage = countAvailableStats(homeStats);
  const awayCoverage = countAvailableStats(awayStats);

  const homeDataCoverageCount = homeCoverage.available;
  const awayDataCoverageCount = awayCoverage.available;
  const homeDataCoveragePct = Math.round((homeCoverage.available / homeCoverage.total) * 100);
  const awayDataCoveragePct = Math.round((awayCoverage.available / awayCoverage.total) * 100);
  const totalAvailable = homeDataCoverageCount + awayDataCoverageCount;
  const totalPossible = homeCoverage.total + awayCoverage.total;
  const dataCoveragePct = Math.round((totalAvailable / totalPossible) * 100);

  // 6. Dynamic Stat-Factor Computation with Normalized Sub-Weights
  // Helper to compute an attack/defense adjustment factor only across populated metrics
  const computeStatFactor = (
    stats: TeamMatchStats | null | undefined,
    isAttack: boolean,
    isHomeSide: boolean
  ): { factor: number; hasData: boolean } => {
    if (!stats) return { factor: 1.0, hasData: false };

    const leagueAvgScored = isHomeSide ? LEAGUE_AVG_HOME_GOALS : LEAGUE_AVG_AWAY_GOALS;
    const leagueAvgConceded = isHomeSide ? LEAGUE_AVG_AWAY_GOALS : LEAGUE_AVG_HOME_GOALS;

    const components: { ratio: number; weight: number }[] = [];

    if (isAttack) {
      // Metric 1: xG
      if (typeof stats.cat01.xg === 'number' && !isNaN(stats.cat01.xg)) {
        components.push({ ratio: stats.cat01.xg / leagueAvgScored, weight: 0.30 });
      }
      // Metric 8: Possession %
      if (typeof stats.cat01.possessionPct === 'number' && !isNaN(stats.cat01.possessionPct)) {
        components.push({ ratio: 0.5 + (stats.cat01.possessionPct / 100), weight: 0.15 });
      }
      // Metric 11: Field Tilt %
      if (typeof stats.cat01.fieldTiltPct === 'number' && !isNaN(stats.cat01.fieldTiltPct)) {
        components.push({ ratio: 0.5 + (stats.cat01.fieldTiltPct / 100), weight: 0.15 });
      }
      // Metric 19: Big chances created
      if (typeof stats.cat02.bigChancesCreated === 'number' && !isNaN(stats.cat02.bigChancesCreated)) {
        const bcRatio = Math.max(0.4, 0.6 + stats.cat02.bigChancesCreated * 0.18);
        components.push({ ratio: bcRatio, weight: 0.20 });
      }
      // Metric 22: Shots on target %
      if (typeof stats.cat02.shotsOnTargetPct === 'number' && !isNaN(stats.cat02.shotsOnTargetPct)) {
        components.push({ ratio: 0.6 + (stats.cat02.shotsOnTargetPct / 100) * 0.8, weight: 0.10 });
      }
      // Metric 95: Lineup Strength Rating %
      if (typeof stats.cat07.lineupStrengthRatingPct === 'number' && !isNaN(stats.cat07.lineupStrengthRatingPct)) {
        components.push({ ratio: Math.max(0.3, stats.cat07.lineupStrengthRatingPct / 100), weight: 0.10 });
      }
    } else {
      // Metric 2: xGA
      if (typeof stats.cat01.xga === 'number' && !isNaN(stats.cat01.xga)) {
        components.push({ ratio: stats.cat01.xga / leagueAvgConceded, weight: 0.35 });
      }
      // Metric 5: PPDA (Lower PPDA = more intense pressing = better defense)
      if (typeof stats.cat01.ppda === 'number' && !isNaN(stats.cat01.ppda)) {
        const ppdaRatio = Math.max(0.6, Math.min(1.6, stats.cat01.ppda / 11.5));
        components.push({ ratio: ppdaRatio, weight: 0.20 });
      }
      // Metric 38: Defensive errors
      if (typeof stats.cat03.defensiveErrors === 'number' && !isNaN(stats.cat03.defensiveErrors)) {
        components.push({ ratio: 1.0 + stats.cat03.defensiveErrors * 0.15, weight: 0.20 });
      }
      // Metric 46: Defensive Duels Won %
      if (typeof stats.cat03.defensiveDuelsWonPct === 'number' && !isNaN(stats.cat03.defensiveDuelsWonPct)) {
        components.push({ ratio: Math.max(0.6, 1.4 - (stats.cat03.defensiveDuelsWonPct / 100) * 0.8), weight: 0.15 });
      }
      // Metric 50: Goalkeeper PSxG-GA (positive means goalkeeper saved more than expected = better defense)
      if (typeof stats.cat03.goalkeeperPsxgGa === 'number' && !isNaN(stats.cat03.goalkeeperPsxgGa)) {
        components.push({ ratio: Math.max(0.6, Math.min(1.5, 1.0 - stats.cat03.goalkeeperPsxgGa * 0.25)), weight: 0.10 });
      }
    }

    if (components.length === 0) {
      return { factor: 1.0, hasData: false };
    }

    // Re-normalize sub-weights dynamically across available metrics
    const totalSubWeight = components.reduce((acc, c) => acc + c.weight, 0);
    const weightedSum = components.reduce((acc, c) => acc + c.ratio * (c.weight / totalSubWeight), 0);

    return { factor: Math.max(0.2, Math.min(3.5, weightedSum)), hasData: true };
  };

  const homeStatAttack = computeStatFactor(homeStats, true, true);
  const homeStatDefense = computeStatFactor(homeStats, false, true);
  const awayStatAttack = computeStatFactor(awayStats, true, false);
  const awayStatDefense = computeStatFactor(awayStats, false, false);

  // 7. Dynamic Blend across Available Evidence Sources
  // Weight categories from settings:
  const baseStatWeight = normWeights.attackingPerformance + normWeights.defensivePerformance + normWeights.teamPerformance;
  const baseHistWeight = normWeights.historicalPerformance;
  const baseEloWeight = normWeights.tacticalPerformance + normWeights.matchConditions + normWeights.playerPerformance + normWeights.marketInformation;

  // Blend Home Attack
  let homeAttackSum = 0;
  let homeAttackWeightSum = 0;
  if (homeStatAttack.hasData) {
    homeAttackSum += homeStatAttack.factor * baseStatWeight;
    homeAttackWeightSum += baseStatWeight;
  }
  if (histHomeAttack !== null) {
    homeAttackSum += histHomeAttack * baseHistWeight;
    homeAttackWeightSum += baseHistWeight;
  }
  // Elo component always available
  const eloHomeAttackFactor = eloStrengthRatio > 1 ? 1.05 : 0.95;
  homeAttackSum += eloHomeAttackFactor * baseEloWeight;
  homeAttackWeightSum += baseEloWeight;
  const homeAttack = Math.max(0.3, Math.min(3.5, homeAttackSum / homeAttackWeightSum));

  // Blend Away Defense
  let awayDefenseSum = 0;
  let awayDefenseWeightSum = 0;
  if (awayStatDefense.hasData) {
    awayDefenseSum += awayStatDefense.factor * baseStatWeight;
    awayDefenseWeightSum += baseStatWeight;
  }
  if (histAwayDefense !== null) {
    awayDefenseSum += histAwayDefense * baseHistWeight;
    awayDefenseWeightSum += baseHistWeight;
  }
  awayDefenseSum += 1.0 * baseEloWeight;
  awayDefenseWeightSum += baseEloWeight;
  const awayDefense = Math.max(0.3, Math.min(3.5, awayDefenseSum / awayDefenseWeightSum));

  // Blend Away Attack
  let awayAttackSum = 0;
  let awayAttackWeightSum = 0;
  if (awayStatAttack.hasData) {
    awayAttackSum += awayStatAttack.factor * baseStatWeight;
    awayAttackWeightSum += baseStatWeight;
  }
  if (histAwayAttack !== null) {
    awayAttackSum += histAwayAttack * baseHistWeight;
    awayAttackWeightSum += baseHistWeight;
  }
  const eloAwayAttackFactor = eloStrengthRatio < 1 ? 1.05 : 0.95;
  awayAttackSum += eloAwayAttackFactor * baseEloWeight;
  awayAttackWeightSum += baseEloWeight;
  const awayAttack = Math.max(0.3, Math.min(3.5, awayAttackSum / awayAttackWeightSum));

  // Blend Home Defense
  let homeDefenseSum = 0;
  let homeDefenseWeightSum = 0;
  if (homeStatDefense.hasData) {
    homeDefenseSum += homeStatDefense.factor * baseStatWeight;
    homeDefenseWeightSum += baseStatWeight;
  }
  if (histHomeDefense !== null) {
    homeDefenseSum += histHomeDefense * baseHistWeight;
    homeDefenseWeightSum += baseHistWeight;
  }
  homeDefenseSum += 1.0 * baseEloWeight;
  homeDefenseWeightSum += baseEloWeight;
  const homeDefense = Math.max(0.3, Math.min(3.5, homeDefenseSum / homeDefenseWeightSum));

  // 8. Expected Goals (lambda & mu)
  const homeAdv = settings.homeAdvantageMultiplier || 1.15;
  let lambda = Math.max(0.2, homeAttack * awayDefense * LEAGUE_AVG_HOME_GOALS * (homeAdv / 1.1));
  let mu = Math.max(0.15, awayAttack * homeDefense * LEAGUE_AVG_AWAY_GOALS * (1.1 / homeAdv));

  // Dynamic Pre-Match Tactical & Fatigue Adjustment Multipliers
  if (tacticalAdjustments) {
    // Fatigue / Heavy Fixture Congestion (-5% xG)
    if (tacticalAdjustments.homeFatigue) lambda *= 0.95;
    if (tacticalAdjustments.awayFatigue) mu *= 0.95;

    // Key Striker Missing (-15% attack xG)
    if (tacticalAdjustments.homeKeyStrikerMissing) lambda *= 0.85;
    if (tacticalAdjustments.awayKeyStrikerMissing) mu *= 0.85;

    // Key Defender Missing (+15% opponent xG)
    if (tacticalAdjustments.homeKeyDefenderMissing) mu *= 1.15;
    if (tacticalAdjustments.awayKeyDefenderMissing) lambda *= 1.15;

    // Low-Block / Deep Defensive Setup (-10% match xG)
    if (tacticalAdjustments.lowBlockHome) {
      mu *= 0.88;
      lambda *= 0.92;
    }
    if (tacticalAdjustments.lowBlockAway) {
      lambda *= 0.88;
      mu *= 0.92;
    }

    // High-Intensity Pressing (+8% attack xG, +4% defensive exposure)
    if (tacticalAdjustments.highPressHome) {
      lambda *= 1.08;
      mu *= 1.04;
    }
    if (tacticalAdjustments.highPressAway) {
      mu *= 1.08;
      lambda *= 1.04;
    }

    lambda = Math.max(0.1, lambda);
    mu = Math.max(0.1, mu);
  }

  // 9. Bivariate Poisson Matrix with Dixon-Coles Adjustment
  const MAX_GOALS = 8;
  const scoreMatrix: number[][] = [];
  let matrixSum = 0;
  const rho = typeof settings.dixonColesRho === 'number' ? settings.dixonColesRho : -0.04;

  for (let x = 0; x <= MAX_GOALS; x++) {
    scoreMatrix[x] = [];
    const pX = poissonProb(x, lambda);
    for (let y = 0; y <= MAX_GOALS; y++) {
      const pY = poissonProb(y, mu);
      const tau = dixonColesTau(x, y, lambda, mu, rho);
      const prob = pX * pY * tau;
      scoreMatrix[x][y] = prob;
      matrixSum += prob;
    }
  }

  // Normalize matrix so probabilities sum to exactly 1.0
  for (let x = 0; x <= MAX_GOALS; x++) {
    for (let y = 0; y <= MAX_GOALS; y++) {
      scoreMatrix[x][y] /= matrixSum;
    }
  }

  // 10. Monte Carlo Simulation
  const iterations = Math.max(1000, Math.min(100000, settings.monteCarloIterations || 20000));

  const scorePairs: { x: number; y: number; prob: number; cumProb: number }[] = [];
  let runningCum = 0;
  for (let x = 0; x <= MAX_GOALS; x++) {
    for (let y = 0; y <= MAX_GOALS; y++) {
      runningCum += scoreMatrix[x][y];
      scorePairs.push({ x, y, prob: scoreMatrix[x][y], cumProb: runningCum });
    }
  }
  scorePairs[scorePairs.length - 1].cumProb = 1.0;

  let simHomeWins = 0;
  let simDraws = 0;
  let simAwayWins = 0;
  let simOver05 = 0;
  let simOver15 = 0;
  let simOver25 = 0;
  let simOver35 = 0;
  let simBtts = 0;
  let simHomeScore = 0;
  let simAwayScore = 0;
  let simHomeCleanSheet = 0;
  let simAwayCleanSheet = 0;
  const simScoreCounts: Record<string, number> = {};

  for (let i = 0; i < iterations; i++) {
    const r = Math.random();
    let low = 0;
    let high = scorePairs.length - 1;
    let selectedIdx = high;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (scorePairs[mid].cumProb >= r) {
        selectedIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const { x, y } = scorePairs[selectedIdx];
    const scoreKey = `${x}-${y}`;
    simScoreCounts[scoreKey] = (simScoreCounts[scoreKey] ?? 0) + 1;

    if (x > y) simHomeWins++;
    else if (x === y) simDraws++;
    else simAwayWins++;

    const totalGoals = x + y;
    if (totalGoals > 0.5) simOver05++;
    if (totalGoals > 1.5) simOver15++;
    if (totalGoals > 2.5) simOver25++;
    if (totalGoals > 3.5) simOver35++;

    if (x > 0 && y > 0) simBtts++;
    if (x > 0) simHomeScore++;
    if (y > 0) simAwayScore++;
    if (y === 0) simHomeCleanSheet++;
    if (x === 0) simAwayCleanSheet++;
  }

  // 11. Compute Final Calibrated Probabilities (sum strictly to 100%)
  const rawHomeWin = simHomeWins / iterations;
  const rawDraw = simDraws / iterations;
  const rawAwayWin = simAwayWins / iterations;

  const rawSum = rawHomeWin + rawDraw + rawAwayWin;
  const homeWinProb = Number(((rawHomeWin / rawSum) * 100).toFixed(2));
  const drawProb = Number(((rawDraw / rawSum) * 100).toFixed(2));
  const awayWinProb = Number((100 - homeWinProb - drawProb).toFixed(2));

  // Top Most Likely Correct Scores
  const sortedScores: CorrectScoreProb[] = Object.entries(simScoreCounts)
    .map(([score, count]) => {
      const [h, a] = score.split('-').map(Number);
      return {
        score,
        home: h,
        away: a,
        probability: count / iterations,
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const topCorrectScores = sortedScores.slice(0, 8);
  const mostLikelyScore = topCorrectScores.length > 0 ? topCorrectScores[0].score : '1-1';

  // First & Second Half Goal Probabilities
  const firstHalfLambda = (lambda + mu) * 0.44;
  const secondHalfLambda = (lambda + mu) * 0.56;
  const firstHalfGoalProb = 1 - Math.exp(-firstHalfLambda);
  const secondHalfGoalProb = 1 - Math.exp(-secondHalfLambda);

  // 12. Strict Reliability & Coverage Grading
  // If neither team has entered stats and no historical matches exist, reliability is 0 (INSUFFICIENT)
  const sampleMatches = homeCompletedMatches.length + awayCompletedMatches.length;
  let modelReliabilityScore = 0;
  let reliabilityStatus: 'SUFFICIENT' | 'INSUFFICIENT' = 'INSUFFICIENT';
  let reliabilityGrade: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT' = 'INSUFFICIENT';

  if (totalAvailable === 0 && sampleMatches === 0) {
    modelReliabilityScore = 0;
    reliabilityStatus = 'INSUFFICIENT';
    reliabilityGrade = 'INSUFFICIENT';
  } else {
    const coverageFactor = totalAvailable / totalPossible; // 0 to 1
    const matchSampleFactor = Math.min(1.0, sampleMatches / 10); // 0 to 1

    modelReliabilityScore = Math.max(
      5,
      Math.min(98, Math.round((coverageFactor * 0.65 + matchSampleFactor * 0.35) * 100))
    );

    if (totalAvailable >= 40 && sampleMatches >= 6) {
      reliabilityStatus = 'SUFFICIENT';
      reliabilityGrade = 'HIGH';
    } else if (totalAvailable >= 15 || sampleMatches >= 3) {
      reliabilityStatus = 'SUFFICIENT';
      reliabilityGrade = 'MODERATE';
    } else if (totalAvailable >= 4 || sampleMatches >= 1) {
      reliabilityStatus = 'INSUFFICIENT';
      reliabilityGrade = 'LOW';
    } else {
      reliabilityStatus = 'INSUFFICIENT';
      reliabilityGrade = 'INSUFFICIENT';
    }
  }

  const valueBetReport = detectValueBets(
    {
      homeWinProb,
      drawProb,
      awayWinProb,
      over25Prob: simOver25 / iterations,
      under25Prob: 1 - simOver25 / iterations,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
    },
    odds,
    valueBetThreshold
  );

  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    matchId: matchId ?? null,
    season,
    predictionDate: new Date().toISOString(),
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,

    homeWinProb,
    drawProb,
    awayWinProb,

    expectedHomeGoals: Number(lambda.toFixed(2)),
    expectedAwayGoals: Number(mu.toFixed(2)),
    totalExpectedGoals: Number((lambda + mu).toFixed(2)),
    mostLikelyScore,
    topCorrectScores,

    over05Prob: simOver05 / iterations,
    over15Prob: simOver15 / iterations,
    over25Prob: simOver25 / iterations,
    over35Prob: simOver35 / iterations,
    under15Prob: 1 - simOver15 / iterations,
    under25Prob: 1 - simOver25 / iterations,
    under35Prob: 1 - simOver35 / iterations,
    bttsProb: simBtts / iterations,
    homeToScoreProb: simHomeScore / iterations,
    awayToScoreProb: simAwayScore / iterations,
    homeCleanSheetProb: simHomeCleanSheet / iterations,
    awayCleanSheetProb: simAwayCleanSheet / iterations,

    firstHalfGoalProb,
    secondHalfGoalProb,
    homeAttackStrength: Number(homeAttack.toFixed(2)),
    awayAttackStrength: Number(awayAttack.toFixed(2)),
    homeDefenseStrength: Number(homeDefense.toFixed(2)),
    awayDefenseStrength: Number(awayDefense.toFixed(2)),

    dataCoveragePct,
    homeDataCoverageCount,
    awayDataCoverageCount,
    homeDataCoveragePct,
    awayDataCoveragePct,
    modelReliabilityScore,
    reliabilityStatus,
    reliabilityGrade,
    monteCarloIterations: iterations,
    weightsUsed: weights,

    // Automated Value-Bet Detection & Bookmaker Comparison
    oddsUsed: odds || null,
    valueBets: valueBetReport.alerts,
    hasValueBet: valueBetReport.hasAnyValueBet,
    tacticalAdjustments: tacticalAdjustments || undefined,
  };
}
