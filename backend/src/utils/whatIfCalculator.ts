/**
 * What If Calculator
 *
 * Calculates the impact of financial changes on freedom date
 * Includes risk scoring for each scenario
 */

import { projectFreedomPath, type ProjectionInput } from './projectionEngine';

export interface WhatIfInput {
  // Current state
  currentPassiveIncome: number;
  currentLivingCost: number;
  currentLiquidAssets: number;
  currentGrowthRate: number;

  // What-if changes
  additionalIncome?: number; // +X per month
  investmentAmount?: number; // One-time Y
  investmentROI?: number; // Annual % return
  expenseReduction?: number; // -A per month
  expenseReductionPercent?: number; // -A% of current
}

export interface RiskFactors {
  incomeVolatility: number; // 0-10 (higher = riskier)
  investmentRisk: number; // 0-10
  expenseStability: number; // 0-10 (higher = harder to maintain)
  diversification: number; // 0-10 (lower = riskier)
  liquidityRisk: number; // 0-10
}

export interface RiskScore {
  overall: number; // 0-100 (0=very risky, 100=very safe)
  category: 'Low' | 'Medium' | 'High' | 'Very High';
  factors: RiskFactors;
  recommendations: string[];
}

export interface WhatIfResult {
  // Current scenario
  current: {
    freedomDate: string | null;
    monthsToFreedom: number | null;
    yearsToFreedom: number | null;
    passiveIncome: number;
    livingCost: number;
    coverageRatio: number;
  };

  // New scenario
  projected: {
    freedomDate: string | null;
    monthsToFreedom: number | null;
    yearsToFreedom: number | null;
    passiveIncome: number;
    livingCost: number;
    coverageRatio: number;
    liquidAssets: number;
  };

  // Impact
  impact: {
    monthsAccelerated: number;
    yearsAccelerated: number;
    coverageRatioImprovement: number;
    netWorthChange: number;
    percentageImprovement: number;
  };

  // Risk assessment
  risk: RiskScore;

  // Changes applied
  changes: {
    incomeIncrease: number;
    investmentAmount: number;
    investmentYield: number;
    expenseReduction: number;
  };
}

/**
 * Calculate risk score based on scenario
 */
function calculateRiskScore(
  input: WhatIfInput,
  changes: WhatIfResult['changes']
): RiskScore {
  const factors: RiskFactors = {
    incomeVolatility: 5,
    investmentRisk: 5,
    expenseStability: 5,
    diversification: 5,
    liquidityRisk: 5,
  };

  const recommendations: string[] = [];

  // 1. Income Volatility Risk
  if (changes.incomeIncrease > 0) {
    const incomeIncreasePercent = (changes.incomeIncrease / input.currentPassiveIncome) * 100;

    if (incomeIncreasePercent > 100) {
      factors.incomeVolatility = 8; // High risk - doubling income
      recommendations.push('Large income increase is ambitious. Have a backup plan.');
    } else if (incomeIncreasePercent > 50) {
      factors.incomeVolatility = 6; // Medium-high risk
      recommendations.push('Significant income increase requires strong execution.');
    } else if (incomeIncreasePercent > 20) {
      factors.incomeVolatility = 4; // Medium-low risk
    } else {
      factors.incomeVolatility = 2; // Low risk
    }
  }

  // 2. Investment Risk
  if (changes.investmentAmount > 0) {
    const investmentROI = input.investmentROI || 0;

    if (investmentROI > 15) {
      factors.investmentRisk = 8; // High risk - high return expectation
      recommendations.push('High ROI expectation (>15%) carries significant risk.');
    } else if (investmentROI > 10) {
      factors.investmentRisk = 6; // Medium-high risk
      recommendations.push('Moderate-high ROI target. Ensure proper due diligence.');
    } else if (investmentROI > 6) {
      factors.investmentRisk = 4; // Medium-low risk
    } else {
      factors.investmentRisk = 2; // Low risk - conservative return
      recommendations.push('Conservative ROI target is low-risk.');
    }

    // Check if investment is too large relative to liquid assets
    if (input.investmentAmount && input.investmentAmount > input.currentLiquidAssets * 0.8) {
      factors.investmentRisk = Math.min(10, factors.investmentRisk + 3);
      recommendations.push('⚠️ Investment uses >80% of liquid assets. Keep emergency fund.');
    }
  }

  // 3. Expense Stability Risk
  if (changes.expenseReduction > 0) {
    const expenseReductionPercent = (changes.expenseReduction / input.currentLivingCost) * 100;

    if (expenseReductionPercent > 40) {
      factors.expenseStability = 9; // Very high risk - hard to maintain
      recommendations.push('⚠️ >40% expense reduction is very difficult to sustain long-term.');
    } else if (expenseReductionPercent > 30) {
      factors.expenseStability = 7; // High risk
      recommendations.push('30%+ expense reduction requires major lifestyle changes.');
    } else if (expenseReductionPercent > 20) {
      factors.expenseStability = 5; // Medium risk
      recommendations.push('20%+ expense reduction is achievable but requires discipline.');
    } else if (expenseReductionPercent > 10) {
      factors.expenseStability = 3; // Low risk
    } else {
      factors.expenseStability = 1; // Very low risk
    }
  }

  // 4. Diversification Risk
  const totalChangeValue = changes.incomeIncrease * 12 + changes.investmentAmount;
  const incomeWeight = (changes.incomeIncrease * 12) / (totalChangeValue || 1);
  const investmentWeight = changes.investmentAmount / (totalChangeValue || 1);

  if (totalChangeValue > 0) {
    if (incomeWeight > 0.9 || investmentWeight > 0.9) {
      factors.diversification = 7; // High concentration risk
      recommendations.push('Consider diversifying between income and investment growth.');
    } else if (incomeWeight > 0.7 || investmentWeight > 0.7) {
      factors.diversification = 5; // Medium concentration
    } else {
      factors.diversification = 3; // Good diversification
      recommendations.push('✓ Good balance between income and investment strategies.');
    }
  }

  // 5. Liquidity Risk
  const projectedLiquidAssets = input.currentLiquidAssets + (changes.investmentAmount || 0);
  const projectedLivingCost = input.currentLivingCost - changes.expenseReduction;
  const projectedRunway = projectedLiquidAssets / projectedLivingCost;

  if (projectedRunway < 3) {
    factors.liquidityRisk = 9; // Very high risk
    recommendations.push('⚠️ CRITICAL: Runway below 3 months. Build emergency fund first!');
  } else if (projectedRunway < 6) {
    factors.liquidityRisk = 6; // High risk
    recommendations.push('Runway below 6 months. Prioritize building emergency fund.');
  } else if (projectedRunway < 12) {
    factors.liquidityRisk = 3; // Medium risk
    recommendations.push('Runway is adequate. Consider building to 12 months for safety.');
  } else {
    factors.liquidityRisk = 1; // Low risk
    recommendations.push('✓ Strong runway (12+ months). Good financial stability.');
  }

  // Calculate overall risk score (0-100, higher = safer)
  const avgRiskFactor = (
    factors.incomeVolatility +
    factors.investmentRisk +
    factors.expenseStability +
    factors.diversification +
    factors.liquidityRisk
  ) / 5;

  // Invert: 0-10 scale becomes 100-0 scale (higher score = safer)
  const overall = Math.round(100 - (avgRiskFactor * 10));

  // Categorize risk
  let category: RiskScore['category'];
  if (overall >= 75) category = 'Low';
  else if (overall >= 50) category = 'Medium';
  else if (overall >= 25) category = 'High';
  else category = 'Very High';

  // Add general recommendations
  if (category === 'Very High') {
    recommendations.unshift('⚠️ VERY HIGH RISK: This scenario has significant risks. Consider scaling back changes.');
  } else if (category === 'High') {
    recommendations.unshift('⚠️ HIGH RISK: This scenario requires careful planning and execution.');
  } else if (category === 'Medium') {
    recommendations.unshift('⚡ MEDIUM RISK: Manageable risks with proper planning.');
  } else {
    recommendations.unshift('✓ LOW RISK: This scenario is relatively safe and achievable.');
  }

  return {
    overall,
    category,
    factors,
    recommendations: recommendations.slice(0, 5), // Max 5 recommendations
  };
}

/**
 * Calculate What-If scenario
 */
export function calculateWhatIf(input: WhatIfInput): WhatIfResult {
  // Parse inputs
  let additionalIncome = input.additionalIncome || 0;
  const investmentAmount = input.investmentAmount || 0;
  const investmentROI = input.investmentROI || 0;

  // Calculate expense reduction
  let expenseReduction = input.expenseReduction || 0;
  if (input.expenseReductionPercent) {
    expenseReduction = input.currentLivingCost * (input.expenseReductionPercent / 100);
  }

  // Calculate investment yield
  const monthlyROI = investmentROI / 12 / 100;
  const investmentYield = investmentAmount * monthlyROI;

  // Total changes
  const totalIncomeIncrease = additionalIncome + investmentYield;
  const newPassiveIncome = input.currentPassiveIncome + totalIncomeIncrease;
  const newLivingCost = Math.max(0, input.currentLivingCost - expenseReduction);
  const newLiquidAssets = input.currentLiquidAssets + investmentAmount;

  // Project current scenario (no changes)
  const currentProjection = projectFreedomPath({
    currentPassiveIncome: input.currentPassiveIncome,
    currentLivingCost: input.currentLivingCost,
    currentLiquidAssets: input.currentLiquidAssets,
    passiveIncomeGrowthRate: input.currentGrowthRate,
    livingCostInflationRate: 3,
    assetGrowthRate: investmentROI || 6,
    monthlyInvestment: 0,
    monthlyIncomeIncrease: 0,
  });

  // Project new scenario (with changes)
  const newProjection = projectFreedomPath({
    currentPassiveIncome: newPassiveIncome,
    currentLivingCost: newLivingCost,
    currentLiquidAssets: newLiquidAssets,
    passiveIncomeGrowthRate: input.currentGrowthRate,
    livingCostInflationRate: 3,
    assetGrowthRate: investmentROI || 6,
    monthlyInvestment: 0,
    monthlyIncomeIncrease: 0,
  });

  // Calculate impact
  const currentMonths = currentProjection.scenarios.realistic.monthsToFreedom || Infinity;
  const newMonths = newProjection.scenarios.realistic.monthsToFreedom || Infinity;
  const monthsAccelerated = Math.max(0, currentMonths - newMonths);
  const yearsAccelerated = Math.round((monthsAccelerated / 12) * 10) / 10;

  const currentCoverage = input.currentPassiveIncome / input.currentLivingCost;
  const newCoverage = newPassiveIncome / newLivingCost;
  const coverageRatioImprovement = newCoverage - currentCoverage;

  const netWorthChange = investmentAmount + (totalIncomeIncrease * 12); // Rough estimate

  const percentageImprovement = currentMonths > 0
    ? (monthsAccelerated / currentMonths) * 100
    : 0;

  // Calculate risk score
  const changes = {
    incomeIncrease: totalIncomeIncrease,
    investmentAmount,
    investmentYield,
    expenseReduction,
  };

  const risk = calculateRiskScore(input, changes);

  return {
    current: {
      freedomDate: currentProjection.scenarios.realistic.freedomDate,
      monthsToFreedom: currentProjection.scenarios.realistic.monthsToFreedom,
      yearsToFreedom: currentProjection.scenarios.realistic.yearsToFreedom,
      passiveIncome: input.currentPassiveIncome,
      livingCost: input.currentLivingCost,
      coverageRatio: currentCoverage,
    },
    projected: {
      freedomDate: newProjection.scenarios.realistic.freedomDate,
      monthsToFreedom: newProjection.scenarios.realistic.monthsToFreedom,
      yearsToFreedom: newProjection.scenarios.realistic.yearsToFreedom,
      passiveIncome: newPassiveIncome,
      livingCost: newLivingCost,
      coverageRatio: newCoverage,
      liquidAssets: newLiquidAssets,
    },
    impact: {
      monthsAccelerated,
      yearsAccelerated,
      coverageRatioImprovement,
      netWorthChange,
      percentageImprovement,
    },
    risk,
    changes,
  };
}

/**
 * Generate risk report
 */
export function generateRiskReport(risk: RiskScore): string {
  const lines: string[] = [];

  lines.push(`Risk Assessment: ${risk.category.toUpperCase()} (Score: ${risk.overall}/100)`);
  lines.push('');
  lines.push('Risk Factors:');
  lines.push(`- Income Volatility: ${risk.factors.incomeVolatility}/10`);
  lines.push(`- Investment Risk: ${risk.factors.investmentRisk}/10`);
  lines.push(`- Expense Stability: ${risk.factors.expenseStability}/10`);
  lines.push(`- Diversification: ${risk.factors.diversification}/10`);
  lines.push(`- Liquidity Risk: ${risk.factors.liquidityRisk}/10`);
  lines.push('');
  lines.push('Recommendations:');
  risk.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. ${rec}`);
  });

  return lines.join('\n');
}
