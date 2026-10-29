import { exercises } from '../data/plan'
import { dateFor, parseWorkoutKey } from '../data/schedule'
import type { ExerciseKind } from '../data/types'
import type { AppData, SetLog } from './store'

export function toNumber(v: string): number | null {
  if (!v) return null
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function formatNumber(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** Séries que de fato têm algo registrado. */
export function filledSets(sets: SetLog[] | undefined) {
  return (sets ?? []).filter((s) => s.done || s.kg || s.reps)
}

export function unitFor(kind: ExerciseKind) {
  return kind === 'tempo' ? 's' : kind === 'carregamento' ? 'm' : ''
}

/** "3x12 com 20 kg", "12/10/10 com 20–22,5 kg", "3x30 s"… */
export function summarizeSets(sets: SetLog[], kind: ExerciseKind) {
  const reps = sets.map((s) => s.reps).filter(Boolean)
  const kgs = sets.map((s) => toNumber(s.kg)).filter((n): n is number => n !== null)
  const unit = unitFor(kind)
  const uniqReps = [...new Set(reps)]
  let text: string
  if (reps.length === 0) text = `${sets.length} séries`
  else if (uniqReps.length === 1) text = `${sets.length}x${uniqReps[0]}${unit ? ' ' + unit : ''}`
  else text = `${reps.join('/')}${unit ? ' ' + unit : ''}`
  if (kgs.length) {
    const min = Math.min(...kgs)
    const max = Math.max(...kgs)
    text += ` com ${min === max ? formatNumber(max) : `${formatNumber(min)}–${formatNumber(max)}`} kg`
  }
  return text
}

export interface Session {
  key: string
  week: number
  day: number
  date: Date
  sets: SetLog[]
}

/** Todas as sessões registradas de um exercício, da mais antiga para a mais recente. */
export function sessionsFor(data: AppData, exerciseId: string): Session[] {
  const out: Session[] = []
  for (const [key, log] of Object.entries(data.logs)) {
    const pos = parseWorkoutKey(key)
    const sets = filledSets(log.sets[exerciseId])
    if (!pos || sets.length === 0) continue
    out.push({ key, ...pos, date: dateFor(pos.week, pos.day), sets })
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Última sessão do exercício antes da data informada. */
export function lastSessionBefore(data: AppData, exerciseId: string, before: Date): Session | null {
  const list = sessionsFor(data, exerciseId).filter((s) => s.date < before)
  return list.length ? list[list.length - 1] : null
}

/** Valor usado no gráfico: maior carga (ou maior reps/tempo/distância sem carga). */
export function sessionMetric(s: Session, exerciseId: string): number | null {
  const kind = exercises[exerciseId]?.kind ?? 'peso'
  const values = s.sets
    .map((x) => toNumber(kind === 'peso' || kind === 'carregamento' ? x.kg : x.reps))
    .filter((n): n is number => n !== null)
  return values.length ? Math.max(...values) : null
}

export function metricLabel(exerciseId: string) {
  const kind = exercises[exerciseId]?.kind ?? 'peso'
  return { peso: 'Maior carga (kg)', carregamento: 'Maior carga (kg)', corporal: 'Mais repetições', tempo: 'Maior tempo (s)' }[
    kind
  ]
}
