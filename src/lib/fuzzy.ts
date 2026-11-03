/** Space-separated tokens, each matched as an in-order subsequence. "layo res" finds "layout/resolve.ts". */
export function fuzzy(query: string, text: string): { score: number; idx: number[] } | null {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { score: 0, idx: [] };
  const t = text.toLowerCase();
  const idx: number[] = [];
  let from = 0;
  for (const tok of tokens) {
    for (const ch of tok) {
      const j = t.indexOf(ch, from);
      if (j < 0) return null;
      idx.push(j);
      from = j + 1;
    }
  }
  const span = idx[idx.length - 1] - idx[0];
  return { score: span - idx.length + idx[0] * 0.5, idx };
}
