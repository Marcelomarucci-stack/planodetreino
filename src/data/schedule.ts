import {
  DELOAD_CARDIO_FACTOR,
  DELOAD_SETS,
  DELOAD_WEEKS,
  PLAN_START,
  TOTAL_WEEKS,
  exercises,
  phases,
} from './plan'
import type { CardioItem, ExerciseItem, Phase, PlanItem, ResolvedWorkout } from './types'

export const DAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MS_DAY = 86_400_000

export function workoutKey(week: number, day: number) {
  return `S${week}-D${day}`
}

export function parseWorkoutKey(key: string): { week: number; day: number } | null {
  const m = /^S(\d+)-D(\d)$/.exec(key)
  return m ? { week: Number(m[1]), day: Number(m[2]) } : null
}

export function startDate() {
  return new Date(PLAN_START.year, PLAN_START.month - 1, PLAN_START.day)
}

export function dateFor(week: number, day: number) {
  const s = startDate()
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + (week - 1) * 7 + (day - 1))
}

export function isDeload(week: number) {
  return DELOAD_WEEKS.includes(week)
}

export function phaseFor(week: number): Phase {
  return phases.find((p) => week >= p.firstWeek && week <= p.lastWeek) ?? phases[phases.length - 1]
}

function daysBetween(a: Date, b: Date) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / MS_DAY)
}

export type TodayStatus =
  | { kind: 'antes'; daysUntil: number }
  | { kind: 'treino' }
  | { kind: 'domingo' }
  | { kind: 'fim' }

/** Onde "hoje" cai no plano e qual treino abrir por padrão. */
export function locateToday(now = new Date()): { week: number; day: number; status: TodayStatus } {
  const diff = daysBetween(startDate(), now)
  if (diff < 0) return { week: 1, day: 1, status: { kind: 'antes', daysUntil: -diff } }
  const week = Math.floor(diff / 7) + 1
  const dow = diff % 7 // 0 = segunda … 6 = domingo
  if (week > TOTAL_WEEKS) return { week: TOTAL_WEEKS, day: 6, status: { kind: 'fim' } }
  if (dow === 6) {
    // Domingo: mostra o próximo treino (segunda seguinte), se houver.
    if (week === TOTAL_WEEKS) return { week, day: 6, status: { kind: 'fim' } }
    return { week: week + 1, day: 1, status: { kind: 'domingo' } }
  }
  return { week, day: dow + 1, status: { kind: 'treino' } }
}

function scaleMinutes(m: number | undefined) {
  return m === undefined ? undefined : Math.round(m * DELOAD_CARDIO_FACTOR)
}

function applyDeload(item: PlanItem): PlanItem {
  if (item.kind === 'ex') return { ...item, sets: Math.min(item.sets, DELOAD_SETS) }
  if (item.fixed) return item
  return {
    ...item,
    minutes: scaleMinutes(item.minutes),
    minutesMax: scaleMinutes(item.minutesMax),
    rounds: item.rounds === undefined ? undefined : Math.max(1, Math.round(item.rounds * DELOAD_CARDIO_FACTOR)),
  }
}

export function getWorkout(week: number, day: number): ResolvedWorkout {
  const phase = phaseFor(week)
  const def = phase.days[day]
  const base = typeof def === 'function' ? def(week) : def
  const deload = isDeload(week)
  return {
    ...base,
    items: deload ? base.items.map(applyDeload) : base.items,
    week,
    day,
    date: dateFor(week, day),
    phase,
    deload,
    warmup: base.type === 'forca',
  }
}

// ---------- textos ----------

export function exerciseName(id: string) {
  return exercises[id]?.name ?? id
}

export function videoUrl(id: string) {
  const info = exercises[id]
  const query = info?.video ?? `${info?.name ?? id} execução`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function formatTarget(item: ExerciseItem) {
  const side = item.perSide ? `/${item.perSide}` : ''
  if (item.reps.startsWith('RIR')) return `${item.sets} séries · 2 reps antes da falha`
  return `${item.sets}x${item.reps}${side}`
}

export function formatRest(item: ExerciseItem) {
  if (!item.rest) return null
  const fmt = (s: number) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s}s`)
  return item.restMax ? `${item.rest}–${item.restMax}s` : fmt(item.rest)
}

export function formatCardioTarget(item: CardioItem) {
  const parts: string[] = []
  if (item.rounds) parts.push(`${item.rounds}x ${item.detail ?? ''}`.trim())
  if (item.minutes) parts.push(item.minutesMax ? `${item.minutes}–${item.minutesMax} min` : `${item.minutes} min`)
  if (item.detail && !item.rounds) parts.push(item.detail)
  return parts.join(' · ')
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const dateLongFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

export function formatDate(d: Date) {
  return dateFmt.format(d)
}
export function formatDateLong(d: Date) {
  return dateLongFmt.format(d)
}

export function weekRange(week: number) {
  return `${formatDate(dateFor(week, 1))} – ${formatDate(dateFor(week, 6))}`
}

/** Todos os ids de exercícios usados em algum treino, na ordem em que aparecem. */
export function allExerciseIds(): string[] {
  const ids = new Set<string>()
  for (let w = 1; w <= TOTAL_WEEKS; w++)
    for (let d = 1; d <= 6; d++)
      for (const it of getWorkout(w, d).items) if (it.kind === 'ex') ids.add(it.id)
  return [...ids]
}
