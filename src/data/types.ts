// Tipos do plano de treino. O conteúdo em si fica em plan.ts.

/** Como uma série é registrada. */
export type ExerciseKind =
  | 'peso' // carga (kg) + repetições
  | 'corporal' // só repetições
  | 'tempo' // só segundos
  | 'carregamento' // carga (kg) + distância (m)

export interface ExerciseInfo {
  name: string
  kind: ExerciseKind
  /** Observação técnica exibida no treino. */
  note?: string
}

export interface ExerciseItem {
  kind: 'ex'
  /** Chave no catálogo `exercises` (é ela que liga o histórico entre semanas). */
  id: string
  sets: number
  /** Alvo de repetições/tempo/distância, ex.: "12", "8–10", "30 s", "30 m". */
  reps: string
  /** Ex.: "perna", "lado" → "3x10/perna". */
  perSide?: string
  /** Descanso em segundos (é o valor usado pelo timer). */
  rest?: number
  /** Descanso máximo, para faixas como 90–120 s. */
  restMax?: number
  /** Observação extra, somada à observação técnica do catálogo. */
  note?: string
  /** Texto de exercício opcional, ex.: "Opcional – só se a lombar estiver bem". */
  optional?: string
}

export interface CardioItem {
  kind: 'cardio'
  /** Identificador único dentro do treino. */
  id: string
  name: string
  minutes?: number
  minutesMax?: number
  /** Número de rounds/repetições (intervalados e circuitos). */
  rounds?: number
  /** Texto complementar, ex.: "zona 2" ou "(2 min correndo + 2 min andando)". */
  detail?: string
  note?: string
  /** Não reduz na semana leve (ex.: aquecimento de 5 min). */
  fixed?: boolean
}

export type PlanItem = ExerciseItem | CardioItem

export type WorkoutType = 'forca' | 'cardio' | 'corrida' | 'hyrox'

export interface Workout {
  title: string
  subtitle?: string
  type: WorkoutType
  items: PlanItem[]
}

export interface Phase {
  id: number
  name: string
  firstWeek: number
  lastWeek: number
  /** Orientação de carga da fase. */
  effort: string
  /** Treinos de segunda (1) a sábado (6); podem variar conforme a semana. */
  days: Record<number, Workout | ((week: number) => Workout)>
}

/** Treino já resolvido para uma semana/dia (com semana leve aplicada). */
export interface ResolvedWorkout extends Workout {
  week: number
  day: number
  date: Date
  phase: Phase
  deload: boolean
  warmup: boolean
}
