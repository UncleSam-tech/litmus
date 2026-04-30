import { pool } from "../../db/client.js";

export async function findCompanyByTickerOrName(query: string) {
  const isTicker = query.length <= 5 && query === query.toUpperCase();

  if (isTicker) {
    const res = await pool.query(`SELECT * FROM companies WHERE ticker = $1`, [query]);
    if (res.rows.length > 0) return res.rows[0];
  }

  // Fallback to name search using ILIKE
  const resName = await pool.query(
    `SELECT * FROM companies WHERE canonical_name ILIKE $1 OR $1 = ANY(aliases)`,
    [`%${query}%`]
  );
  if (resName.rows.length > 0) return resName.rows[0];

  return null;
}

export async function getFacilitiesForCompany(companyId: number) {
  const res = await pool.query(`SELECT * FROM facilities WHERE company_id = $1`, [companyId]);
  return res.rows;
}
