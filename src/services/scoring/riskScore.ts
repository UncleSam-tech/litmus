export interface ScoreDriver {
  name: string;
  weight: number; // 0 to 1
  score: number; // 0 to 1
  rawValue: any;
  confidence: number;
}

export function calculateRiskScore(drivers: ScoreDriver[]): {
  score: number;
  riskLevel: "low" | "moderate" | "elevated" | "high" | "critical";
} {
  let totalScore = 0;
  
  for (const driver of drivers) {
    totalScore += driver.weight * driver.score * 100;
  }
  
  const score = Math.round(Math.min(100, Math.max(0, totalScore)));
  
  let riskLevel: "low" | "moderate" | "elevated" | "high" | "critical" = "low";
  if (score >= 81) riskLevel = "critical";
  else if (score >= 61) riskLevel = "high";
  else if (score >= 41) riskLevel = "elevated";
  else if (score >= 21) riskLevel = "moderate";
  
  return { score, riskLevel };
}
