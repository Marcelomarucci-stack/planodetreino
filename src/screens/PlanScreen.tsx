import { TOTAL_WEEKS, phases } from '../data/plan'
import { DAY_SHORT, getWorkout, isDeload, locateToday, weekRange, workoutKey } from '../data/schedule'
import { href } from '../lib/router'
import { useData } from '../lib/store'

export function PlanScreen() {
  const data = useData()
  const today = locateToday()

  return (
    <div className="screen">
      <h1 className="screen-title">Plano de 13 semanas</h1>
      {phases.map((p) => (
        <section key={p.id} className={`phase-block phase-${p.id}`}>
          <h2>
            Fase {p.id} · {p.name} <small className="muted">sem. {p.firstWeek}–{p.lastWeek}</small>
          </h2>
          <p className="muted small">{p.effort}</p>
          {Array.from({ length: p.lastWeek - p.firstWeek + 1 }, (_, i) => p.firstWeek + i)
            .filter((w) => w <= TOTAL_WEEKS)
            .map((w) => {
              const done = [1, 2, 3, 4, 5, 6].filter((d) => data.logs[workoutKey(w, d)]?.completedAt).length
              const current = today.week === w && today.status.kind !== 'antes' && today.status.kind !== 'fim'
              return (
                <div key={w} className={`week-card${current ? ' current' : ''}`}>
                  <div className="week-card-head">
                    <strong>Semana {w}</strong>
                    <span className="muted small">{weekRange(w)}</span>
                    {isDeload(w) && <span className="badge deload small">🌿 Semana leve</span>}
                    <span className="week-count">{done}/6</span>
                  </div>
                  <div className="week-days">
                    {DAY_SHORT.map((label, i) => {
                      const d = i + 1
                      const wk = getWorkout(w, d)
                      const completed = !!data.logs[workoutKey(w, d)]?.completedAt
                      return (
                        <a key={d} href={href({ name: 'treino', week: w, day: d })} className={completed ? 'done' : ''}>
                          <small>{label}</small>
                          <span>{completed ? '✓' : wk.title}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </section>
      ))}
      <p className="muted small center">Domingo é descanso.</p>
    </div>
  )
}
