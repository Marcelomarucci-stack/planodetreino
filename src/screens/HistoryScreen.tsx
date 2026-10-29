import { exercises } from '../data/plan'
import { DAY_SHORT, allExerciseIds, formatDate } from '../data/schedule'
import { metricLabel, sessionMetric, sessionsFor, summarizeSets } from '../lib/history'
import { href } from '../lib/router'
import { useData } from '../lib/store'
import { LineChart } from '../components/LineChart'

export function HistoryScreen({ exerciseId }: { exerciseId?: string }) {
  return exerciseId && exercises[exerciseId] ? <ExerciseHistory id={exerciseId} /> : <ExerciseList />
}

function ExerciseList() {
  const data = useData()
  const ids = allExerciseIds()
  const withData = ids.map((id) => ({ id, sessions: sessionsFor(data, id) }))

  return (
    <div className="screen">
      <h1 className="screen-title">Histórico por exercício</h1>
      <div className="list">
        {withData.map(({ id, sessions }) => {
          const last = sessions[sessions.length - 1]
          return (
            <a key={id} className="list-item" href={href({ name: 'historico', exerciseId: id })}>
              <div>
                <strong>{exercises[id].name}</strong>
                <small className="muted">
                  {last
                    ? `${summarizeSets(last.sets, exercises[id].kind)} · ${formatDate(last.date)}`
                    : 'Sem registros ainda'}
                </small>
              </div>
              <span className="count">{sessions.length}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function ExerciseHistory({ id }: { id: string }) {
  const data = useData()
  const info = exercises[id]
  const sessions = sessionsFor(data, id)
  const points = sessions
    .map((s) => ({ label: formatDate(s.date), value: sessionMetric(s, id) }))
    .filter((p): p is { label: string; value: number } => p.value !== null)

  return (
    <div className="screen">
      <a className="back" href={href({ name: 'historico' })}>
        ‹ Exercícios
      </a>
      <h1 className="screen-title">{info.name}</h1>
      {info.note && <p className="note">{info.note}</p>}

      <section className="card">
        <h2 className="card-title">{metricLabel(id)}</h2>
        {points.length ? (
          <LineChart points={points} unit={metricLabel(id)} />
        ) : (
          <p className="muted">Registre cargas no treino para ver a evolução aqui.</p>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Sessões</h2>
        {sessions.length === 0 && <p className="muted">Nenhuma sessão registrada.</p>}
        {[...sessions].reverse().map((s) => (
          <a key={s.key} className="session-row" href={href({ name: 'treino', week: s.week, day: s.day })}>
            <div>
              <strong>{formatDate(s.date)}</strong>{' '}
              <small className="muted">
                Sem. {s.week} · {DAY_SHORT[s.day - 1]}
              </small>
            </div>
            <div className="session-sets">
              <span>{summarizeSets(s.sets, info.kind)}</span>
              <small className="muted">
                {s.sets.map((x) => [x.kg && `${x.kg} kg`, x.reps].filter(Boolean).join(' × ') || '—').join(' · ')}
              </small>
            </div>
          </a>
        ))}
      </section>
    </div>
  )
}
