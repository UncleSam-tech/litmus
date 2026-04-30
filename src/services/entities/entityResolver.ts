export function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[,.]/g, "")
    .replace(/\b(inc|llc|corp|ltd|co|corporation|company)\b/gi, "")
    .trim();
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
  return new Set(tokens);
}

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function isMatch(nameA: string, nameB: string, threshold: number = 0.60): boolean {
  if (!nameA || !nameB) return false;
  if (nameA.toLowerCase() === nameB.toLowerCase()) return true;
  
  const setA = tokenize(nameA);
  const setB = tokenize(nameB);
  
  return jaccardSimilarity(setA, setB) >= threshold;
}
