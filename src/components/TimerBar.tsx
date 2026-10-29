import { useEffect } from 'react'
import { addTime, startTimer, stopTimer, useTimer } from '../lib/timer'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function TimerBar() {
  const t = useTimer()

  // Esconde o aviso de "descanso concluído" depois de alguns segundos.
  useEffect(() => {
    if (!t.finishedAt) return
    const id = setTimeout(stopTimer, 5000)
    return () => clearTimeout(id)
  }, [t.finishedAt])

  if (t.finishedAt)
    return (
      <div className="timerbar done" onClick={stopTimer} role="status">
        <strong>Descanso concluído!</strong> Bora para a próxima série 💪
      </div>
    )

  if (!t.running)
    return (
      <div className="timerbar idle">
        <span>Descanso:</span>
        {[60, 90, 120].map((s) => (
          <button key={s} className="chip" onClick={() => startTimer(s, 'Descanso')}>
            ⏱ {s}s
          </button>
        ))}
      </div>
    )

  const pct = t.total ? (t.remaining / t.total) * 100 : 0
  return (
    <div className="timerbar running" role="timer">
      <div className="timer-progress" style={{ width: `${pct}%` }} />
      <div className="timer-info">
        <small>{t.label}</small>
        <strong className="timer-clock">{fmt(t.remaining)}</strong>
      </div>
      <button className="chip" onClick={() => addTime(15)}>
        +15s
      </button>
      <button className="chip" onClick={stopTimer} aria-label="Parar timer">
        ✕
      </button>
    </div>
  )
}
