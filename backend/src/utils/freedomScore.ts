/**
 * Financial Freedom Score Calculator
 *
 * Calculates a comprehensive score (0-100) that represents progress toward financial independence
 * Based on multiple weighted factors
 */

export interface FreedomMetrics {
  passiveIncome: number;
  monthlyLivingCost: number;
  emergencyFund: number;
  totalAssets: number;
  totalLiabilities: number;
  activeIncomeEngines: number;
  targetIncomeEngines: number;
  previousNetWorth?: number; // for growth calculation
}

export interface FreedomScoreBreakdown {
  totalScore: number;
  coverageRatio: number;
  coverageRatioScore: number;
  emergencyFundScore: number;
  debtScore: number;
  incomeDiversityScore: number;
  netWorthGrowthScore: number;
}

/**
 * Calculate the coverage ratio (passive income / living cost)
 */
export function calculateCoverageRatio(passiveIncome: number, livingCost: number): number {
  if (livingCost === 0) return 0;
  return passiveIncome / livingCost;
}

/**
 * Calculate coverage ratio score (0-100)
 * 100 = passive income covers 100% of living costs or more
 */
function calculateCoverageRatioScore(passiveIncome: number, livingCost: number): number {
  if (livingCost === 0) return 100;
  const ratio = passiveIncome / livingCost;
  return Math.min(100, ratio * 100);
}

/**
 * Calculate emergency fund score (0-100)
 * 100 = emergency fund covers 12+ months of living costs
 */
function calculateEmergencyFundScore(emergencyFund: number, livingCost: number): number {
  if (livingCost === 0) return 100;
  const monthsCovered = emergencyFund / livingCost;
  const targetMonths = 12;
  return Math.min(100, (monthsCovered / targetMonths) * 100);
}

/**
 * Calculate debt score (0-100)
 * 100 = no debt or debt ratio < 20%
 * 0 = debt ratio >= 100%
 */
function calculateDebtScore(totalAssets: number, totalLiabilities: number): number {
  if (totalAssets === 0) {
    return totalLiabilities === 0 ? 100 : 0;
  }

  const debtRatio = (totalLiabilities / totalAssets) * 100;

  // Perfect score if debt ratio is 20% or less
  if (debtRatio <= 20) return 100;

  // Linear decline from 100 at 20% to 0 at 100%
  return Math.max(0, 100 - ((debtRatio - 20) * 1.25));
}

/**
 * Calculate income diversity score (0-100)
 * 100 = met or exceeded target number of income engines
 */
function calculateIncomeDiversityScore(
  activeEngines: number,
  targetEngines: number
): number {
  if (targetEngines === 0) return 100;
  return Math.min(100, (activeEngines / targetEngines) * 100);
}

/**
 * Calculate net worth growth score (0-100)
 * Based on comparison with previous net worth
 * 100 = significant growth, 50 = no change, 0 = significant decline
 */
function calculateNetWorthGrowthScore(
  currentNetWorth: number,
  previousNetWorth?: number
): number {
  if (previousNetWorth === undefined || previousNetWorth === 0) {
    return 50; // neutral score if no previous data
  }

  const growthRate = ((currentNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 100;

  // Map growth rate to 0-100 score
  // +10% or more = 100 points
  // 0% = 50 points
  // -10% or worse = 0 points
  if (growthRate >= 10) return 100;
  if (growthRate <= -10) return 0;

  // Linear interpolation between -10% and +10%
  return 50 + (growthRate * 2.5);
}

/**
 * Calculate runway (months until money runs out)
 */
export function calculateRunway(
  emergencyFund: number,
  passiveIncome: number,
  livingCost: number
): number | null {
  const netMonthly = passiveIncome - livingCost;

  // If passive income >= living cost, runway is infinite
  if (netMonthly >= 0) return null;

  // Calculate months until emergency fund depletes
  const monthlyDeficit = Math.abs(netMonthly);
  if (monthlyDeficit === 0) return null;

  return emergencyFund / monthlyDeficit;
}

/**
 * Calculate comprehensive Freedom Score
 */
export function calculateFreedomScore(metrics: FreedomMetrics): FreedomScoreBreakdown {
  const currentNetWorth = metrics.totalAssets - metrics.totalLiabilities;

  // Calculate individual component scores
  const coverageRatioScore = calculateCoverageRatioScore(
    metrics.passiveIncome,
    metrics.monthlyLivingCost
  );

  const emergencyFundScore = calculateEmergencyFundScore(
    metrics.emergencyFund,
    metrics.monthlyLivingCost
  );

  const debtScore = calculateDebtScore(
    metrics.totalAssets,
    metrics.totalLiabilities
  );

  const incomeDiversityScore = calculateIncomeDiversityScore(
    metrics.activeIncomeEngines,
    metrics.targetIncomeEngines
  );

  const netWorthGrowthScore = calculateNetWorthGrowthScore(
    currentNetWorth,
    metrics.previousNetWorth
  );

  // Weighted average calculation
  const totalScore =
    coverageRatioScore * 0.35 +
    emergencyFundScore * 0.20 +
    debtScore * 0.20 +
    incomeDiversityScore * 0.15 +
    netWorthGrowthScore * 0.10;

  const coverageRatio = calculateCoverageRatio(
    metrics.passiveIncome,
    metrics.monthlyLivingCost
  );

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    coverageRatio: Math.round(coverageRatio * 10000) / 10000,
    coverageRatioScore: Math.round(coverageRatioScore * 100) / 100,
    emergencyFundScore: Math.round(emergencyFundScore * 100) / 100,
    debtScore: Math.round(debtScore * 100) / 100,
    incomeDiversityScore: Math.round(incomeDiversityScore * 100) / 100,
    netWorthGrowthScore: Math.round(netWorthGrowthScore * 100) / 100,
  };
}

/**
 * Project the date when passive income will equal living costs
 */
export function projectFreedomDate(
  currentPassiveIncome: number,
  livingCost: number,
  monthlyGrowthRate: number // percentage per month
): Date | null {
  // Already financially free
  if (currentPassiveIncome >= livingCost) {
    return new Date();
  }

  // No growth = never reach freedom
  if (monthlyGrowthRate <= 0) {
    return null;
  }

  // Calculate months needed using compound growth formula
  // target = current * (1 + rate)^months
  // months = log(target/current) / log(1 + rate)
  const monthsNeeded = Math.log(livingCost / currentPassiveIncome) /
                       Math.log(1 + (monthlyGrowthRate / 100));

  if (!isFinite(monthsNeeded) || monthsNeeded < 0) {
    return null;
  }

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + Math.ceil(monthsNeeded));

  return freedomDate;
}
