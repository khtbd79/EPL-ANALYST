/**
 * EPL PREDICT - Data Models and Type Definitions
 * 100% Offline English Premier League Analytics & Prediction Engine
 */

export type MatchStatus = 'Scheduled' | 'Completed';
export type DefensiveBlockType = 'Low' | 'Mid' | 'High' | 'Hybrid';
export type WeatherCondition = 'Clear' | 'Rain' | 'Windy' | 'Snow' | 'Mild';
export type PitchCondition = 'Dry' | 'Wet' | 'Standard' | 'Heavy';
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  stadium: string;
  foundedYear?: number | null;
  manager?: string | null;
  eloRating: number;
  season?: string;
  seasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position: PlayerPosition;
  squadNumber?: number | null;
  nationality?: string | null;
  age?: number | null;
  fitnessScore?: number | null; // 1-100
  isAvailable: boolean;
  injuryNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 110 Statistical Fields divided into 8 distinct categories.
 * All numerical values default to null (empty) and are never treated as zero.
 */
export interface Category01AdvancedTeam {
  xg: number | null;
  xga: number | null;
  xgot: number | null;
  npxg: number | null;
  ppda: number | null;
  opponentPpda: number | null;
  defensiveBlockType: DefensiveBlockType | null;
  possessionPct: number | null;
  progressivePasses: number | null;
  progressiveCarries: number | null;
  expectedThreat: number | null;
  fieldTiltPct: number | null;
  possessionValueObv: number | null;
  chainLengthDirectness: number | null;
  buildupDisruption: number | null;
  setPieceThreatXg: number | null;
  highIntensityDistanceKm: number | null;
  homeAwaySplitRating: number | null;
  opponentAdjustedStrength: number | null;
}

export interface Category02AttackingShooting {
  bigChancesCreated: number | null;
  bigChancesMissed: number | null;
  shotConversionRate: number | null;
  shotsOnTargetPct: number | null;
  boxShotPct: number | null;
  goalConversionEfficiency: number | null;
  touchesInOppositionBox: number | null;
  finalThirdEntries: number | null;
  boxEntries: number | null;
  throughBalls: number | null;
  keyPasses: number | null;
  passCompletionUnderPressurePct: number | null;
  counterAttackEfficiencyPct: number | null;
  xgChain: number | null;
  xgBuildup: number | null;
  cornerConversionRatePct: number | null;
  passesIntoPenaltyArea: number | null;
  crossAccuracyPct: number | null;
  shotCreatingActions: number | null;
  goalCreatingActions: number | null;
  nonShotXgThreat: number | null;
}

export interface Category03Defensive {
  defensiveErrors: number | null;
  tacklesWon: number | null;
  interceptions: number | null;
  aerialDuelsWonPct: number | null;
  defensiveLineHeightMeters: number | null;
  offsideTrapSuccessTimes: number | null;
  goalkeeperDistributionAccuracyPct: number | null;
  defensiveClearances: number | null;
  blocksAndShotBlocks: number | null;
  defensiveDuelsWonPct: number | null;
  crossesDefendedPct: number | null;
  highTurnoversPressuresFinalThird: number | null;
  defensiveActionsDangerousZones: number | null;
  goalkeeperPsxgGa: number | null;
}

export interface Category04PlayerPerformance {
  aggregatePlayerXg: number | null;
  aggregatePlayerXa: number | null;
  goalAssistContribution: number | null;
  minutesPerGoal: number | null;
  progressiveActionsPer90: number | null;
  successfulDribblesPct: number | null;
  ballLosses: number | null;
  pressuresAppliedRegained: number | null;
  defensiveContributionsScore: number | null;
  teamFitnessFatigueScore: number | null;
  expectedMinutesEfficiency: number | null;
  startingXiStabilityPct: number | null;
  keyMatchupAdvantageIndex: number | null;
  individualDefensiveErrors: number | null;
  squadAvailabilityPct: number | null;
  positionSpecificIndex: number | null;
  substituteImpactRating: number | null;
  performanceTrendL5: number | null;
  playerXtObvContribution: number | null;
}

export interface Category05MatchSituation {
  firstHalfXg: number | null;
  secondHalfXg: number | null;
  timeBasedGoalDistributionRatio: number | null;
  scoringFirstWinPct: number | null;
  concedingFirstPointsGained: number | null;
  comebackAbilityScore: number | null;
  leadProtectionEfficiencyPct: number | null;
  gameStateXgLeading: number | null;
  gameStateXgTied: number | null;
  gameStateXgTrailing: number | null;
  formationFlexibilityRating: number | null;
  tacticalSubstitutionImpact: number | null;
  attackingWidthMeters: number | null;
  defensiveCompactnessMeters: number | null;
  secondBallWinRatePct: number | null;
}

export interface Category06MatchResultsTrends {
  expectedPointsXpts: number | null;
  expectedGoalDiffXgd: number | null;
  actualVsExpectedGoalsDiff: number | null;
  actualVsExpectedPointsDiff: number | null;
  cleanSheetProbabilityPct: number | null;
  bothTeamsToScorePct: number | null;
  over25GoalsPct: number | null;
  goalDifferenceTrendRating: number | null;
  recentFormPointsL5: number | null;
  strengthOfScheduleRating: number | null;
  lateGamePerformanceXg: number | null;
  matchResultWinRatePct: number | null;
}

export interface Category07ExternalDiscipline {
  fixtureCongestionRecoveryDays: number | null;
  injuriesSquadDepthImpactScore: number | null;
  lineupStrengthRatingPct: number | null;
  weatherCondition: WeatherCondition | null;
  pitchCondition: PitchCondition | null;
  refereeTendencyCardsPerGame: number | null;
  cardRiskScore: number | null;
  foulsCommitted: number | null;
  foulsDrawn: number | null;
  penaltyVarImpactScore: number | null;
  homeCrowdTravelFatigueKm: number | null;
  matchMotivationTacticalStyleScore: number | null;
}

export interface Category08AdvancedModels {
  poissonExpectedGoalsLambda: number | null;
  monteCarloSimulatedWinPct: number | null;
  eloRatingValue: number | null;
  bayesianPriorProbPct: number | null;
  marketImpliedProbGapPct: number | null;
  closingLineValueMovement: number | null;
  rollingCalibrationBrierScore: number | null;
  historicalBacktestAccuracyPct: number | null;
  dataReliabilityScorePct: number | null;
}

export interface TeamMatchStats {
  cat01: Category01AdvancedTeam;
  cat02: Category02AttackingShooting;
  cat03: Category03Defensive;
  cat04: Category04PlayerPerformance;
  cat05: Category05MatchSituation;
  cat06: Category06MatchResultsTrends;
  cat07: Category07ExternalDiscipline;
  cat08: Category08AdvancedModels;
  formation?: string | null;
}

export interface LineupEntry {
  playerId: string;
  playerName: string;
  position: PlayerPosition;
  isStarter: boolean;
  minutesPlayed?: number | null;
  xg?: number | null;
  xa?: number | null;
  rating?: number | null;
}

export interface InjuryEntry {
  playerId?: string | null;
  playerName: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  status: 'Doubtful' | 'Out' | 'Suspended';
}

export interface OddsData {
  homeOdds?: number | null;
  drawOdds?: number | null;
  awayOdds?: number | null;
  over25Odds?: number | null;
  under25Odds?: number | null;
}

export interface MatchScore {
  homeGoals: number | null;
  awayGoals: number | null;
  homeHalfGoals?: number | null;
  awayHalfGoals?: number | null;
}

export interface MatchRecord {
  id: string;
  season: string; // e.g., "2024-2025" or "2025-2026"
  date: string;   // YYYY-MM-DD
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  homeStats: TeamMatchStats;
  awayStats: TeamMatchStats;
  homeLineup: LineupEntry[];
  awayLineup: LineupEntry[];
  injuries: InjuryEntry[];
  odds: OddsData;
  score: MatchScore;
  referee?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectScoreProb {
  score: string;
  home: number;
  away: number;
  probability: number; // 0 to 1
}

export interface PredictionResult {
  id: string;
  matchId?: string | null;
  season: string;
  predictionDate: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  
  // Primary Outcome Probabilities (sum to 100%)
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;

  // Expected Goals
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  totalExpectedGoals: number;
  mostLikelyScore: string;
  topCorrectScores: CorrectScoreProb[];

  // Goal Markets Probabilities (0 to 1)
  over05Prob: number;
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  under15Prob: number;
  under25Prob: number;
  under35Prob: number;
  bttsProb: number;
  homeToScoreProb: number;
  awayToScoreProb: number;
  homeCleanSheetProb: number;
  awayCleanSheetProb: number;

  // Additional Analysis
  firstHalfGoalProb: number;
  secondHalfGoalProb: number;
  homeAttackStrength: number;
  awayAttackStrength: number;
  homeDefenseStrength: number;
  awayDefenseStrength: number;

  // Quality & Verification
  dataCoveragePct: number;
  homeDataCoverageCount: number;
  awayDataCoverageCount: number;
  homeDataCoveragePct: number;
  awayDataCoveragePct: number;
  modelReliabilityScore: number;
  reliabilityStatus: 'SUFFICIENT' | 'INSUFFICIENT';
  reliabilityGrade: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  monteCarloIterations: number;
  weightsUsed: AnalyticsWeights;

  // Actual Match Verification (if final score entered)
  actualScore?: string | null;
  actualHomeGoals?: number | null;
  actualAwayGoals?: number | null;
  actualOutcome?: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' | null;
  isCorrectOutcome?: boolean | null;
  brierScore?: number | null;
  logLoss?: number | null;
}

export interface AnalyticsWeights {
  teamPerformance: number;
  attackingPerformance: number;
  defensivePerformance: number;
  playerPerformance: number;
  tacticalPerformance: number;
  matchConditions: number;
  historicalPerformance: number;
  marketInformation: number;
}

export interface AppSettings {
  weights: AnalyticsWeights;
  monteCarloIterations: number;
  dixonColesRho: number;
  homeAdvantageMultiplier: number;
  defaultSeason: string;
  theme: 'dark';
}

export const DEFAULT_WEIGHTS: AnalyticsWeights = {
  teamPerformance: 20,
  attackingPerformance: 18,
  defensivePerformance: 18,
  playerPerformance: 12,
  tacticalPerformance: 10,
  matchConditions: 8,
  historicalPerformance: 10,
  marketInformation: 4,
};

export const DEFAULT_SETTINGS: AppSettings = {
  weights: DEFAULT_WEIGHTS,
  monteCarloIterations: 20000,
  dixonColesRho: -0.04,
  homeAdvantageMultiplier: 1.15,
  defaultSeason: '2026/27',
  theme: 'dark',
};
