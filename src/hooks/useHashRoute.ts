import { useEffect, useState } from 'react'

export interface Route {
  path: string
  query: string
}

function decode(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function parse(): Route {
  let hash = window.location.hash.replace(/^#/, '')
  // Some tools percent-encode the whole fragment (e.g. `#%2Fshare%3Fv%3D1`); restore it.
  if (/^%2F/i.test(hash)) hash = decode(hash)
  const q = hash.indexOf('?')
  return { path: (q < 0 ? hash : hash.slice(0, q)) || '/', query: q < 0 ? '' : hash.slice(q + 1) }
}

export function navigate(hash: string) {
  window.location.hash = hash
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
