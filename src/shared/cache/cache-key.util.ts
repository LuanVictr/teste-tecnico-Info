export function buildCacheKey(prefix: string, params: Record<string, unknown> = {}): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join(':');

  return sorted ? `${prefix}:${sorted}` : prefix;
}
