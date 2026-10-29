/*
 * PLANO DE TREINO – edite aqui.
 *
 * - `exercises`: catálogo com nome, tipo de registro e observação técnica.
 *   O histórico de cada exercício é ligado pelo id (ex.: 'goblet'), então
 *   mantenha o mesmo id se quiser que a evolução de carga continue.
 * - `phases`: treinos de segunda (1) a sábado (6) de cada fase. Um dia pode ser
 *   um treino fixo ou uma função `(semana) => treino` quando muda por semana.
 * - Semanas leves são aplicadas automaticamente (ver DELOAD_* abaixo).
 *
 * Helpers:
 *   ex(id, séries, reps, { rest, restMax, perSide, note, optional })
 *   cardio(id, nome, { minutes, minutesMax, rounds, detail, note, fixed })
 */
import type { CardioItem, ExerciseInfo, ExerciseItem, Phase, Workout } from './types'

/** Segunda-feira da semana 1 (ano, mês 1–12, dia). */
export const PLAN_START = { year: 2026, month: 11, day: 2 }
export const TOTAL_WEEKS = 13

/** Semanas leves: mesmos exercícios, só DELOAD_SETS séries e cardio reduzido. */
export const DELOAD_WEEKS = [4, 8, 12]
export const DELOAD_SETS = 2
export const DELOAD_CARDIO_FACTOR = 0.7 // 30% menor

export const SAFETY_NOTICE =
  'Pare se sentir dor irradiando para a perna, formigamento ou dor lombar que piora durante a série.'

/** Aquecimento de todo dia de força (mostrado como checklist). */
export const WARMUP = ['5 min de bike leve', 'Bird dog 2x8 por lado', 'Ponte de glúteo 2x12']

export const exercises: Record<string, ExerciseInfo> = {
  goblet: {
    name: 'Agachamento goblet',
    kind: 'peso',
    note: 'Halter colado ao peito, tronco alto. Desça só até onde a lombar fica neutra.',
  },
  bulgaro: {
    name: 'Agachamento búlgaro',
    kind: 'peso',
    note: 'Tronco levemente inclinado à frente, joelho alinhado com o pé. Apoie-se se precisar de equilíbrio.',
  },
  'leg-press': {
    name: 'Leg press',
    kind: 'peso',
    note: 'Quadril não descola do banco: limite a descida antes da lombar arredondar.',
  },
  'hip-thrust': {
    name: 'Hip thrust',
    kind: 'peso',
    note: 'Queixo recolhido, costelas para baixo. Suba com o glúteo, sem hiperestender a lombar.',
  },
  'mesa-flexora': {
    name: 'Mesa flexora',
    kind: 'peso',
    note: 'Quadril colado no banco, movimento controlado na volta.',
  },
  'terra-romeno-unilateral': {
    name: 'Terra romeno unilateral (halter leve)',
    kind: 'peso',
    note: 'Coluna neutra, quadril vai para trás. Amplitude curta; pare antes de perder a posição.',
  },
  'prancha-lateral': {
    name: 'Prancha lateral',
    kind: 'tempo',
    note: 'Corpo em linha reta, quadril alto. Pode apoiar o joelho para facilitar.',
  },
  'dead-bug': {
    name: 'Dead bug',
    kind: 'corporal',
    note: 'Lombar encostada no chão o tempo todo; expire ao estender braço e perna.',
  },
  'pallof-press': {
    name: 'Pallof press',
    kind: 'peso',
    note: 'Resista à rotação: quadril e ombros virados para frente, braços estendem e voltam devagar.',
  },
  'supino-halter': {
    name: 'Supino com halter',
    kind: 'peso',
    note: 'Escápulas encaixadas, pés firmes no chão, sem arquear demais a lombar.',
  },
  'remada-peito-apoiado': {
    name: 'Remada no peito apoiado',
    kind: 'peso',
    note: 'Peito colado no apoio; puxe com as costas, sem dar tranco.',
  },
  puxada: {
    name: 'Puxada frente',
    kind: 'peso',
    note: 'Tronco quase vertical, puxe a barra até o queixo/peito sem balançar.',
  },
  desenvolvimento: {
    name: 'Desenvolvimento sentado com halter',
    kind: 'peso',
    note: 'Encosto alto e lombar apoiada; costelas para baixo ao subir.',
  },
  rosca: {
    name: 'Rosca',
    kind: 'peso',
    note: 'Em sequência com o tríceps na polia. Cotovelos parados, sem balançar o tronco.',
  },
  'triceps-polia': {
    name: 'Tríceps na polia',
    kind: 'peso',
    note: 'Feito logo após a rosca. Cotovelos junto ao corpo, abdômen firme.',
  },
  'remada-cabo': {
    name: 'Remada no cabo sentado',
    kind: 'peso',
    note: 'Coluna neutra, sem jogar o tronco para trás; puxe até o abdômen.',
  },
  flexao: {
    name: 'Flexão',
    kind: 'corporal',
    note: 'Pare 2 repetições antes da falha. Corpo em prancha; pode apoiar no banco.',
  },
  'farmers-carry': {
    name: 'Farmers carry',
    kind: 'carregamento',
    note: 'Ombros para trás e para baixo, abdômen firme, passos curtos.',
  },
}

// ---------- helpers ----------

type ExOpts = Omit<ExerciseItem, 'kind' | 'id' | 'sets' | 'reps'>
type CardioOpts = Omit<CardioItem, 'kind' | 'id' | 'name'>

const ex = (id: string, sets: number, reps: string, opts: ExOpts = {}): ExerciseItem => {
  if (!exercises[id]) throw new Error(`Exercício "${id}" não existe no catálogo`)
  return { kind: 'ex', id, sets, reps, ...opts }
}
const cardio = (id: string, name: string, opts: CardioOpts = {}): CardioItem => ({
  kind: 'cardio',
  id,
  name,
  ...opts,
})

// Descansos padrão (segundos)
const R90 = { rest: 90 }
const R90_120 = { rest: 90, restMax: 120 }
const R120 = { rest: 120 }

const coreTerca = [
  ex('dead-bug', 3, '10', { perSide: 'lado', rest: 45 }),
  ex('prancha-lateral', 3, '30 s', { perSide: 'lado', rest: 30 }),
]

// ---------- FASE 1 – BASE ----------

const fase1: Phase = {
  id: 1,
  name: 'Base',
  firstWeek: 1,
  lastWeek: 5,
  effort: 'Termine cada série com 3–4 repetições sobrando.',
  days: {
    1: {
      title: 'Força A',
      subtitle: 'Inferiores',
      type: 'forca',
      items: [
        ex('goblet', 3, '12', R90),
        ex('bulgaro', 3, '10', { ...R90, perSide: 'perna' }),
        ex('leg-press', 3, '12', R90),
        ex('hip-thrust', 3, '12', R90),
        ex('mesa-flexora', 3, '12', { rest: 60 }),
        ex('prancha-lateral', 3, '30 s', { perSide: 'lado', rest: 30 }),
        cardio('bike', 'Bike', { minutes: 30, detail: 'zona 2' }),
      ],
    },
    2: {
      title: 'Cardio + core',
      type: 'cardio',
      items: [
        cardio('esteira', 'Esteira inclinada', { minutes: 20, detail: '8–10% de inclinação, 5–5,5 km/h' }),
        cardio('escada', 'Escada', { minutes: 25, detail: 'ritmo de conversa' }),
        ...coreTerca,
      ],
    },
    3: {
      title: 'Força B',
      subtitle: 'Superiores',
      type: 'forca',
      items: [
        ex('supino-halter', 3, '10–12', R90),
        ex('remada-peito-apoiado', 3, '12', R90),
        ex('puxada', 3, '12', R90),
        ex('desenvolvimento', 3, '10', R90),
        ex('rosca', 2, '12', { rest: 0 }),
        ex('triceps-polia', 2, '12', { rest: 60 }),
        ex('pallof-press', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('caminhada', 'Caminhada inclinada', { minutes: 30 }),
      ],
    },
    4: (week) => ({
      title: 'Corrida',
      subtitle: 'Intervalado',
      type: 'corrida',
      items: [
        cardio('caminhada', 'Caminhada', { minutes: 5, fixed: true, detail: 'aquecimento' }),
        week <= 2
          ? cardio('intervalado', 'Intervalado', { rounds: 8, detail: '(1 min correndo + 2 min andando)' })
          : cardio('intervalado', 'Intervalado', { rounds: 6, detail: '(2 min correndo + 2 min andando)' }),
        cardio('bike', 'Bike', { minutes: 20, detail: 'zona 2' }),
      ],
    }),
    5: {
      title: 'Força C',
      subtitle: 'Full body',
      type: 'forca',
      items: [
        ex('leg-press', 3, '15', { ...R90, note: 'Mais leve que na segunda.' }),
        ex('hip-thrust', 3, '12', R90),
        ex('remada-cabo', 3, '12', R90),
        ex('flexao', 3, 'RIR 2', { rest: 90 }),
        ex('farmers-carry', 4, '30 m', { rest: 60 }),
        ex('dead-bug', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('cardio', 'Escada ou bike', { minutes: 30 }),
      ],
    },
    6: {
      title: 'Cardio longo',
      subtitle: '50–60 min em zona 2',
      type: 'cardio',
      items: [
        cardio('bike', 'Bike', { minutes: 20, detail: 'zona 2' }),
        cardio('esteira', 'Esteira inclinada', { minutes: 20, detail: 'zona 2' }),
        cardio('escada', 'Escada', { minutes: 15, detail: 'zona 2' }),
      ],
    },
  },
}

// ---------- FASE 2 – CONSTRUÇÃO ----------

const fase2: Phase = {
  id: 2,
  name: 'Construção',
  firstWeek: 6,
  lastWeek: 9,
  effort: 'Termine cada série com 2 repetições sobrando.',
  days: {
    1: {
      title: 'Força A',
      subtitle: 'Inferiores',
      type: 'forca',
      items: [
        ex('goblet', 4, '8–10', R90_120),
        ex('bulgaro', 4, '8–10', { ...R90_120, perSide: 'perna' }),
        ex('leg-press', 4, '8–10', R90_120),
        ex('hip-thrust', 4, '8–10', R90_120),
        ex('terra-romeno-unilateral', 3, '10', {
          ...R90,
          perSide: 'perna',
          optional: 'Opcional – só se a lombar estiver bem',
        }),
        ex('mesa-flexora', 4, '8–10', R90_120),
        ex('prancha-lateral', 3, '30 s', { perSide: 'lado', rest: 30 }),
        cardio('bike', 'Bike', { minutes: 40, detail: 'zona 2' }),
      ],
    },
    2: (week) => ({
      title: 'Corrida contínua',
      subtitle: 'Leve',
      type: 'corrida',
      items: [
        cardio('corrida', 'Corrida contínua leve', { minutes: { 6: 25, 7: 30, 8: 30, 9: 35 }[week] ?? 30 }),
        ...coreTerca,
      ],
    }),
    3: {
      title: 'Força B',
      subtitle: 'Superiores',
      type: 'forca',
      items: [
        ex('supino-halter', 4, '8–10', R90_120),
        ex('remada-peito-apoiado', 4, '8–10', R90_120),
        ex('puxada', 4, '8–10', R90_120),
        ex('desenvolvimento', 4, '8–10', R90_120),
        ex('rosca', 2, '12', { rest: 0 }),
        ex('triceps-polia', 2, '12', { rest: 60 }),
        ex('pallof-press', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('caminhada', 'Caminhada inclinada', { minutes: 40 }),
      ],
    },
    4: {
      title: 'Circuito Hyrox',
      subtitle: '5 rounds',
      type: 'hyrox',
      items: [
        cardio('circuito', 'Circuito', {
          rounds: 5,
          detail: '(500 m de remo ou bike + 15 wall balls + 20 m de sled push)',
          note: '1–2 min de descanso entre os rounds.',
        }),
      ],
    },
    5: {
      title: 'Força C',
      subtitle: 'Full body',
      type: 'forca',
      items: [
        ex('leg-press', 4, '8–10', { ...R90_120, note: 'Mais leve que na segunda.' }),
        ex('hip-thrust', 4, '8–10', R90_120),
        ex('remada-cabo', 4, '8–10', R90_120),
        ex('flexao', 4, 'RIR 2', { rest: 90 }),
        ex('farmers-carry', 4, '30 m', { rest: 60 }),
        ex('dead-bug', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('cardio', 'Escada ou bike', { minutes: 40 }),
      ],
    },
    6: {
      title: 'Cardio longo',
      type: 'cardio',
      items: [cardio('longo', 'Cardio longo', { minutes: 60, minutesMax: 75, detail: 'zona 2' })],
    },
  },
}

// ---------- FASE 3 – HYROX ----------

const estacoesHyrox = [
  'Sled push 2x25 m',
  'Sled pull 25 m',
  'Farmers carry 100 m',
  '20 wall balls',
  '20 m de lunges leves',
  'Remo 500 m',
]

const fase3: Phase = {
  id: 3,
  name: 'Hyrox',
  firstWeek: 10,
  lastWeek: 13,
  effort: 'Termine cada série com 1–2 repetições sobrando.',
  days: {
    1: {
      title: 'Força A',
      subtitle: 'Inferiores',
      type: 'forca',
      items: [
        ex('goblet', 4, '6–8', R120),
        ex('bulgaro', 3, '10–12', { ...R90, perSide: 'perna' }),
        ex('leg-press', 4, '6–8', R120),
        ex('hip-thrust', 4, '6–8', R120),
        ex('terra-romeno-unilateral', 3, '10', {
          ...R90,
          perSide: 'perna',
          optional: 'Opcional – só se a lombar estiver bem',
        }),
        ex('mesa-flexora', 3, '10–12', { rest: 60 }),
        ex('prancha-lateral', 3, '30 s', { perSide: 'lado', rest: 30 }),
        cardio('bike', 'Bike', { minutes: 40, detail: 'zona 2' }),
      ],
    },
    2: {
      title: 'Corrida',
      type: 'corrida',
      items: [cardio('corrida', 'Corrida', { minutes: 35, minutesMax: 45 }), ...coreTerca],
    },
    3: {
      title: 'Força B',
      subtitle: 'Superiores',
      type: 'forca',
      items: [
        ex('supino-halter', 4, '6–8', R120),
        ex('remada-peito-apoiado', 4, '6–8', R120),
        ex('puxada', 3, '10–12', R90),
        ex('desenvolvimento', 3, '10–12', R90),
        ex('rosca', 3, '10–12', { rest: 0 }),
        ex('triceps-polia', 3, '10–12', { rest: 60 }),
        ex('pallof-press', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('caminhada', 'Caminhada inclinada', { minutes: 40 }),
      ],
    },
    4: {
      title: 'Hyrox',
      subtitle: '6 rounds',
      type: 'hyrox',
      items: [
        cardio('rounds', 'Rounds', {
          rounds: 6,
          detail: '(1 km na esteira + 1 estação)',
          note: `Estações, nesta ordem: ${estacoesHyrox.join(' → ')}.`,
        }),
      ],
    },
    5: {
      title: 'Força C',
      subtitle: 'Full body',
      type: 'forca',
      items: [
        ex('leg-press', 4, '6–8', { ...R120, note: 'Mais leve que na segunda.' }),
        ex('hip-thrust', 4, '6–8', R120),
        ex('remada-cabo', 4, '6–8', R120),
        ex('flexao', 3, 'RIR 2', { rest: 90 }),
        ex('farmers-carry', 4, '30 m', { rest: 60 }),
        ex('dead-bug', 3, '10', { perSide: 'lado', rest: 45 }),
        cardio('cardio', 'Escada ou bike', { minutes: 40 }),
      ],
    },
    6: (week): Workout =>
      week === 11 || week === 13
        ? {
            title: 'Simulado Hyrox',
            type: 'hyrox',
            items: [
              cardio('simulado', 'Simulado', {
                rounds: 4,
                detail: '(1 km de corrida + 1 estação)',
                note: 'Escolha 4 estações (ex.: sled push, sled pull, farmers carry, wall balls).',
              }),
            ],
          }
        : {
            title: 'Cardio longo',
            type: 'cardio',
            items: [cardio('longo', 'Cardio longo', { minutes: 75, detail: 'zona 2' })],
          },
  },
}

export const phases: Phase[] = [fase1, fase2, fase3]
