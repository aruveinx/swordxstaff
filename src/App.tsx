import { useEffect } from 'react'
import LoadoutBuilder from './components/LoadoutBuilder'
import SharedLoadout from './components/SharedLoadout'
import { SHARE_ROUTE } from './data/loadouts'
import { SKILLS } from './data/skills'
import { useHashRoute } from './hooks/useHashRoute'
import { useLoadouts } from './hooks/useLoadouts'

export default function App() {
  const route = useHashRoute()
  const store = useLoadouts()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.path])

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <a href="#/" className="text-lg font-semibold">
            Taiwan's Sword <span className="text-emerald-700">X</span> Staff
          </a>
          <div className="text-sm text-zinc-500">{SKILLS.length} skills</div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {route.path === SHARE_ROUTE ? (
          <SharedLoadout query={route.query} store={store} />
        ) : (
          <LoadoutBuilder store={store} highlightId={new URLSearchParams(route.query).get('saved')} />
        )}
      </main>
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600">
        <p className="mx-auto max-w-5xl text-center">
          Skill JSON data and assets courtesy of{' '}
          <a
            href="https://lootandwaifus.com/"
            className="rounded-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            Loot &amp; Waifus
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
