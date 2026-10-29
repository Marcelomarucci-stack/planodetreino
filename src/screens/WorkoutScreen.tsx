import { TOTAL_WEEKS, WARMUP } from '../data/plan'
import {
  DAY_SHORT,
  dateFor,
  formatDate,
  formatDateLong,
  getWorkout,
  locateToday,
  weekRange,
  workoutKey,
} from '../data/schedule'
import { navigate } from '../lib/router'
import { updateLog, useData, type WorkoutLog } from '../lib/store'
import { ExerciseCard } from '../components/ExerciseCard'
import { CardioCard } from '../components/CardioCard'

interface Props {
  week: number
  day: number
}

const BACKUP_REMINDER_DAYS = 7

export function WorkoutScreen({ week, day }: Props) {
  const data = useData()
  const today = locateToday()
  const workout = getWorkout(week, day)
  const key = workoutKey(week, day)
  const log = data.logs[key]
  const isToday = today.week === week && today.day === day && today.status.kind === 'treino'

  const doneDays = [1, 2, 3, 4, 5, 6].filter((d) => data.logs[workoutKey(week, d)]?.completedAt)
  const go = (w: number, d: number) => navigate({ name: 'treino', week: w, day: d }, true)
  const update = (fn: (l: WorkoutLog) => WorkoutLog) => updateLog(key, fn)

  const hasData = Object.keys(data.logs).length > 0
  const lastBackup = data.lastBackupAt ? new Date(data.lastBackupAt) : null
  const needsBackup =
    hasData && (!lastBackup || Date.now() - lastBackup.getTime() > BACKUP_REMINDER_DAYS * 86_400_000)

  const toggleComplete = () => {
    update((l) => ({ ...l, completedAt: l.completedAt ? undefined : new Date().toISOString() }))
    if (!log?.completedAt) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="screen">
      {/* Cabeçalho da semana */}
      <section className={`week-header phase-${workout.phase.id}`}>
        <div className="week-nav">
          <button className="icon-btn" disabled={week <= 1} onClick={() => go(week - 1, day)} aria-label="Semana anterior">
            ‹
          </button>
          <div className="week-title">
            <strong>
              Semana {week} <span className="muted">de {TOTAL_WEEKS}</span>
            </strong>
            <small>{weekRange(week)}</small>
          </div>
          <button
            className="icon-btn"
            disabled={week >= TOTAL_WEEKS}
            onClick={() => go(week + 1, day)}
            aria-label="Próxima semana"
          >
            ›
          </button>
        </div>
        <div className="badges">
          <span className="badge phase">
            Fase {workout.phase.id} · {workout.phase.name}
          </span>
          {workout.deload && <span className="badge deload">🌿 Semana leve</span>}
        </div>
        <div className="day-tabs" role="tablist">
          {DAY_SHORT.map((label, i) => {
            const d = i + 1
            const done = doneDays.includes(d)
            const todayTab = today.status.kind === 'treino' && today.week === week && today.day === d
            return (
              <button
                key={d}
                role="tab"
                aria-selected={d === day}
                className={`day-tab${d === day ? ' selected' : ''}${done ? ' done' : ''}${todayTab ? ' today' : ''}`}
                onClick={() => go(week, d)}
              >
                <span>{label}</span>
                <small>{done ? '✓' : dateFor(week, d).getDate()}</small>
              </button>
            )
          })}
        </div>
        <div className="progress-row">
          <div className="progress">
            <div style={{ width: `${(doneDays.length / 6) * 100}%` }} />
          </div>
          <small>
            {doneDays.length} de 6 dias concluídos
          </small>
        </div>
      </section>

      {/* Avisos de contexto */}
      {today.status.kind === 'antes' && week === 1 && (
        <div className="banner info">
          O plano começa na segunda, {formatDate(dateFor(1, 1))}{' '}
          {today.status.daysUntil === 1 ? '(amanhã)' : `(em ${today.status.daysUntil} dias)`}.
        </div>
      )}
      {today.status.kind === 'domingo' && today.week === week && today.day === day && (
        <div className="banner info">Hoje é domingo: descanso 😴 Este é o treino de amanhã.</div>
      )}
      {today.status.kind === 'fim' && <div className="banner info">🎉 Plano de 13 semanas concluído!</div>}
      {!isToday && today.status.kind === 'treino' && (
        <button className="banner link" onClick={() => navigate({ name: 'hoje' })}>
          Ver o treino de hoje →
        </button>
      )}
      {needsBackup && (
        <a className="banner warn" href="#/ajustes">
          💾 Seus dados só existem neste aparelho. Toque para fazer um backup.
        </a>
      )}

      {/* Título do treino */}
      <section className="workout-title">
        <small className="muted">
          {formatDateLong(workout.date)}
          {isToday && <span className="badge today-badge">Hoje</span>}
        </small>
        <h1>
          {workout.title}
          {workout.subtitle && <span className="muted"> · {workout.subtitle}</span>}
        </h1>
        {workout.type === 'forca' && <p className="effort">💡 {workout.phase.effort}</p>}
        {workout.deload && (
          <p className="effort">🌿 Semana leve: mesmos exercícios, só 2 séries cada e cardio 30% menor.</p>
        )}
        {log?.completedAt && (
          <p className="completed-msg">
            ✅ Treino concluído em{' '}
            {new Date(log.completedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </section>

      {workout.warmup && (
        <section className="card">
          <h2 className="card-title">Aquecimento</h2>
          {WARMUP.map((w, i) => {
            const checked = log?.warmup.includes(i) ?? false
            return (
              <label key={w} className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    update((l) => ({
                      ...l,
                      warmup: checked ? l.warmup.filter((x) => x !== i) : [...l.warmup, i],
                    }))
                  }
                />
                <span>{w}</span>
              </label>
            )
          })}
        </section>
      )}

      {workout.items.map((item) =>
        item.kind === 'ex' ? (
          <ExerciseCard key={`ex-${item.id}`} item={item} log={log} date={workout.date} update={update} />
        ) : (
          <CardioCard key={`c-${item.id}`} item={item} log={log} update={update} deload={workout.deload} />
        ),
      )}

      <section className="card">
        <h2 className="card-title">Esforço do treino (RPE)</h2>
        <div className="rpe-grid">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`rpe-btn${log?.rpe === n ? ' selected' : ''}`}
              onClick={() => update((l) => ({ ...l, rpe: l.rpe === n ? undefined : n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <small className="muted">1 = muito fácil · 10 = esforço máximo</small>

        <h2 className="card-title" style={{ marginTop: 16 }}>
          Observações
        </h2>
        <textarea
          rows={3}
          placeholder="Como foi o treino? Alguma dor ou ajuste?"
          value={log?.notes ?? ''}
          onChange={(e) => update((l) => ({ ...l, notes: e.target.value }))}
        />
      </section>

      <button className={`big-btn ${log?.completedAt ? 'secondary' : 'primary'}`} onClick={toggleComplete}>
        {log?.completedAt ? 'Reabrir treino' : '✓ Concluir treino'}
      </button>
    </div>
  )
}
