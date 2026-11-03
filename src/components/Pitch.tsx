/** Half a football pitch in hairlines, with one blue line running straight into the goal. */
export function Pitch() {
  return (
    <svg className="pitch" viewBox="0 0 1200 1100" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g transform="translate(0 420)">
      <g className="pitch-lines">
        <path d="M-20 40 H1160 V660 H-20" />
        <line x1="140" y1="40" x2="140" y2="660" />
        <circle cx="140" cy="350" r="110" />
        <circle cx="140" cy="350" r="3" className="pitch-dot" />
        <rect x="980" y="150" width="180" height="400" />
        <rect x="1100" y="262" width="60" height="176" />
        <circle cx="1052" cy="350" r="3" className="pitch-dot" />
        <path d="M980 284 A 110 110 0 0 0 980 416" />
        <rect x="1160" y="310" width="26" height="80" className="pitch-goal" />
        <path d="M1160 50 A 10 10 0 0 0 1150 40 M1160 650 A 10 10 0 0 1 1150 660" />
      </g>
      <line x1="140" y1="350" x2="1172" y2="350" className="pitch-run" />
      <circle cx="140" cy="350" r="6" className="pitch-ball" />
      </g>
    </svg>
  );
}
