import { useEffect, useState } from 'react'

const STORAGE_KEY = 'swordxstaff-theme'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') return saved === 'dark'
    } catch (error) {
      console.warn('Could not read the saved theme preference.', error)
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  function toggle() {
    const next = !dark
    setDark(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      setError(null)
    } catch {
      setError('Could not save your theme preference in this browser.')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-label="Dark mode"
        aria-pressed={dark}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {dark ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </>
          ) : (
            <path d="M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z" />
          )}
        </svg>
        <span className="hidden sm:inline">{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>
      {error && <p role="status" className="max-w-xs text-xs text-red-700 dark:text-red-300">{error}</p>}
    </div>
  )
}
