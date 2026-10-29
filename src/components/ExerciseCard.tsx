import { exercises } from '../data/plan'
import { formatDate, formatRest, formatTarget, videoUrl } from '../data/schedule'
import type { ExerciseItem } from '../data/types'
import { lastSessionBefore, summarizeSets } from '../lib/history'
import { href } from '../lib/router'
import { getData, type SetLog, type WorkoutLog } from '../lib/store'
import { startTimer } from '../lib/timer'

interface Props {
  item: ExerciseItem
  log: WorkoutLog | undefined
  date: Date
  update: (fn: (l: WorkoutLog) => WorkoutLog) => void
}

const emptySet = (): SetLog => ({ kg: '', reps: '', done: false })

export function ExerciseCard({ item, log, date, update }: Props) {
  const info = exercises[item.id]
  const kind = info.kind
  const hasKg = kind === 'peso' || kind === 'carregamento'
  const repsLabel = kind === 'tempo' ? 'seg' : kind === 'carregamento' ? 'metros' : 'reps'
  const logged = log?.sets[item.id] ?? []
  const rows = Math.max(item.sets, logged.length)
  const last = lastSessionBefore(getData(), item.id, date)
  const rest = formatRest(item)
  // Alvo numérico simples ("12", "30 s", "30 m") vira sugestão ao marcar a série.
  const targetNumber = /^\d+( ?[sm])?$/.test(item.reps) ? String(parseInt(item.reps)) : ''

  const setRow = (i: number, patch: Partial<SetLog>) =>
    update((l) => {
      const sets = [...(l.sets[item.id] ?? [])]
      while (sets.length <= i) sets.push(emptySet())
      sets[i] = { ...sets[i], ...patch }
      return { ...l, sets: { ...l.sets, [item.id]: sets } }
    })

  // Carga sugerida: a da série anterior de hoje, senão a da última vez.
  const suggestedKg = (i: number) => {
    if (!hasKg) return ''
    for (let j = i - 1; j >= 0; j--) if (logged[j]?.kg) return logged[j].kg
    const prev = last?.sets ?? []
    return prev[i]?.kg || [...prev].reverse().find((x) => x.kg)?.kg || ''
  }

  const toggleDone = (i: number) => {
    const s = logged[i] ?? emptySet()
    if (s.done) return setRow(i, { done: false })
    // Marcar como feita preenche campos vazios com a sugestão de carga e o alvo.
    setRow(i, { done: true, kg: s.kg || suggestedKg(i), reps: s.reps || targetNumber })
  }

  const addSet = () =>
    update((l) => {
      const sets = [...(l.sets[item.id] ?? [])]
      while (sets.length < rows) sets.push(emptySet())
      sets.push(emptySet())
      return { ...l, sets: { ...l.sets, [item.id]: sets } }
    })

  const removeSet = () =>
    update((l) => ({ ...l, sets: { ...l.sets, [item.id]: (l.sets[item.id] ?? []).slice(0, rows - 1) } }))

  const doneCount = logged.filter((s) => s.done).length

  return (
    <section className={`card exercise${item.optional ? ' optional' : ''}${doneCount >= item.sets ? ' complete' : ''}`}>
      <header className="ex-header">
        <div>
          <h2 className="card-title">
            <a href={href({ name: 'historico', exerciseId: item.id })}>{info.name}</a>
          </h2>
          <div className="ex-meta">
            <span className="target">{formatTarget(item)}</span>
            {item.rest === 0 && <span className="muted">em sequência</span>}
          </div>
        </div>
        {rest && (
          <button className="rest-btn" onClick={() => startTimer(item.rest!, `Descanso · ${info.name}`)}>
            ⏱ {rest}
          </button>
        )}
      </header>

      {item.optional && <p className="optional-tag">{item.optional}</p>}
      {(info.note || item.note) && <p className="note">{[item.note, info.note].filter(Boolean).join(' ')}</p>}
      <a className="video-btn" href={videoUrl(item.id)} target="_blank" rel="noopener noreferrer">
        ▶ Ver vídeo
      </a>

      <p className="last-time">
        {last ? (
          <>
            Última vez: <strong>{summarizeSets(last.sets, kind)}</strong>{' '}
            <span className="muted">({formatDate(last.date)})</span>
          </>
        ) : (
          <span className="muted">Primeira vez registrando este exercício.</span>
        )}
      </p>

      <div className={`sets-table${hasKg ? '' : ' no-kg'}`}>
        <div className="sets-head">
          <span>Série</span>
          {hasKg && <span>kg</span>}
          <span>{repsLabel}</span>
          <span>Feita</span>
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const s = logged[i] ?? emptySet()
          return (
            <div key={i} className={`set-row${s.done ? ' done' : ''}`}>
              <span className="set-num">{i + 1}</span>
              {hasKg && (
                <input
                  inputMode="decimal"
                  aria-label={`Carga série ${i + 1}`}
                  placeholder={suggestedKg(i) || 'kg'}
                  value={s.kg}
                  onChange={(e) => setRow(i, { kg: e.target.value })}
                />
              )}
              <input
                inputMode="numeric"
                aria-label={`${repsLabel} série ${i + 1}`}
                placeholder={targetNumber || item.reps}
                value={s.reps}
                onChange={(e) => setRow(i, { reps: e.target.value })}
              />
              <button
                className={`check-btn${s.done ? ' checked' : ''}`}
                aria-pressed={s.done}
                aria-label={`Série ${i + 1} concluída`}
                onClick={() => toggleDone(i)}
              >
                ✓
              </button>
            </div>
          )
        })}
      </div>
      <div className="set-actions">
        <button className="link-btn" onClick={addSet}>
          + série
        </button>
        {rows > item.sets && (
          <button className="link-btn" onClick={removeSet}>
            − série
          </button>
        )}
      </div>
    </section>
  )
}
