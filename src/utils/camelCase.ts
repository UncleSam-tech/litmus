export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z0-9])/gi, ($1) =>
    $1.toUpperCase().replace("-", "").replace("_", "")
  );
}

export function deepCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((v) => deepCamelCase(v));
  }

  if (typeof obj === "object") {
    const n: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const camelKey = toCamelCase(key);
      n[camelKey] = deepCamelCase(obj[key]);
    }
    return n;
  }

  return obj;
}
