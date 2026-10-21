import { useEffect, useRef, useState } from 'react'
import LoadoutCard from './LoadoutCard'
import LoadoutEditor from './LoadoutEditor'
import SkillDialog from './SkillDialog'
import SkillDatabase from './SkillDatabase'
import type { PathDef } from '../data/classes'
import { changeClass, classLabel, createLoadout, findPath, isCompatible, shareHash, type Loadout, type SlotTarget } from '../data/loadouts'
import { getSkill, type Skill } from '../data/skills'
import type { useLoadouts } from '../hooks/useLoadouts'
import { copyText } from '../utils/clipboard'

export const shareUrl = (loadout: Loadout) => `${window.location.href.split('#')[0]}${shareHash(loadout)}`

type Store = ReturnType<typeof useLoadouts>

const buttonClass = 'rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800'

interface Props {
  store: Store
  filter: { path: PathDef; classId: string }
  onFilterChange: (filter: Props['filter']) => void
  highlightId?: string | null
}

export default function LoadoutBuilder({ store, filter, onFilterChange, highlightId }: Props) {
  const { loadouts, save, remove, error } = store
  const [editing, setEditing] = useState<{ loadout: Loadout; draft: Loadout; isNew: boolean } | null>(null)
  const [target, setTarget] = useState<SlotTarget | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [skill, setSkill] = useState<Skill | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const copyTimer = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  useEffect(() => {
    if (!target) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTarget(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [target])

  useEffect(() => {
    if (highlightId) document.getElementById(`loadout-${highlightId}`)?.scrollIntoView({ block: 'nearest' })
  }, [highlightId])

  const copyLink = async (loadout: Loadout) => {
    if (await copyText(shareUrl(loadout))) {
      setCopied(loadout.id)
      setStatus(`Link to "${loadout.name}" copied to clipboard.`)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(null), 2000)
    }
  }

  const del = (loadout: Loadout) => {
    if (!window.confirm(`Delete loadout "${loadout.name}"? This cannot be undone.`)) return
    remove(loadout.id)
    setStatus(`Deleted "${loadout.name}".`)
  }

  const startEditing = (loadout: Loadout, isNew: boolean) => {
    const path = findPath(loadout.pathId)
    if (path) onFilterChange({ path, classId: loadout.classId })
    setEditing({ loadout, draft: loadout, isNew })
    setTarget(null)
    setNotice(null)
  }

  const selectClass = (path: PathDef, classId: string) => {
    onFilterChange({ path, classId })
    if (!editing) return
    const { loadout, removed } = changeClass(editing.draft, path.id, classId, getSkill)
    setEditing({ ...editing, draft: loadout })
    setNotice(removed ? `Removed ${removed} skill${removed === 1 ? '' : 's'} that ${classLabel(path.id, classId)} cannot use.` : null)
  }

  const openSkill = (selected: Skill) => {
    if (!editing || !target) {
      setSkill(selected)
      return
    }
    const { draft } = editing
    const slot = draft[target.kind].indexOf(String(selected.id))
    if (!isCompatible(selected, target.kind, draft.pathId, draft.classId) || (slot >= 0 && slot !== target.index)) return
    setEditing({
      ...editing,
      draft: { ...draft, [target.kind]: draft[target.kind].map((id, index) => index === target.index ? String(selected.id) : id) },
    })
    setTarget(null)
  }

  return (
    <SkillDatabase
      path={filter.path}
      classId={filter.classId}
      onClassSelect={selectClass}
      onOpen={openSkill}
      selection={editing && target ? { draft: editing.draft, target } : null}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">My loadouts</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => startEditing(createLoadout(filter.path.id, filter.classId), true)}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            + New loadout
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {status}
      </p>

      <div className="mt-5">
        {editing ? (
          <LoadoutEditor
            key={editing.loadout.id}
            initial={editing.loadout}
            draft={editing.draft}
            target={target}
            notice={notice}
            isNew={editing.isNew}
            onChange={(draft) => setEditing({ ...editing, draft })}
            onTargetChange={setTarget}
            onSave={(l) => {
              save(l)
              setStatus(`Saved "${l.name}".`)
              setEditing(null)
              setTarget(null)
            }}
            onCancel={() => {
              setEditing(null)
              setTarget(null)
            }}
          />
        ) : loadouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No loadouts yet. Create one to get started.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadouts.map((l) => (
              <li key={l.id} id={`loadout-${l.id}`} className={l.id === highlightId ? 'rounded-xl ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-zinc-950' : undefined}>
                <LoadoutCard loadout={l} onOpenSkill={setSkill} showArtwork>
                  <button type="button" onClick={() => startEditing(l, false)} className={buttonClass}>
                    Edit
                  </button>
                  <button type="button" onClick={() => copyLink(l)} className={buttonClass}>
                    {copied === l.id ? 'Copied!' : 'Copy link'}
                  </button>
                  <button type="button" onClick={() => del(l)} className={`${buttonClass} text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950`}>
                    Delete
                  </button>
                </LoadoutCard>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SkillDialog skill={skill} onClose={() => setSkill(null)} onSelect={setSkill} />
    </SkillDatabase>
  )
}
