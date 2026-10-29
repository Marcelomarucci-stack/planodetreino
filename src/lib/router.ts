import { useSyncExternalStore } from 'react'

/*
 * Rotas por hash (funciona em qualquer hospedagem estática, inclusive GitHub Pages):
 *   #/                    → treino de hoje
 *   #/treino/<sem>/<dia>  → treino específico
 *   #/plano               → visão das 13 semanas
 *   #/historico[/<id>]    → histórico por exercício
 *   #/ajustes             → backup e informações
 */
export type Route =
  | { name: 'hoje' }
  | { name: 'treino'; week: number; day: number }
  | { name: 'plano' }
  | { name: 'historico'; exerciseId?: string }
  | { name: 'ajustes' }

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  switch (parts[0]) {
    case 'treino': {
      const week = Number(parts[1])
      const day = Number(parts[2])
      if (week >= 1 && week <= 13 && day >= 1 && day <= 6) return { name: 'treino', week, day }
      return { name: 'hoje' }
    }
    case 'plano':
      return { name: 'plano' }
    case 'historico':
      return { name: 'historico', exerciseId: parts[1] }
    case 'ajustes':
      return { name: 'ajustes' }
    default:
      return { name: 'hoje' }
  }
}

export function href(route: Route) {
  switch (route.name) {
    case 'hoje':
      return '#/'
    case 'treino':
      return `#/treino/${route.week}/${route.day}`
    case 'historico':
      return route.exerciseId ? `#/historico/${encodeURIComponent(route.exerciseId)}` : '#/historico'
    default:
      return `#/${route.name}`
  }
}

export function navigate(route: Route, replace = false) {
  const h = href(route)
  if (replace) history.replaceState(null, '', h)
  else location.hash = h
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    () => location.hash,
  )
  return parseRoute(hash)
}
