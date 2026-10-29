import { formatNumber } from '../lib/history'

interface Point {
  label: string
  value: number
}

/** Gráfico de linha simples em SVG (sem bibliotecas). */
export function LineChart({ points, unit }: { points: Point[]; unit: string }) {
  if (points.length === 0) return null
  const W = 340
  const H = 180
  const pad = { l: 36, r: 12, t: 16, b: 28 }
  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min = Math.max(0, min - 5)
    max = max + 5
  }
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (points.length - 1))
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const ticks = [min, (min + max) / 2, max]
  // Mostra no máximo ~6 rótulos no eixo X.
  const step = Math.ceil(points.length / 6)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolução (${unit})`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="axis">
            {formatNumber(Math.round(t * 10) / 10)}
          </text>
        </g>
      ))}
      <path d={path} className="line" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={4} className="dot" />
          {i % step === 0 || i === points.length - 1 ? (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="axis">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
