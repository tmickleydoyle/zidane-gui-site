export function Highlight({ text, idx }: { text: string; idx: number[] }) {
  if (idx.length === 0) return <>{text}</>;
  const hit = new Set(idx);
  return (
    <>
      {Array.from(text).map((ch, i) => (hit.has(i) ? <mark key={i}>{ch}</mark> : <span key={i}>{ch}</span>))}
    </>
  );
}
