import { describe, expect, it } from 'vitest'
import { exercises, phases, TOTAL_WEEKS } from './plan'
import { dateFor, formatCardioTarget, getWorkout, locateToday, phaseFor } from './schedule'

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

describe('calendário', () => {
  it('começa na segunda 02/11/2026 e termina no sábado 30/01/2027', () => {
    expect(ymd(dateFor(1, 1))).toBe('2026-11-2')
    expect(dateFor(1, 1).getDay()).toBe(1)
    expect(ymd(dateFor(TOTAL_WEEKS, 6))).toBe('2027-1-30')
    expect(dateFor(TOTAL_WEEKS, 6).getDay()).toBe(6)
  })

  it('semanas leves caem nas datas combinadas', () => {
    expect(ymd(dateFor(4, 1))).toBe('2026-11-23')
    expect(ymd(dateFor(8, 6))).toBe('2026-12-26')
    expect(ymd(dateFor(12, 1))).toBe('2027-1-18')
  })

  it('fases cobrem as semanas certas', () => {
    expect([1, 5, 6, 9, 10, 13].map((w) => phaseFor(w).id)).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('localiza hoje', () => {
    expect(locateToday(new Date(2026, 9, 29)).status).toEqual({ kind: 'antes', daysUntil: 4 })
    expect(locateToday(new Date(2026, 10, 4))).toMatchObject({ week: 1, day: 3, status: { kind: 'treino' } })
    expect(locateToday(new Date(2026, 10, 8))).toMatchObject({ week: 2, day: 1, status: { kind: 'domingo' } })
    expect(locateToday(new Date(2027, 0, 30))).toMatchObject({ week: 13, day: 6, status: { kind: 'treino' } })
    expect(locateToday(new Date(2027, 0, 31)).status.kind).toBe('fim')
  })
})

describe('treinos', () => {
  it('todo dia de todas as semanas tem treino com exercícios válidos', () => {
    for (let w = 1; w <= TOTAL_WEEKS; w++)
      for (let d = 1; d <= 6; d++) {
        const wk = getWorkout(w, d)
        expect(wk.items.length).toBeGreaterThan(0)
        for (const it of wk.items) if (it.kind === 'ex') expect(exercises[it.id]).toBeDefined()
        const ids = wk.items.map((i) => `${i.kind}:${i.id}`)
        expect(new Set(ids).size).toBe(ids.length)
      }
    expect(phases).toHaveLength(3)
  })

  it('semana leve: 2 séries e cardio 30% menor', () => {
    const normal = getWorkout(3, 1)
    const leve = getWorkout(4, 1)
    expect(leve.deload).toBe(true)
    for (const it of leve.items) if (it.kind === 'ex') expect(it.sets).toBe(2)
    const bike = leve.items.find((i) => i.kind === 'cardio')!
    expect(bike.kind === 'cardio' && bike.minutes).toBe(21)
    expect(normal.items.find((i) => i.kind === 'ex' && i.id === 'goblet')).toMatchObject({ sets: 3 })
  })

  it('corrida da fase 1 muda na semana 3', () => {
    const t = (w: number) => getWorkout(w, 4).items.find((i) => i.id === 'intervalado')
    expect(t(2)).toMatchObject({ rounds: 8 })
    expect(t(3)).toMatchObject({ rounds: 6 })
  })

  it('sábado da fase 3 alterna cardio longo e simulado', () => {
    expect(getWorkout(10, 6).title).toBe('Cardio longo')
    expect(getWorkout(11, 6).title).toBe('Simulado Hyrox')
    expect(getWorkout(13, 6).title).toBe('Simulado Hyrox')
    const longo12 = getWorkout(12, 6).items[0]
    expect(longo12.kind === 'cardio' && formatCardioTarget(longo12)).toBe('53 min · zona 2')
  })
})
