/**
 * Financial Freedom Formulas
 *
 * Exact implementation of the 5 core formulas:
 * 1. LivingCost (rolling 3-month average)
 * 2. PassiveIncome (passive + semi-passive)
 * 3. CoverageRatio (PassiveIncome / LivingCost)
 * 4. Runway (LiquidAssets / LivingCost)
 * 5. FreedomScore (weighted score)
 */

/**
 * Monthly Expense Record
 */
export interface MonthlyExpense {
  month: string; // YYYY-MM format
  amount: number;
}

/**
 * Income Source
 */
export interface IncomeSource {
  type: 'active' | 'semi_passive' | 'passive';
  monthlyAmount: number;
}

/**
 * Asset
 */
export interface Asset {
  value: number;
  monthlyYield: number;
  isLiquid: boolean; // Can be converted to cash within 30 days
}

/**
 * Freedom Calculation Input
 */
export interface FreedomInput {
  monthlyExpenses: MonthlyExpense[]; // Last 3 months
  incomeSources: IncomeSource[];
  assets: Asset[];
  totalLiabilities: number;
}

/**
 * Freedom Metrics Output
 */
export interface FreedomMetrics {
  // Core metrics
  livingCost: number;
  passiveIncome: number;
  coverageRatio: number;
  runway: number;

  // Component scores
  coverageRatioScore: number;
  runwayScore: number;
  debtRatioScore: number;
  assetProductivityScore: number;

  // Final score
  freedomScore: number;

  // Supporting data
  liquidAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  debtRatio: number;
  assetProductivity: number;
}

/**
 * Formula 1: Living Cost (Rolling 3-Month Average)
 *
 * LivingCost = (Month1 + Month2 + Month3) / 3
 */
export function calculateLivingCost(monthlyExpenses: MonthlyExpense[]): number {
  if (monthlyExpenses.length === 0) return 0;

  // Take last 3 months (or however many available)
  const last3Months = monthlyExpenses.slice(-3);
  const sum = last3Months.reduce((total, expense) => total + expense.amount, 0);

  return sum / last3Months.length;
}

/**
 * Formula 2: Passive Income
 *
 * PassiveIncome = SUM(passive sources) + SUM(semi_passive sources)
 */
export function calculatePassiveIncome(incomeSources: IncomeSource[]): number {
  return incomeSources
    .filter(source => source.type === 'passive' || source.type === 'semi_passive')
    .reduce((total, source) => total + source.monthlyAmount, 0);
}

/**
 * Formula 3: Coverage Ratio
 *
 * CoverageRatio = PassiveIncome / LivingCost
 *
 * Returns as decimal (e.g., 0.75 = 75%, 1.00 = 100%)
 */
export function calculateCoverageRatio(passiveIncome: number, livingCost: number): number {
  if (livingCost === 0) return 0;
  return passiveIncome / livingCost;
}

/**
 * Formula 4: Runway
 *
 * Runway = LiquidAssets / LivingCost
 *
 * Returns number of months liquid assets will last
 */
export function calculateRunway(liquidAssets: number, livingCost: number): number {
  if (livingCost === 0) return 0;
  return liquidAssets / livingCost;
}

/**
 * Helper: Calculate Liquid Assets
 */
export function calculateLiquidAssets(assets: Asset[]): number {
  return assets
    .filter(asset => asset.isLiquid)
    .reduce((total, asset) => total + asset.value, 0);
}

/**
 * Helper: Calculate Total Assets
 */
export function calculateTotalAssets(assets: Asset[]): number {
  return assets.reduce((total, asset) => total + asset.value, 0);
}

/**
 * Helper: Calculate Total Asset Yield
 */
export function calculateTotalYield(assets: Asset[]): number {
  return assets.reduce((total, asset) => total + asset.monthlyYield, 0);
}

/**
 * Helper: Calculate Debt Ratio
 */
export function calculateDebtRatio(totalLiabilities: number, totalAssets: number): number {
  if (totalAssets === 0) return totalLiabilities > 0 ? 1 : 0;
  return totalLiabilities / totalAssets;
}

/**
 * Helper: Calculate Asset Productivity
 *
 * AssetProductivity = Total Monthly Yield / Total Asset Value
 * Returns as decimal (e.g., 0.01 = 1% monthly = 12% annually)
 */
export function calculateAssetProductivity(totalYield: number, totalAssets: number): number {
  if (totalAssets === 0) return 0;
  return totalYield / totalAssets;
}

/**
 * Formula 5.1: Coverage Ratio Score (40% of Freedom Score)
 *
 * Score = MIN(100, CoverageRatio × 100)
 */
export function calculateCoverageRatioScore(coverageRatio: number): number {
  return Math.min(100, coverageRatio * 100);
}

/**
 * Formula 5.2: Runway Score (30% of Freedom Score)
 *
 * Score = MIN(100, (Runway / 12) × 100)
 *
 * 12 months runway = 100 points
 */
export function calculateRunwayScore(runway: number): number {
  return Math.min(100, (runway / 12) * 100);
}

/**
 * Formula 5.3: Debt Ratio Score (20% of Freedom Score)
 *
 * Score = MAX(0, 100 - (DebtRatio × 100))
 *
 * 0% debt = 100 points
 * 100% debt = 0 points
 */
export function calculateDebtRatioScore(debtRatio: number): number {
  return Math.max(0, 100 - (debtRatio * 100));
}

/**
 * Formula 5.4: Asset Productivity Score (10% of Freedom Score)
 *
 * Score = MIN(100, (AssetProductivity / 0.01) × 100)
 *
 * 1% monthly yield (12% annual) = 100 points
 */
export function calculateAssetProductivityScore(assetProductivity: number): number {
  // Target is 1% monthly (0.01)
  return Math.min(100, (assetProductivity / 0.01) * 100);
}

/**
 * Formula 5: Freedom Score
 *
 * FreedomScore =
 *   (CoverageRatioScore × 0.40) +
 *   (RunwayScore × 0.30) +
 *   (DebtRatioScore × 0.20) +
 *   (AssetProductivityScore × 0.10)
 */
export function calculateFreedomScore(
  coverageRatioScore: number,
  runwayScore: number,
  debtRatioScore: number,
  assetProductivityScore: number
): number {
  return (
    coverageRatioScore * 0.40 +
    runwayScore * 0.30 +
    debtRatioScore * 0.20 +
    assetProductivityScore * 0.10
  );
}

/**
 * Calculate All Freedom Metrics
 *
 * Main function that calculates all metrics at once
 */
export function calculateAllMetrics(input: FreedomInput): FreedomMetrics {
  // 1. Living Cost (rolling 3-month average)
  const livingCost = calculateLivingCost(input.monthlyExpenses);

  // 2. Passive Income
  const passiveIncome = calculatePassiveIncome(input.incomeSources);

  // 3. Coverage Ratio
  const coverageRatio = calculateCoverageRatio(passiveIncome, livingCost);

  // Calculate asset metrics
  const liquidAssets = calculateLiquidAssets(input.assets);
  const totalAssets = calculateTotalAssets(input.assets);
  const totalYield = calculateTotalYield(input.assets);

  // 4. Runway
  const runway = calculateRunway(liquidAssets, livingCost);

  // Calculate supporting metrics
  const debtRatio = calculateDebtRatio(input.totalLiabilities, totalAssets);
  const assetProductivity = calculateAssetProductivity(totalYield, totalAssets);

  // 5. Freedom Score Components
  const coverageRatioScore = calculateCoverageRatioScore(coverageRatio);
  const runwayScore = calculateRunwayScore(runway);
  const debtRatioScore = calculateDebtRatioScore(debtRatio);
  const assetProductivityScore = calculateAssetProductivityScore(assetProductivity);

  // 5. Final Freedom Score
  const freedomScore = calculateFreedomScore(
    coverageRatioScore,
    runwayScore,
    debtRatioScore,
    assetProductivityScore
  );

  return {
    // Core metrics
    livingCost: Math.round(livingCost * 100) / 100,
    passiveIncome: Math.round(passiveIncome * 100) / 100,
    coverageRatio: Math.round(coverageRatio * 10000) / 10000,
    runway: Math.round(runway * 100) / 100,

    // Component scores
    coverageRatioScore: Math.round(coverageRatioScore * 100) / 100,
    runwayScore: Math.round(runwayScore * 100) / 100,
    debtRatioScore: Math.round(debtRatioScore * 100) / 100,
    assetProductivityScore: Math.round(assetProductivityScore * 100) / 100,

    // Final score
    freedomScore: Math.round(freedomScore * 100) / 100,

    // Supporting data
    liquidAssets: Math.round(liquidAssets * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(input.totalLiabilities * 100) / 100,
    debtRatio: Math.round(debtRatio * 10000) / 10000,
    assetProductivity: Math.round(assetProductivity * 1000000) / 1000000,
  };
}

/**
 * Interpret Freedom Score
 */
export function interpretFreedomScore(score: number): string {
  if (score >= 85) return 'Excellent - Very close to or at financial freedom';
  if (score >= 70) return 'Good - Making strong progress toward freedom';
  if (score >= 50) return 'Fair - Solid foundation, keep building';
  if (score >= 30) return 'Building - Early stage, stay focused';
  return 'Starting - Begin by reducing expenses and building income';
}

/**
 * Interpret Coverage Ratio
 */
export function interpretCoverageRatio(ratio: number): string {
  if (ratio >= 1.0) return 'Financial Freedom Achieved! 🎉';
  if (ratio >= 0.75) return 'Final Push - Almost there!';
  if (ratio >= 0.50) return 'Approaching Freedom';
  if (ratio >= 0.25) return 'Gaining Momentum';
  return 'Building Foundation';
}

/**
 * Calculate Months to Freedom
 *
 * Estimates months until Coverage Ratio reaches 100%
 * Requires monthly growth rate of passive income
 */
export function calculateMonthsToFreedom(
  currentPassiveIncome: number,
  livingCost: number,
  monthlyGrowthRate: number // percentage, e.g., 5 = 5% per month
): number | null {
  if (currentPassiveIncome >= livingCost) return 0; // Already free
  if (monthlyGrowthRate <= 0) return null; // Will never reach freedom

  // Use compound growth formula: target = current × (1 + rate)^months
  // Solving for months: months = log(target/current) / log(1 + rate)
  const targetIncome = livingCost;
  const growthFactor = 1 + (monthlyGrowthRate / 100);

  const months = Math.log(targetIncome / currentPassiveIncome) / Math.log(growthFactor);

  return Math.ceil(months);
}
