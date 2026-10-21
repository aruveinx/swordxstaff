import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEY, parseStored, serializeStored, type Loadout } from '../data/loadouts'
import { getSkill } from '../data/skills'

/** Returns null when localStorage is unavailable (e.g. blocked by privacy settings). */
function read(): Loadout[] | null {
  try {
    return parseStored(localStorage.getItem(STORAGE_KEY), getSkill)
  } catch {
    return null
  }
}

/** Loadouts persisted in localStorage, kept in sync across tabs. */
export function useLoadouts() {
  const [loadouts, setLoadouts] = useState<Loadout[]>(() => read() ?? [])
  const [error, setError] = useState<string | null>(null)
  const current = useRef(loadouts)
  current.current = loadouts

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setLoadouts(read() ?? [])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((update: (prev: Loadout[]) => Loadout[]) => {
    // Read fresh from storage so concurrent edits in other tabs are not overwritten.
    const next = update(read() ?? current.current)
    try {
      localStorage.setItem(STORAGE_KEY, serializeStored(next))
      setError(null)
    } catch {
      setError('Could not save to local storage. Your browser may be blocking storage or be out of space.')
    }
    setLoadouts(next)
  }, [])

  const save = useCallback(
    (loadout: Loadout) =>
      commit((prev) => {
        const saved = { ...loadout, updatedAt: Date.now() }
        const i = prev.findIndex((l) => l.id === loadout.id)
        return i < 0 ? [...prev, saved] : prev.map((l, j) => (j === i ? saved : l))
      }),
    [commit],
  )

  const remove = useCallback((id: string) => commit((prev) => prev.filter((l) => l.id !== id)), [commit])

  return { loadouts, save, remove, error }
}
