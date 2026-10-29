import { formatCardioTarget } from '../data/schedule'
import type { CardioItem } from '../data/types'
import type { CardioLog, WorkoutLog } from '../lib/store'

interface Props {
  item: CardioItem
  log: WorkoutLog | undefined
  deload: boolean
  update: (fn: (l: WorkoutLog) => WorkoutLog) => void
}

const emptyCardio = (): CardioLog => ({ time: '', distance: '', note: '' })

export function CardioCard({ item, log, deload, update }: Props) {
  const c = log?.cardio[item.id] ?? emptyCardio()
  const set = (patch: Partial<CardioLog>) =>
    update((l) => ({ ...l, cardio: { ...l.cardio, [item.id]: { ...(l.cardio[item.id] ?? emptyCardio()), ...patch } } }))

  return (
    <section className={`card cardio${c.time ? ' complete' : ''}`}>
      <h2 className="card-title">
        <span aria-hidden>🫀</span> {item.name}
      </h2>
      <div className="ex-meta">
        <span className="target">{formatCardioTarget(item)}</span>
        {deload && !item.fixed && <span className="badge deload small">−30%</span>}
      </div>
      {item.note && <p className="note">{item.note}</p>}
      <div className="cardio-fields">
        <label>
          <span>Tempo (min)</span>
          <input
            inputMode="decimal"
            placeholder={item.minutes ? String(item.minutes) : '—'}
            value={c.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </label>
        <label>
          <span>Distância</span>
          <input placeholder="ex.: 5,2 km" value={c.distance} onChange={(e) => set({ distance: e.target.value })} />
        </label>
      </div>
      <input
        className="full"
        placeholder="Observação (ritmo, FC, inclinação…)"
        value={c.note}
        onChange={(e) => set({ note: e.target.value })}
      />
    </section>
  )
}
