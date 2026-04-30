import { findCompanyByTickerOrName, getFacilitiesForCompany } from "../entities/companyGraph.js";
import { calculateRiskScore, ScoreDriver } from "../scoring/riskScore.js";
import { pool } from "../../db/client.js";
import { buildMeta } from "../../utils/toolMeta.js";

export async function buildCompanyBrief(companyOrTicker: string, startTime: number) {
  const company = await findCompanyByTickerOrName(companyOrTicker);
  if (!company) {
    return {
      headline: `Could not resolve '${companyOrTicker}'`,
      capabilityFlags: { entityResolved: false },
      limitations: [
        `Could not resolve '${companyOrTicker}' to any FDA establishment. The company may not have FDA-regulated facilities, or the name may not match FDA records.`
      ],
      riskScore: null,
      riskLevel: null,
      scoreDrivers: [],
      recentInspections: [],
      openWarningLetters: [],
      recentRecalls: [],
      faersSummary: {},
      importAlerts: [],
      companyProfile: {},
      recommendation: "",
      provenance: {
        sources: [],
        generatedAt: new Date().toISOString(),
        sourceUpdatedAt: new Date().toISOString(),
        snapshotAgeSeconds: 0,
        coverageNotes: ""
      },
      freshness: {
        cacheHit: false,
        cacheHitStale: false,
        dataAge: {}
      },
      _meta: buildMeta("getCompanyFdaBrief", startTime)
    };
  }

  const facilities = await getFacilitiesForCompany(company.id);
  const feiNumbers = facilities.map((f: any) => f.fei_number);

  // Fetch recent inspections
  let recentInspections: any[] = [];
  if (feiNumbers.length > 0) {
    const inspRes = await pool.query(
      `SELECT * FROM inspections WHERE fei_number = ANY($1) ORDER BY inspection_end_date DESC LIMIT 5`,
      [feiNumbers]
    );
    recentInspections = inspRes.rows;
  }

  // Fetch warning letters
  const wlRes = await pool.query(
    `SELECT * FROM warning_letters WHERE company_id = $1 AND resolved = FALSE`,
    [company.id]
  );
  const openWarningLetters = wlRes.rows;

  // Stub score drivers
  const drivers: ScoreDriver[] = [];
  
  if (recentInspections.some(i => i.classification_code === 'OAI')) {
    drivers.push({ name: "Recent OAI Inspection", weight: 0.25, score: 1.0, rawValue: "OAI", confidence: 1.0 });
  } else {
    drivers.push({ name: "Recent OAI Inspection", weight: 0.25, score: 0.0, rawValue: "NAI/VAI", confidence: 1.0 });
  }

  if (openWarningLetters.length > 0) {
    drivers.push({ name: "Open Warning Letter", weight: 0.20, score: 1.0, rawValue: "Open", confidence: 1.0 });
  } else {
    drivers.push({ name: "Open Warning Letter", weight: 0.20, score: 0.0, rawValue: "None", confidence: 1.0 });
  }

  const { score, riskLevel } = calculateRiskScore(drivers);

  return {
    headline: `FDA enforcement risk for ${company.canonical_name} is assessed as ${riskLevel}.`,
    riskScore: score,
    riskLevel,
    scoreDrivers: drivers,
    recentInspections,
    openWarningLetters,
    recentRecalls: [],
    faersSummary: {},
    importAlerts: [],
    companyProfile: {
      canonicalName: company.canonical_name,
      ticker: company.ticker,
      aliases: company.aliases,
      feiFacilities: feiNumbers
    },
    recommendation: `Based on a score of ${score}, the risk level is ${riskLevel}.`,
    provenance: {
      sources: ["FDA Data Dashboard", "FDA Warning Letters", "openFDA"],
      generatedAt: new Date().toISOString(),
      sourceUpdatedAt: new Date().toISOString(),
      snapshotAgeSeconds: 0,
      coverageNotes: ""
    },
    freshness: {
      cacheHit: false,
      cacheHitStale: false,
      dataAge: {}
    },
    limitations: [
      "Not all inspections are included in the FDA database."
    ],
    capabilityFlags: {
      entityResolved: true,
      hasInspectionData: recentInspections.length > 0,
      hasWarningLetters: openWarningLetters.length > 0
    },
    _meta: buildMeta("getCompanyFdaBrief", startTime)
  };
}
