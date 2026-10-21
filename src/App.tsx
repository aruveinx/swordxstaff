import { useEffect, useMemo, useState } from 'react'
import favicon from './assets/img/favicon.png'
import ClassBackground from './components/ClassBackground'
import LoadoutBuilder from './components/LoadoutBuilder'
import SharedLoadout from './components/SharedLoadout'
import ThemeToggle from './components/ThemeToggle'
import { PATHS } from './data/classes'
import { decodeShare, SHARE_ROUTE } from './data/loadouts'
import { getSkill } from './data/skills'
import { useHashRoute } from './hooks/useHashRoute'
import { useLoadouts } from './hooks/useLoadouts'

const initialFilter = { path: PATHS[0], classId: PATHS[0].classes[0].id }

export default function App() {
  const route = useHashRoute()
  const store = useLoadouts()
  const [filter, setFilter] = useState(initialFilter)
  const isShared = route.path === SHARE_ROUTE
  const shared = useMemo(() => isShared ? decodeShare(route.query, getSkill) : null, [isShared, route.query])
  const background = isShared ? shared?.loadout : { pathId: filter.path.id, classId: filter.classId }

  useEffect(() => {
    window.scrollTo(0, 0)
    if (route.path === SHARE_ROUTE) setFilter(initialFilter)
  }, [route.path])

  return (
    <div className="isolate flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-x-6">
          <a href="#/" className="inline-flex items-center gap-2 text-lg font-semibold">
            <img src={favicon} alt="" width={32} height={32} className="size-8 shrink-0 rounded" />
            <span>
              Taiwan's Sword <span className="text-emerald-700 dark:text-emerald-400">X</span> Staff
            </span>
          </a>
          <ThemeToggle />
        </div>
      </header>
      {background && <ClassBackground pathId={background.pathId} classId={background.classId} />}
      <main className="mx-auto w-full max-w-[var(--page-max-width)] flex-1 px-6 py-8">
        {isShared ? (
          <SharedLoadout shared={shared} store={store} />
        ) : (
          <LoadoutBuilder store={store} filter={filter} onFilterChange={setFilter} highlightId={new URLSearchParams(route.query).get('saved')} />
        )}
      </main>
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="mx-auto max-w-5xl text-center">
          Skill JSON data and assets courtesy of{' '}
          <a
            href="https://lootandwaifus.com/"
            className="rounded-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Loot &amp; Waifus
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
