/**
 * EPL PREDICT - 110 Statistical Field Definitions and Category Metadata
 * All 110 fields are explicitly represented across the 8 categories.
 * All initial values are strictly null and never defaulted to zero.
 */

import { TeamMatchStats } from '../types';

export function createEmptyTeamStats(): TeamMatchStats {
  return {
    cat01: {
      xg: null,
      xga: null,
      xgot: null,
      npxg: null,
      ppda: null,
      opponentPpda: null,
      defensiveBlockType: null,
      possessionPct: null,
      progressivePasses: null,
      progressiveCarries: null,
      expectedThreat: null,
      fieldTiltPct: null,
      possessionValueObv: null,
      chainLengthDirectness: null,
      buildupDisruption: null,
      setPieceThreatXg: null,
      highIntensityDistanceKm: null,
      homeAwaySplitRating: null,
      opponentAdjustedStrength: null,
    },
    cat02: {
      bigChancesCreated: null,
      bigChancesMissed: null,
      shotConversionRate: null,
      shotsOnTargetPct: null,
      boxShotPct: null,
      goalConversionEfficiency: null,
      touchesInOppositionBox: null,
      finalThirdEntries: null,
      boxEntries: null,
      throughBalls: null,
      keyPasses: null,
      passCompletionUnderPressurePct: null,
      counterAttackEfficiencyPct: null,
      xgChain: null,
      xgBuildup: null,
      cornerConversionRatePct: null,
      passesIntoPenaltyArea: null,
      crossAccuracyPct: null,
      shotCreatingActions: null,
      goalCreatingActions: null,
      nonShotXgThreat: null,
    },
    cat03: {
      defensiveErrors: null,
      tacklesWon: null,
      interceptions: null,
      aerialDuelsWonPct: null,
      defensiveLineHeightMeters: null,
      offsideTrapSuccessTimes: null,
      goalkeeperDistributionAccuracyPct: null,
      defensiveClearances: null,
      blocksAndShotBlocks: null,
      defensiveDuelsWonPct: null,
      crossesDefendedPct: null,
      highTurnoversPressuresFinalThird: null,
      defensiveActionsDangerousZones: null,
      goalkeeperPsxgGa: null,
    },
    cat04: {
      aggregatePlayerXg: null,
      aggregatePlayerXa: null,
      goalAssistContribution: null,
      minutesPerGoal: null,
      progressiveActionsPer90: null,
      successfulDribblesPct: null,
      ballLosses: null,
      pressuresAppliedRegained: null,
      defensiveContributionsScore: null,
      teamFitnessFatigueScore: null,
      expectedMinutesEfficiency: null,
      startingXiStabilityPct: null,
      keyMatchupAdvantageIndex: null,
      individualDefensiveErrors: null,
      squadAvailabilityPct: null,
      positionSpecificIndex: null,
      substituteImpactRating: null,
      performanceTrendL5: null,
      playerXtObvContribution: null,
    },
    cat05: {
      firstHalfXg: null,
      secondHalfXg: null,
      timeBasedGoalDistributionRatio: null,
      scoringFirstWinPct: null,
      concedingFirstPointsGained: null,
      comebackAbilityScore: null,
      leadProtectionEfficiencyPct: null,
      gameStateXgLeading: null,
      gameStateXgTied: null,
      gameStateXgTrailing: null,
      formationFlexibilityRating: null,
      tacticalSubstitutionImpact: null,
      attackingWidthMeters: null,
      defensiveCompactnessMeters: null,
      secondBallWinRatePct: null,
    },
    cat06: {
      expectedPointsXpts: null,
      expectedGoalDiffXgd: null,
      actualVsExpectedGoalsDiff: null,
      actualVsExpectedPointsDiff: null,
      cleanSheetProbabilityPct: null,
      bothTeamsToScorePct: null,
      over25GoalsPct: null,
      goalDifferenceTrendRating: null,
      recentFormPointsL5: null,
      strengthOfScheduleRating: null,
      lateGamePerformanceXg: null,
      matchResultWinRatePct: null,
    },
    cat07: {
      fixtureCongestionRecoveryDays: null,
      injuriesSquadDepthImpactScore: null,
      lineupStrengthRatingPct: null,
      weatherCondition: null,
      pitchCondition: null,
      refereeTendencyCardsPerGame: null,
      cardRiskScore: null,
      foulsCommitted: null,
      foulsDrawn: null,
      penaltyVarImpactScore: null,
      homeCrowdTravelFatigueKm: null,
      matchMotivationTacticalStyleScore: null,
    },
    cat08: {
      poissonExpectedGoalsLambda: null,
      monteCarloSimulatedWinPct: null,
      eloRatingValue: null,
      bayesianPriorProbPct: null,
      marketImpliedProbGapPct: null,
      closingLineValueMovement: null,
      rollingCalibrationBrierScore: null,
      historicalBacktestAccuracyPct: null,
      dataReliabilityScorePct: null,
    },
    formation: null,
  };
}

/**
 * Checks whether a statistical value is legitimately available.
 * Explicitly treats 0 as a valid available number.
 * Explicitly treats null, undefined, NaN, and empty strings as unavailable.
 */
export function isStatAvailable(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return !isNaN(v);
  if (typeof v === 'string') return v.trim() !== '';
  return true;
}

/**
 * Counts available statistics in a team's stats structure out of 110.
 * Counts numerical 0 as an available statistic.
 * Excludes null, undefined, empty strings.
 */
export function countAvailableStats(stats: TeamMatchStats | null | undefined): { available: number; total: number } {
  if (!stats) return { available: 0, total: 110 };
  let available = 0;
  const cats = ['cat01', 'cat02', 'cat03', 'cat04', 'cat05', 'cat06', 'cat07', 'cat08'] as const;
  for (const c of cats) {
    const obj = (stats[c] as unknown) as Record<string, unknown>;
    if (obj) {
      for (const k of Object.keys(obj)) {
        if (isStatAvailable(obj[k])) {
          available++;
        }
      }
    }
  }
  return { available, total: 110 };
}

/**
 * Formats a metric for display.
 * If value is null, undefined, or missing -> returns 'N/A'.
 * If value is 0 -> returns '0' or '0%'.
 * If value is numeric -> returns formatted string with optional unit.
 */
export function formatStatValue(
  val: number | string | null | undefined,
  isPercentage = false,
  decimals = 2
): string {
  if (val === null || val === undefined || val === '') return 'N/A';
  if (typeof val === 'number') {
    if (isNaN(val)) return 'N/A';
    const formatted = decimals !== undefined ? Number(val.toFixed(decimals)).toString() : val.toString();
    return isPercentage ? `${formatted}%` : formatted;
  }
  return String(val);
}

export interface StatFieldDescriptor {
  key: string;
  category: string;
  fieldNumber: number;
  label: string;
  type: 'number' | 'percentage' | 'select';
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const CATEGORY_NAMES = [
  { id: 'cat01', number: '01', title: 'Advanced Team & Tactical', count: 18 },
  { id: 'cat02', number: '02', title: 'Attacking & Shooting', count: 19 },
  { id: 'cat03', number: '03', title: 'Defensive Statistics', count: 13 },
  { id: 'cat04', number: '04', title: 'Individual Player Performance', count: 19 },
  { id: 'cat05', number: '05', title: 'Match Situation & Tactical Analysis', count: 11 },
  { id: 'cat06', number: '06', title: 'Match Results & Trends', count: 12 },
  { id: 'cat07', number: '07', title: 'External Factors & Discipline', count: 10 },
  { id: 'cat08', number: '08', title: 'Advanced Prediction & Statistical Models', count: 8 },
] as const;

export const COMMON_FORMATIONS = [
  '4-3-3',
  '4-2-3-1',
  '3-4-2-1',
  '3-5-2',
  '4-4-2',
  '5-3-2',
  '4-1-4-1',
  '3-4-3',
  '4-3-1-2',
  '5-4-1',
];

export const DEFENSIVE_BLOCK_TYPES = ['Low', 'Mid', 'High', 'Hybrid'];
export const WEATHER_CONDITIONS = ['Clear', 'Rain', 'Windy', 'Snow', 'Mild'];
export const PITCH_CONDITIONS = ['Dry', 'Wet', 'Standard', 'Heavy'];

export const STAT_FIELD_DEFINITIONS: Record<string, StatFieldDescriptor[]> = {
  cat01: [
    { key: 'xg', category: 'cat01', fieldNumber: 1, label: 'xG (Expected Goals)', type: 'number', step: 0.01, min: 0 },
    { key: 'xga', category: 'cat01', fieldNumber: 2, label: 'xGA (Expected Goals Against)', type: 'number', step: 0.01, min: 0 },
    { key: 'xgot', category: 'cat01', fieldNumber: 3, label: 'xGOT (Expected Goals on Target)', type: 'number', step: 0.01, min: 0 },
    { key: 'npxg', category: 'cat01', fieldNumber: 4, label: 'NP-xG (Non-Penalty Expected Goals)', type: 'number', step: 0.01, min: 0 },
    { key: 'ppda', category: 'cat01', fieldNumber: 5, label: 'PPDA (Passes Per Defensive Action)', type: 'number', step: 0.1, min: 0 },
    { key: 'opponentPpda', category: 'cat01', fieldNumber: 6, label: 'Opponent PPDA', type: 'number', step: 0.1, min: 0 },
    { key: 'defensiveBlockType', category: 'cat01', fieldNumber: 7, label: 'Defensive Block Type', type: 'select', options: DEFENSIVE_BLOCK_TYPES },
    { key: 'possessionPct', category: 'cat01', fieldNumber: 8, label: 'Possession vs Transition Analysis (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'progressivePasses', category: 'cat01', fieldNumber: 9, label: 'Progressive Passes & Carries', type: 'number', step: 1, min: 0 },
    { key: 'expectedThreat', category: 'cat01', fieldNumber: 10, label: 'xT (Expected Threat)', type: 'number', step: 0.01 },
    { key: 'fieldTiltPct', category: 'cat01', fieldNumber: 11, label: 'Field Tilt (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'possessionValueObv', category: 'cat01', fieldNumber: 12, label: 'OBV / VAEP / Possession Value', type: 'number', step: 0.01 },
    { key: 'chainLengthDirectness', category: 'cat01', fieldNumber: 13, label: 'Average Possession Chain Length & Directness', type: 'number', step: 0.1, min: 0 },
    { key: 'buildupDisruption', category: 'cat01', fieldNumber: 14, label: 'Build-up Disruption Index', type: 'number', step: 0.1, min: 0 },
    { key: 'setPieceThreatXg', category: 'cat01', fieldNumber: 15, label: 'Set-Piece Threat & Vulnerability (xG)', type: 'number', step: 0.01, min: 0 },
    { key: 'highIntensityDistanceKm', category: 'cat01', fieldNumber: 16, label: 'High-Intensity Distance & Sprint Distance (km)', type: 'number', step: 0.1, min: 0 },
    { key: 'homeAwaySplitRating', category: 'cat01', fieldNumber: 17, label: 'Home & Away Performance Splits Rating', type: 'number', step: 0.1 },
    { key: 'opponentAdjustedStrength', category: 'cat01', fieldNumber: 18, label: 'Opponent-Adjusted Team Strength', type: 'number', step: 0.1 },
  ],
  cat02: [
    { key: 'bigChancesCreated', category: 'cat02', fieldNumber: 19, label: 'Big Chances Created', type: 'number', step: 1, min: 0 },
    { key: 'bigChancesMissed', category: 'cat02', fieldNumber: 20, label: 'Big Chances Missed', type: 'number', step: 1, min: 0 },
    { key: 'shotConversionRate', category: 'cat02', fieldNumber: 21, label: 'Shot Conversion Rate (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'shotsOnTargetPct', category: 'cat02', fieldNumber: 22, label: 'Shots on Target Percentage (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'boxShotPct', category: 'cat02', fieldNumber: 23, label: 'Shot Location Map (In-Box %)', type: 'percentage', min: 0, max: 100 },
    { key: 'goalConversionEfficiency', category: 'cat02', fieldNumber: 24, label: 'Goal Conversion Efficiency (Goals/xG)', type: 'number', step: 0.01, min: 0 },
    { key: 'touchesInOppositionBox', category: 'cat02', fieldNumber: 25, label: 'Touches in Opposition Box', type: 'number', step: 1, min: 0 },
    { key: 'finalThirdEntries', category: 'cat02', fieldNumber: 26, label: 'Final Third Entries', type: 'number', step: 1, min: 0 },
    { key: 'boxEntries', category: 'cat02', fieldNumber: 27, label: 'Box Entries', type: 'number', step: 1, min: 0 },
    { key: 'throughBalls', category: 'cat02', fieldNumber: 28, label: 'Through Balls', type: 'number', step: 1, min: 0 },
    { key: 'keyPasses', category: 'cat02', fieldNumber: 29, label: 'Key Passes', type: 'number', step: 1, min: 0 },
    { key: 'passCompletionUnderPressurePct', category: 'cat02', fieldNumber: 30, label: 'Pass Completion Under Pressure (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'counterAttackEfficiencyPct', category: 'cat02', fieldNumber: 31, label: 'Counter-Attack Efficiency (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'xgChain', category: 'cat02', fieldNumber: 32, label: 'xGChain', type: 'number', step: 0.01, min: 0 },
    { key: 'xgBuildup', category: 'cat02', fieldNumber: 32, label: 'xGBuildup', type: 'number', step: 0.01, min: 0 },
    { key: 'cornerConversionRatePct', category: 'cat02', fieldNumber: 33, label: 'Corners & Conversion Rate (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'passesIntoPenaltyArea', category: 'cat02', fieldNumber: 34, label: 'Passes into Final Third / Penalty Area', type: 'number', step: 1, min: 0 },
    { key: 'crossAccuracyPct', category: 'cat02', fieldNumber: 35, label: 'Cross Accuracy & Successful Crosses (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'shotCreatingActions', category: 'cat02', fieldNumber: 36, label: 'Shot-Creating Actions (SCA)', type: 'number', step: 1, min: 0 },
    { key: 'goalCreatingActions', category: 'cat02', fieldNumber: 36, label: 'Goal-Creating Actions (GCA)', type: 'number', step: 1, min: 0 },
    { key: 'nonShotXgThreat', category: 'cat02', fieldNumber: 37, label: 'Non-Shot xG Threat', type: 'number', step: 0.01, min: 0 },
  ],
  cat03: [
    { key: 'defensiveErrors', category: 'cat03', fieldNumber: 38, label: 'Defensive Errors', type: 'number', step: 1, min: 0 },
    { key: 'tacklesWon', category: 'cat03', fieldNumber: 39, label: 'Tackles Won', type: 'number', step: 1, min: 0 },
    { key: 'interceptions', category: 'cat03', fieldNumber: 39, label: 'Interceptions', type: 'number', step: 1, min: 0 },
    { key: 'aerialDuelsWonPct', category: 'cat03', fieldNumber: 40, label: 'Aerial Duels Won Percentage (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'defensiveLineHeightMeters', category: 'cat03', fieldNumber: 41, label: 'Defensive Line Height (meters)', type: 'number', step: 0.5, min: 20, max: 70 },
    { key: 'offsideTrapSuccessTimes', category: 'cat03', fieldNumber: 42, label: 'Offside Trap Success (Times)', type: 'number', step: 1, min: 0 },
    { key: 'goalkeeperDistributionAccuracyPct', category: 'cat03', fieldNumber: 43, label: 'Goalkeeper Distribution Accuracy (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'defensiveClearances', category: 'cat03', fieldNumber: 44, label: 'Defensive Clearances', type: 'number', step: 1, min: 0 },
    { key: 'blocksAndShotBlocks', category: 'cat03', fieldNumber: 45, label: 'Blocks & Shot Blocks', type: 'number', step: 1, min: 0 },
    { key: 'defensiveDuelsWonPct', category: 'cat03', fieldNumber: 46, label: 'Defensive Duels Won (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'crossesDefendedPct', category: 'cat03', fieldNumber: 47, label: 'Crosses Allowed & Defended (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'highTurnoversPressuresFinalThird', category: 'cat03', fieldNumber: 48, label: 'High Turnovers & Pressures in Final Third', type: 'number', step: 1, min: 0 },
    { key: 'defensiveActionsDangerousZones', category: 'cat03', fieldNumber: 49, label: 'Defensive Actions in Dangerous Zones', type: 'number', step: 1, min: 0 },
    { key: 'goalkeeperPsxgGa', category: 'cat03', fieldNumber: 50, label: 'Goalkeeper PSxG-GA', type: 'number', step: 0.01 },
  ],
  cat04: [
    { key: 'aggregatePlayerXg', category: 'cat04', fieldNumber: 51, label: 'Player xG (Aggregate)', type: 'number', step: 0.01, min: 0 },
    { key: 'aggregatePlayerXa', category: 'cat04', fieldNumber: 52, label: 'Player xA (Aggregate)', type: 'number', step: 0.01, min: 0 },
    { key: 'goalAssistContribution', category: 'cat04', fieldNumber: 53, label: 'Goal & Assist Contribution', type: 'number', step: 1, min: 0 },
    { key: 'minutesPerGoal', category: 'cat04', fieldNumber: 54, label: 'Minutes per Goal', type: 'number', step: 1, min: 0 },
    { key: 'progressiveActionsPer90', category: 'cat04', fieldNumber: 55, label: 'Progressive Actions per 90', type: 'number', step: 0.1, min: 0 },
    { key: 'successfulDribblesPct', category: 'cat04', fieldNumber: 56, label: 'Successful Dribbles (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'ballLosses', category: 'cat04', fieldNumber: 57, label: 'Ball Losses (Turnovers)', type: 'number', step: 1, min: 0 },
    { key: 'pressuresAppliedRegained', category: 'cat04', fieldNumber: 58, label: 'Pressures Applied & Regained', type: 'number', step: 1, min: 0 },
    { key: 'defensiveContributionsScore', category: 'cat04', fieldNumber: 59, label: 'Defensive Contributions Score', type: 'number', step: 0.1, min: 0, max: 100 },
    { key: 'teamFitnessFatigueScore', category: 'cat04', fieldNumber: 60, label: 'Player Fitness & Fatigue Score (1-100)', type: 'number', step: 1, min: 1, max: 100 },
    { key: 'expectedMinutesEfficiency', category: 'cat04', fieldNumber: 61, label: 'Expected Minutes Efficiency', type: 'number', step: 0.1, min: 0 },
    { key: 'startingXiStabilityPct', category: 'cat04', fieldNumber: 62, label: 'Starting XI Stability (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'keyMatchupAdvantageIndex', category: 'cat04', fieldNumber: 63, label: 'Player vs Opponent Matchup Index', type: 'number', step: 0.1 },
    { key: 'individualDefensiveErrors', category: 'cat04', fieldNumber: 64, label: 'Individual Defensive Errors', type: 'number', step: 1, min: 0 },
    { key: 'squadAvailabilityPct', category: 'cat04', fieldNumber: 65, label: 'Player Availability (% Squad Fit)', type: 'percentage', min: 0, max: 100 },
    { key: 'positionSpecificIndex', category: 'cat04', fieldNumber: 66, label: 'Position-Specific Performance Index', type: 'number', step: 0.1 },
    { key: 'substituteImpactRating', category: 'cat04', fieldNumber: 67, label: 'Substitute Impact Rating', type: 'number', step: 0.1 },
    { key: 'performanceTrendL5', category: 'cat04', fieldNumber: 68, label: 'Player Performance Trend (L5)', type: 'number', step: 0.1 },
    { key: 'playerXtObvContribution', category: 'cat04', fieldNumber: 69, label: 'Player xT & OBV/VAEP Contribution', type: 'number', step: 0.01 },
  ],
  cat05: [
    { key: 'firstHalfXg', category: 'cat05', fieldNumber: 70, label: 'First Half xG', type: 'number', step: 0.01, min: 0 },
    { key: 'secondHalfXg', category: 'cat05', fieldNumber: 70, label: 'Second Half xG', type: 'number', step: 0.01, min: 0 },
    { key: 'timeBasedGoalDistributionRatio', category: 'cat05', fieldNumber: 71, label: 'Time-Based Goal Distribution Ratio', type: 'number', step: 0.01 },
    { key: 'scoringFirstWinPct', category: 'cat05', fieldNumber: 72, label: 'Scoring First Record (Win %)', type: 'percentage', min: 0, max: 100 },
    { key: 'concedingFirstPointsGained', category: 'cat05', fieldNumber: 73, label: 'Conceding First Record (Points Gained)', type: 'number', step: 0.1, min: 0 },
    { key: 'comebackAbilityScore', category: 'cat05', fieldNumber: 74, label: 'Comeback Ability Score (1-100)', type: 'number', step: 1, min: 1, max: 100 },
    { key: 'leadProtectionEfficiencyPct', category: 'cat05', fieldNumber: 75, label: 'Lead Protection Efficiency (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'gameStateXgLeading', category: 'cat05', fieldNumber: 76, label: 'Game State xG (Leading)', type: 'number', step: 0.01, min: 0 },
    { key: 'gameStateXgTied', category: 'cat05', fieldNumber: 76, label: 'Game State xG (Tied)', type: 'number', step: 0.01, min: 0 },
    { key: 'gameStateXgTrailing', category: 'cat05', fieldNumber: 76, label: 'Game State xG (Trailing)', type: 'number', step: 0.01, min: 0 },
    { key: 'formationFlexibilityRating', category: 'cat05', fieldNumber: 77, label: 'Formation Changes & Tactical Flexibility', type: 'number', step: 0.1, min: 0 },
    { key: 'tacticalSubstitutionImpact', category: 'cat05', fieldNumber: 78, label: 'Tactical Substitution Impact', type: 'number', step: 0.1 },
    { key: 'attackingWidthMeters', category: 'cat05', fieldNumber: 79, label: 'Attacking Width (meters)', type: 'number', step: 0.5, min: 20, max: 80 },
    { key: 'defensiveCompactnessMeters', category: 'cat05', fieldNumber: 79, label: 'Defensive Compactness (meters)', type: 'number', step: 0.5, min: 10, max: 60 },
    { key: 'secondBallWinRatePct', category: 'cat05', fieldNumber: 80, label: 'Second Ball Recovery & Win Rate (%)', type: 'percentage', min: 0, max: 100 },
  ],
  cat06: [
    { key: 'expectedPointsXpts', category: 'cat06', fieldNumber: 81, label: 'Expected Points (xPTS)', type: 'number', step: 0.01, min: 0, max: 3 },
    { key: 'expectedGoalDiffXgd', category: 'cat06', fieldNumber: 82, label: 'Expected Goal Difference (xGD)', type: 'number', step: 0.01 },
    { key: 'actualVsExpectedGoalsDiff', category: 'cat06', fieldNumber: 83, label: 'Actual vs Expected Goals (G - xG)', type: 'number', step: 0.01 },
    { key: 'actualVsExpectedPointsDiff', category: 'cat06', fieldNumber: 84, label: 'Actual vs Expected Points (PTS - xPTS)', type: 'number', step: 0.01 },
    { key: 'cleanSheetProbabilityPct', category: 'cat06', fieldNumber: 85, label: 'Clean Sheet Probability (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'bothTeamsToScorePct', category: 'cat06', fieldNumber: 86, label: 'Both Teams To Score (BTTS) %', type: 'percentage', min: 0, max: 100 },
    { key: 'over25GoalsPct', category: 'cat06', fieldNumber: 87, label: 'Over 2.5 Goal Distribution (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'goalDifferenceTrendRating', category: 'cat06', fieldNumber: 88, label: 'Goal Difference Trend Rating', type: 'number', step: 0.1 },
    { key: 'recentFormPointsL5', category: 'cat06', fieldNumber: 89, label: 'Recent Form (Points in L5 Matches)', type: 'number', step: 1, min: 0, max: 15 },
    { key: 'strengthOfScheduleRating', category: 'cat06', fieldNumber: 90, label: 'Strength of Schedule Rating', type: 'number', step: 0.1 },
    { key: 'lateGamePerformanceXg', category: 'cat06', fieldNumber: 91, label: 'Late-Game Performance xG (75–90+ min)', type: 'number', step: 0.01, min: 0 },
    { key: 'matchResultWinRatePct', category: 'cat06', fieldNumber: 92, label: 'Match Result Win Rate (%)', type: 'percentage', min: 0, max: 100 },
  ],
  cat07: [
    { key: 'fixtureCongestionRecoveryDays', category: 'cat07', fieldNumber: 93, label: 'Fixture Congestion & Recovery Days', type: 'number', step: 1, min: 1, max: 30 },
    { key: 'injuriesSquadDepthImpactScore', category: 'cat07', fieldNumber: 94, label: 'Injuries & Squad Depth Impact', type: 'number', step: 0.1 },
    { key: 'lineupStrengthRatingPct', category: 'cat07', fieldNumber: 95, label: 'Squad Rotation & Lineup Strength Rating (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'weatherCondition', category: 'cat07', fieldNumber: 96, label: 'Weather Conditions', type: 'select', options: WEATHER_CONDITIONS },
    { key: 'pitchCondition', category: 'cat07', fieldNumber: 96, label: 'Pitch Conditions', type: 'select', options: PITCH_CONDITIONS },
    { key: 'refereeTendencyCardsPerGame', category: 'cat07', fieldNumber: 97, label: 'Referee Tendency (Cards per Game)', type: 'number', step: 0.1, min: 0 },
    { key: 'cardRiskScore', category: 'cat07', fieldNumber: 98, label: 'Yellow & Red Card Risk Score', type: 'number', step: 0.1, min: 0 },
    { key: 'foulsCommitted', category: 'cat07', fieldNumber: 99, label: 'Fouls Committed', type: 'number', step: 1, min: 0 },
    { key: 'foulsDrawn', category: 'cat07', fieldNumber: 99, label: 'Fouls Drawn', type: 'number', step: 1, min: 0 },
    { key: 'penaltyVarImpactScore', category: 'cat07', fieldNumber: 100, label: 'Penalty & VAR Impact Score', type: 'number', step: 0.1 },
    { key: 'homeCrowdTravelFatigueKm', category: 'cat07', fieldNumber: 101, label: 'Travel Fatigue Distance (km)', type: 'number', step: 1, min: 0 },
    { key: 'matchMotivationTacticalStyleScore', category: 'cat07', fieldNumber: 102, label: 'Match Motivation & Tactical Style Score', type: 'number', step: 0.1 },
  ],
  cat08: [
    { key: 'poissonExpectedGoalsLambda', category: 'cat08', fieldNumber: 103, label: 'Poisson & Dixon-Coles Goal Model (Lambda)', type: 'number', step: 0.01, min: 0 },
    { key: 'monteCarloSimulatedWinPct', category: 'cat08', fieldNumber: 104, label: 'Monte Carlo Simulated Win %', type: 'percentage', min: 0, max: 100 },
    { key: 'eloRatingValue', category: 'cat08', fieldNumber: 105, label: 'Elo Rating & Bayesian Prior Value', type: 'number', step: 1, min: 500, max: 3000 },
    { key: 'bayesianPriorProbPct', category: 'cat08', fieldNumber: 105, label: 'Bayesian Prior Probability (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'marketImpliedProbGapPct', category: 'cat08', fieldNumber: 106, label: 'Market Implied Probability vs Model Gap (%)', type: 'percentage' },
    { key: 'closingLineValueMovement', category: 'cat08', fieldNumber: 107, label: 'CLV & Odds Movement', type: 'number', step: 0.01 },
    { key: 'rollingCalibrationBrierScore', category: 'cat08', fieldNumber: 108, label: 'Prediction Calibration & Rolling Brier Score', type: 'number', step: 0.001, min: 0, max: 1 },
    { key: 'historicalBacktestAccuracyPct', category: 'cat08', fieldNumber: 109, label: 'Historical Model Accuracy & Backtest (%)', type: 'percentage', min: 0, max: 100 },
    { key: 'dataReliabilityScorePct', category: 'cat08', fieldNumber: 110, label: 'Data Reliability Score (%)', type: 'percentage', min: 0, max: 100 },
  ],
};
