import { SAFETY_NOTICE } from './data/plan'
import { locateToday } from './data/schedule'
import { href, useRoute, type Route } from './lib/router'
import { TimerBar } from './components/TimerBar'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { PlanScreen } from './screens/PlanScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'

const tabs: { label: string; icon: string; route: Route; match: Route['name'][] }[] = [
  { label: 'Treino', icon: '🏋️', route: { name: 'hoje' }, match: ['hoje', 'treino'] },
  { label: 'Plano', icon: '🗓️', route: { name: 'plano' }, match: ['plano'] },
  { label: 'Histórico', icon: '📈', route: { name: 'historico' }, match: ['historico'] },
  { label: 'Ajustes', icon: '⚙️', route: { name: 'ajustes' }, match: ['ajustes'] },
]

export default function App() {
  const route = useRoute()

  let screen
  switch (route.name) {
    case 'hoje': {
      const t = locateToday()
      screen = <WorkoutScreen week={t.week} day={t.day} />
      break
    }
    case 'treino':
      screen = <WorkoutScreen week={route.week} day={route.day} />
      break
    case 'plano':
      screen = <PlanScreen />
      break
    case 'historico':
      screen = <HistoryScreen exerciseId={route.exerciseId} />
      break
    case 'ajustes':
      screen = <SettingsScreen />
      break
  }

  return (
    <div className="app">
      <div className="safety" role="note">
        <span aria-hidden>⚠️</span> {SAFETY_NOTICE}
      </div>
      <main className="content">{screen}</main>
      <TimerBar />
      <nav className="tabbar">
        {tabs.map((t) => (
          <a key={t.label} href={href(t.route)} className={t.match.includes(route.name) ? 'active' : ''}>
            <span className="tab-icon" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
