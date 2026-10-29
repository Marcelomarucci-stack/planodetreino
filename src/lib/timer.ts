import { useEffect, useState, useSyncExternalStore } from 'react'

/*
 * Timer de descanso global. Guarda o horário de término (e não um contador),
 * então continua certo mesmo se a tela bloquear ou o navegador pausar a aba.
 */
interface TimerState {
  endsAt: number | null
  total: number
  label: string
  finishedAt: number | null
}

let state: TimerState = { endsAt: null, total: 0, label: '', finishedAt: null }
const listeners = new Set<() => void>()
let tick: number | undefined

function set(next: Partial<TimerState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.2)
    })
    setTimeout(() => ctx.close(), 1000)
  } catch {
    /* sem áudio */
  }
}

function check() {
  if (state.endsAt && Date.now() >= state.endsAt) {
    clearInterval(tick)
    tick = undefined
    navigator.vibrate?.([300, 150, 300])
    beep()
    set({ endsAt: null, finishedAt: Date.now() })
  }
}

export function startTimer(seconds: number, label: string) {
  clearInterval(tick)
  set({ endsAt: Date.now() + seconds * 1000, total: seconds, label, finishedAt: null })
  tick = window.setInterval(check, 250)
}

export function addTime(seconds: number) {
  if (!state.endsAt) return
  set({ endsAt: state.endsAt + seconds * 1000, total: state.total + seconds })
}

export function stopTimer() {
  clearInterval(tick)
  tick = undefined
  set({ endsAt: null, finishedAt: null })
}

export function useTimer() {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!s.endsAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [s.endsAt])
  const remaining = s.endsAt ? Math.max(0, Math.ceil((s.endsAt - now) / 1000)) : 0
  return { ...s, running: s.endsAt !== null, remaining }
}
