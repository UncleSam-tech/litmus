import * as cheerio from "cheerio";
import { fetch } from "undici";
import { withRetry } from "../../../utils/retry.js";
import { deepCamelCase } from "../../../utils/camelCase.js";

export async function scrapeWarningLetters(page: number = 0): Promise<any[]> {
  const url = `https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters?page=${page}`;
  
  return withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`FDA Warning Letters scrape error: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const letters: any[] = [];

    $("table tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 5) {
        const companyName = $(cols[0]).text().trim();
        const letterIssueDate = $(cols[1]).text().trim();
        const issuingOffice = $(cols[2]).text().trim();
        const subject = $(cols[3]).text().trim();
        const link = $(cols[0]).find("a").attr("href");
        
        letters.push({
          companyName,
          letterIssueDate,
          issuingOffice,
          subject,
          url: link ? (link.startsWith("http") ? link : `https://www.fda.gov${link}`) : null
        });
      }
    });

    return deepCamelCase(letters);
  }, { maxRetries: 3, initialDelayMs: 2000 }, "FDA Warning Letters scrape");
}
