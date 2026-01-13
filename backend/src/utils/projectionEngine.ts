/**
 * Financial Freedom Projection Engine
 *
 * Projects the path to financial freedom based on current state and growth rates.
 * Provides multiple scenarios: optimistic, realistic, and conservative.
 */

export interface ProjectionInput {
  currentPassiveIncome: number;
  currentLivingCost: number;
  currentLiquidAssets: number;

  // Growth rates (annual percentage)
  passiveIncomeGrowthRate: number; // e.g., 10 = 10% per year
  livingCostInflationRate?: number; // e.g., 3 = 3% per year, defaults to 3%
  assetGrowthRate?: number; // e.g., 8 = 8% per year, defaults to 0%

  // Current monthly contributions
  monthlyInvestment?: number; // Additional money invested per month
  monthlyIncomeIncrease?: number; // Additional passive income added per month
}

export interface MonthlyProjection {
  month: number; // Month number (1, 2, 3...)
  date: string; // YYYY-MM format
  passiveIncome: number;
  livingCost: number;
  liquidAssets: number;
  coverageRatio: number;
  runway: number;
  isFree: boolean; // Has achieved financial freedom
}

export interface ProjectionScenario {
  name: string;
  description: string;
  freedomDate: string | null; // YYYY-MM format
  monthsToFreedom: number | null;
  yearsToFreedom: number | null;

  // Final state when freedom achieved
  finalPassiveIncome: number;
  finalLivingCost: number;
  finalCoverageRatio: number;
  finalLiquidAssets: number;

  // Monthly projections (detailed path)
  monthlyProjections: MonthlyProjection[];

  // Milestones
  milestones: ProjectionMilestone[];
}

export interface ProjectionMilestone {
  month: number;
  date: string;
  type: string;
  description: string;
  coverageRatio: number;
}

export interface ProjectionResult {
  currentState: {
    passiveIncome: number;
    livingCost: number;
    coverageRatio: number;
    liquidAssets: number;
    runway: number;
  };

  scenarios: {
    optimistic: ProjectionScenario;
    realistic: ProjectionScenario;
    conservative: ProjectionScenario;
  };

  assumptions: {
    optimistic: string[];
    realistic: string[];
    conservative: string[];
  };
}

/**
 * Convert annual rate to monthly compound rate
 */
function annualToMonthlyRate(annualRate: number): number {
  // (1 + annual)^(1/12) - 1
  return Math.pow(1 + (annualRate / 100), 1 / 12) - 1;
}

/**
 * Format date as YYYY-MM
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Generate monthly projections until freedom or max months
 */
function generateProjection(
  input: ProjectionInput,
  incomeGrowthRate: number, // monthly rate
  inflationRate: number, // monthly rate
  assetGrowthRate: number, // monthly rate
  monthlyInvestment: number,
  monthlyIncomeIncrease: number,
  maxMonths: number = 360 // 30 years max
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const startDate = new Date();

  let passiveIncome = input.currentPassiveIncome;
  let livingCost = input.currentLivingCost;
  let liquidAssets = input.currentLiquidAssets;

  for (let month = 1; month <= maxMonths; month++) {
    // Apply growth rates (compound monthly)
    passiveIncome = passiveIncome * (1 + incomeGrowthRate) + monthlyIncomeIncrease;
    livingCost = livingCost * (1 + inflationRate);
    liquidAssets = liquidAssets * (1 + assetGrowthRate) + monthlyInvestment;

    // Calculate metrics
    const coverageRatio = livingCost > 0 ? passiveIncome / livingCost : 0;
    const runway = liquidAssets > 0 && livingCost > 0 ? liquidAssets / livingCost : 0;
    const isFree = coverageRatio >= 1.0;

    // Record this month
    const projectionDate = addMonths(startDate, month);
    projections.push({
      month,
      date: formatDate(projectionDate),
      passiveIncome: Math.round(passiveIncome * 100) / 100,
      livingCost: Math.round(livingCost * 100) / 100,
      liquidAssets: Math.round(liquidAssets * 100) / 100,
      coverageRatio: Math.round(coverageRatio * 10000) / 10000,
      runway: Math.round(runway * 100) / 100,
      isFree,
    });

    // Stop if we've achieved freedom
    if (isFree) {
      break;
    }
  }

  return projections;
}

/**
 * Extract milestones from projections
 */
function extractMilestones(projections: MonthlyProjection[]): ProjectionMilestone[] {
  const milestones: ProjectionMilestone[] = [];

  const milestoneThresholds = [0.25, 0.5, 0.75, 1.0];
  let lastThreshold = 0;

  for (const projection of projections) {
    for (const threshold of milestoneThresholds) {
      if (projection.coverageRatio >= threshold && lastThreshold < threshold) {
        milestones.push({
          month: projection.month,
          date: projection.date,
          type: threshold === 1.0 ? 'freedom' : 'milestone',
          description: getMilestoneDescription(threshold),
          coverageRatio: projection.coverageRatio,
        });
        lastThreshold = threshold;
      }
    }
  }

  return milestones;
}

/**
 * Get milestone description
 */
function getMilestoneDescription(ratio: number): string {
  if (ratio >= 1.0) return 'Financial Freedom Achieved! 🎉';
  if (ratio >= 0.75) return 'Final Push - 75% coverage reached';
  if (ratio >= 0.5) return 'Halfway to Freedom - 50% coverage';
  if (ratio >= 0.25) return 'Foundation Built - 25% coverage';
  return 'Starting Journey';
}

/**
 * Build a single scenario
 */
function buildScenario(
  name: string,
  description: string,
  input: ProjectionInput,
  incomeGrowthRate: number,
  inflationRate: number,
  assetGrowthRate: number,
  monthlyInvestment: number,
  monthlyIncomeIncrease: number
): ProjectionScenario {
  // Convert annual rates to monthly compound rates
  const monthlyIncomeGrowth = annualToMonthlyRate(incomeGrowthRate);
  const monthlyInflation = annualToMonthlyRate(inflationRate);
  const monthlyAssetGrowth = annualToMonthlyRate(assetGrowthRate);

  // Generate projections
  const projections = generateProjection(
    input,
    monthlyIncomeGrowth,
    monthlyInflation,
    monthlyAssetGrowth,
    monthlyInvestment,
    monthlyIncomeIncrease
  );

  // Extract milestones
  const milestones = extractMilestones(projections);

  // Find freedom date
  const freedomProjection = projections.find(p => p.isFree);

  let freedomDate = null;
  let monthsToFreedom = null;
  let yearsToFreedom = null;
  let finalPassiveIncome = input.currentPassiveIncome;
  let finalLivingCost = input.currentLivingCost;
  let finalCoverageRatio = input.currentPassiveIncome / input.currentLivingCost;
  let finalLiquidAssets = input.currentLiquidAssets;

  if (freedomProjection) {
    freedomDate = freedomProjection.date;
    monthsToFreedom = freedomProjection.month;
    yearsToFreedom = Math.round((monthsToFreedom / 12) * 10) / 10;
    finalPassiveIncome = freedomProjection.passiveIncome;
    finalLivingCost = freedomProjection.livingCost;
    finalCoverageRatio = freedomProjection.coverageRatio;
    finalLiquidAssets = freedomProjection.liquidAssets;
  } else {
    // If not achieved within max months, use last projection
    const lastProjection = projections[projections.length - 1];
    if (lastProjection) {
      finalPassiveIncome = lastProjection.passiveIncome;
      finalLivingCost = lastProjection.livingCost;
      finalCoverageRatio = lastProjection.coverageRatio;
      finalLiquidAssets = lastProjection.liquidAssets;
    }
  }

  return {
    name,
    description,
    freedomDate,
    monthsToFreedom,
    yearsToFreedom,
    finalPassiveIncome,
    finalLivingCost,
    finalCoverageRatio,
    finalLiquidAssets,
    monthlyProjections: projections,
    milestones,
  };
}

/**
 * Project path to financial freedom with multiple scenarios
 */
export function projectFreedomPath(input: ProjectionInput): ProjectionResult {
  const currentCoverageRatio = input.currentPassiveIncome / input.currentLivingCost;
  const currentRunway = input.currentLiquidAssets / input.currentLivingCost;

  const defaultInflation = input.livingCostInflationRate ?? 3;
  const defaultAssetGrowth = input.assetGrowthRate ?? 0;
  const defaultMonthlyInvestment = input.monthlyInvestment ?? 0;
  const defaultMonthlyIncomeIncrease = input.monthlyIncomeIncrease ?? 0;

  // Optimistic Scenario: Higher growth, lower inflation
  const optimistic = buildScenario(
    'Optimistic',
    'Above-average growth with favorable conditions',
    input,
    input.passiveIncomeGrowthRate * 1.5, // 50% higher growth
    defaultInflation * 0.5, // 50% lower inflation
    defaultAssetGrowth * 1.3, // 30% better returns
    defaultMonthlyInvestment * 1.2, // 20% more investment
    defaultMonthlyIncomeIncrease * 1.3 // 30% more income increase
  );

  // Realistic Scenario: Expected growth rates
  const realistic = buildScenario(
    'Realistic',
    'Expected growth based on current trends',
    input,
    input.passiveIncomeGrowthRate,
    defaultInflation,
    defaultAssetGrowth,
    defaultMonthlyInvestment,
    defaultMonthlyIncomeIncrease
  );

  // Conservative Scenario: Lower growth, higher inflation
  const conservative = buildScenario(
    'Conservative',
    'Below-average growth with challenging conditions',
    input,
    input.passiveIncomeGrowthRate * 0.6, // 40% lower growth
    defaultInflation * 1.5, // 50% higher inflation
    defaultAssetGrowth * 0.7, // 30% worse returns
    defaultMonthlyInvestment * 0.8, // 20% less investment
    defaultMonthlyIncomeIncrease * 0.7 // 30% less income increase
  );

  return {
    currentState: {
      passiveIncome: input.currentPassiveIncome,
      livingCost: input.currentLivingCost,
      coverageRatio: currentCoverageRatio,
      liquidAssets: input.currentLiquidAssets,
      runway: currentRunway,
    },
    scenarios: {
      optimistic,
      realistic,
      conservative,
    },
    assumptions: {
      optimistic: [
        `Passive income grows at ${(input.passiveIncomeGrowthRate * 1.5).toFixed(1)}% annually`,
        `Living costs increase at ${(defaultInflation * 0.5).toFixed(1)}% annually`,
        `Assets grow at ${(defaultAssetGrowth * 1.3).toFixed(1)}% annually`,
        `Monthly investment: $${Math.round(defaultMonthlyInvestment * 1.2)}`,
        'Favorable market conditions and strong execution',
      ],
      realistic: [
        `Passive income grows at ${input.passiveIncomeGrowthRate.toFixed(1)}% annually`,
        `Living costs increase at ${defaultInflation.toFixed(1)}% annually`,
        `Assets grow at ${defaultAssetGrowth.toFixed(1)}% annually`,
        `Monthly investment: $${Math.round(defaultMonthlyInvestment)}`,
        'Normal market conditions and steady progress',
      ],
      conservative: [
        `Passive income grows at ${(input.passiveIncomeGrowthRate * 0.6).toFixed(1)}% annually`,
        `Living costs increase at ${(defaultInflation * 1.5).toFixed(1)}% annually`,
        `Assets grow at ${(defaultAssetGrowth * 0.7).toFixed(1)}% annually`,
        `Monthly investment: $${Math.round(defaultMonthlyInvestment * 0.8)}`,
        'Challenging market conditions or slower execution',
      ],
    },
  };
}

/**
 * Get a specific projection month from a scenario
 */
export function getProjectionAtMonth(scenario: ProjectionScenario, targetMonth: number): MonthlyProjection | null {
  return scenario.monthlyProjections.find(p => p.month === targetMonth) || null;
}

/**
 * Compare scenarios side by side
 */
export function compareScenarios(result: ProjectionResult): {
  metric: string;
  optimistic: string | number;
  realistic: string | number;
  conservative: string | number;
}[] {
  return [
    {
      metric: 'Freedom Date',
      optimistic: result.scenarios.optimistic.freedomDate || 'Not within 30 years',
      realistic: result.scenarios.realistic.freedomDate || 'Not within 30 years',
      conservative: result.scenarios.conservative.freedomDate || 'Not within 30 years',
    },
    {
      metric: 'Years to Freedom',
      optimistic: result.scenarios.optimistic.yearsToFreedom?.toFixed(1) || '>30',
      realistic: result.scenarios.realistic.yearsToFreedom?.toFixed(1) || '>30',
      conservative: result.scenarios.conservative.yearsToFreedom?.toFixed(1) || '>30',
    },
    {
      metric: 'Final Passive Income',
      optimistic: `$${Math.round(result.scenarios.optimistic.finalPassiveIncome).toLocaleString()}`,
      realistic: `$${Math.round(result.scenarios.realistic.finalPassiveIncome).toLocaleString()}`,
      conservative: `$${Math.round(result.scenarios.conservative.finalPassiveIncome).toLocaleString()}`,
    },
    {
      metric: 'Final Living Cost',
      optimistic: `$${Math.round(result.scenarios.optimistic.finalLivingCost).toLocaleString()}`,
      realistic: `$${Math.round(result.scenarios.realistic.finalLivingCost).toLocaleString()}`,
      conservative: `$${Math.round(result.scenarios.conservative.finalLivingCost).toLocaleString()}`,
    },
    {
      metric: 'Final Coverage Ratio',
      optimistic: `${(result.scenarios.optimistic.finalCoverageRatio * 100).toFixed(0)}%`,
      realistic: `${(result.scenarios.realistic.finalCoverageRatio * 100).toFixed(0)}%`,
      conservative: `${(result.scenarios.conservative.finalCoverageRatio * 100).toFixed(0)}%`,
    },
  ];
}
