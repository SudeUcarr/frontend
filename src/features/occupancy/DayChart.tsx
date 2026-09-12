interface ChartSample { timestamp: string; target: number; prediction: number }
export function DayChart({ rows, selected }: { rows: ChartSample[]; selected: number }) {
  const width = 700, height = 175, padding = 28;
  const max = Math.max(10, ...rows.flatMap(row => [row.target, row.prediction]));
  const x = (index: number) => padding + index / Math.max(1, rows.length - 1) * (width - padding * 2);
  const y = (value: number) => height - padding - value / max * (height - padding * 2);
  const points = (key: 'target' | 'prediction') => rows.map((row, index) => `${x(index)},${y(row[key])}`).join(' ');
  return <svg className="ml-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Seçilen günün tarihsel sensör ölçümü ile ML tahmini karşılaştırması. Ayrıntılı değerler aşağıdaki tabloda.">
    {[0, .5, 1].map(fraction => <g key={fraction}><line x1={padding} x2={width - padding} y1={y(max * fraction)} y2={y(max * fraction)} stroke="#edf0f7"/><text x="0" y={y(max * fraction) + 4} fill="#8b97aa" fontSize="10">{Math.round(max * fraction)}</text></g>)}
    <polyline points={points('target')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>
    <polyline points={points('prediction')} fill="none" stroke="#3467e8" strokeWidth="2.5" strokeLinejoin="round"/>
    <line x1={x(selected)} x2={x(selected)} y1={padding} y2={height - padding} stroke="#9bb8ff" strokeDasharray="3 4"/>
    <circle cx={x(selected)} cy={y(rows[selected].prediction)} r="5" fill="#3467e8" stroke="white" strokeWidth="2"/>
    {[0, Math.floor((rows.length - 1) / 2), rows.length - 1].map((index, key) => <text key={key} x={x(index)} y={height - 5} textAnchor="middle" fill="#8b97aa" fontSize="10">{rows[index].timestamp.slice(11, 16)}</text>)}
  </svg>;
}
