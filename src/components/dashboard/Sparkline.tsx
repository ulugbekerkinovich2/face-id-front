interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
}

/** Soddagina inline SVG sparkline. 24 ta nuqta uchun ham ishlaydi. */
export function Sparkline({
  values, width = 120, height = 32,
  color = "#10b981",
  fillColor = "rgba(16, 185, 129, 0.18)",
}: Props) {
  if (!values?.length) {
    return <svg width={width} height={height} />;
  }
  const max = Math.max(1, ...values);
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;

  // Peak nuqtani belgilash
  const peakIdx = values.indexOf(max);
  const peak = points[peakIdx];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={area} fill={fillColor} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {peak && max > 0 && (
        <circle cx={peak[0]} cy={peak[1]} r={2.5} fill={color}>
          <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}
