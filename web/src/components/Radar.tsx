interface RadarSeries {
  values: number[];
  stroke: string;
  fill: string;
  fillOpacity: number;
}

interface RadarProps {
  labels: string[];
  series: RadarSeries[];
  size?: number;
}

function wrapLabel(text: string, maxChars = 13): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function Radar({ labels, series, size = 260 }: RadarProps) {
  const cx = 150;
  const cy = 150;
  const R = 100;
  const n = labels.length;

  function point(i: number, val: number): [number, number] {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
    const r = (val / 100) * R;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="-70 -20 440 340" width={size} height={size} role="img" aria-label="Radar graf kompetencija">
      {rings.map((f) => (
        <polygon
          key={f}
          points={labels.map((_, i) => point(i, f * 100).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {labels.map((label, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 120);
        const anchor = lx > cx + 4 ? "start" : lx < cx - 4 ? "end" : "middle";
        const lines = wrapLabel(label);
        const startDy = ly > cy + 4 ? 0 : ly < cy - 4 ? -(lines.length - 1) : -(lines.length - 1) / 2;
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              fontSize={10}
              fill="var(--ink-soft)"
              fontFamily="var(--font-sans)"
            >
              {lines.map((line, li) => (
                <tspan key={li} x={lx} dy={li === 0 ? `${startDy + 0.9}em` : "1.15em"}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => (
        <polygon
          key={si}
          points={s.values.map((v, i) => point(i, v).join(",")).join(" ")}
          fill={s.fill}
          fillOpacity={s.fillOpacity}
          stroke={s.stroke}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
