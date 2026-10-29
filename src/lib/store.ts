import { useSyncExternalStore } from 'react'

/*
 * Persistência em localStorage com versionamento de esquema.
 * Todos os registros ficam em uma única chave; ao mudar o formato,
 * incremente SCHEMA_VERSION e acrescente um passo em `migrate`.
 */

export const SCHEMA_VERSION = 1
const STORAGE_KEY = 'planodetreino:data'

export interface SetLog {
  kg: string
  /** Repetições, segundos ou metros, conforme o tipo do exercício. */
  reps: string
  done: boolean
}

export interface CardioLog {
  time: string
  distance: string
  note: string
}

export interface WorkoutLog {
  sets: Record<string, SetLog[]>
  cardio: Record<string, CardioLog>
  /** Itens do aquecimento marcados (índices). */
  warmup: number[]
  rpe?: number
  notes: string
  completedAt?: string
  updatedAt: string
}

export interface AppData {
  schemaVersion: number
  logs: Record<string, WorkoutLog>
  lastBackupAt?: string
}

const empty = (): AppData => ({ schemaVersion: SCHEMA_VERSION, logs: {} })

export function emptyLog(): WorkoutLog {
  return { sets: {}, cardio: {}, warmup: [], notes: '', updatedAt: new Date().toISOString() }
}

/** Converte dados de versões anteriores (ou backups) para o formato atual. */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo sem dados válidos.')
  const data = raw as Partial<AppData>
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0
  if (version > SCHEMA_VERSION)
    throw new Error('Este backup é de uma versão mais nova do app. Atualize o app e tente de novo.')
  if (!data.logs || typeof data.logs !== 'object') throw new Error('Backup sem registros de treino.')
  // Versão 1 é a primeira; futuras migrações entram aqui (if (version < 2) {...}).
  const logs: Record<string, WorkoutLog> = {}
  for (const [key, log] of Object.entries(data.logs)) {
    if (!log || typeof log !== 'object') continue
    logs[key] = { ...emptyLog(), ...(log as Partial<WorkoutLog>) }
  }
  return { schemaVersion: SCHEMA_VERSION, logs, lastBackupAt: data.lastBackupAt }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrate(JSON.parse(raw)) : empty()
  } catch (e) {
    console.error('Falha ao ler dados salvos', e)
    return empty()
  }
}

let state: AppData = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Falha ao salvar', e)
    alert('Não foi possível salvar os dados neste aparelho. Exporte um backup em Ajustes.')
  }
}

function setState(next: AppData) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

export function getData() {
  return state
}

export function useData(): AppData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export function updateLog(key: string, fn: (log: WorkoutLog) => WorkoutLog) {
  const current = state.logs[key] ?? emptyLog()
  const next = { ...fn(current), updatedAt: new Date().toISOString() }
  setState({ ...state, logs: { ...state.logs, [key]: next } })
}

// ---------- backup ----------

export function exportBackup(): { filename: string; json: string } {
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const payload = { app: 'planodetreino', exportedAt: now.toISOString(), ...state, lastBackupAt: now.toISOString() }
  return { filename: `plano-treino-backup-${stamp}.json`, json: JSON.stringify(payload, null, 2) }
}

export function markBackupDone() {
  setState({ ...state, lastBackupAt: new Date().toISOString() })
}

/**
 * Importa um backup mesclando com os dados atuais: para cada treino,
 * fica o registro alterado mais recentemente.
 */
export function importBackup(json: string): { imported: number } {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  const incoming = migrate(parsed)
  const logs = { ...state.logs }
  let imported = 0
  for (const [key, log] of Object.entries(incoming.logs)) {
    const mine = logs[key]
    if (!mine || mine.updatedAt < log.updatedAt) {
      logs[key] = log
      imported++
    }
  }
  setState({ ...state, logs })
  return { imported }
}

export function clearAll() {
  setState(empty())
}

/** Pede ao navegador para não apagar os dados automaticamente (quando suportado). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* sem suporte */
  }
}
