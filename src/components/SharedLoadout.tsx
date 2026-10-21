import { useState } from 'react'
import LoadoutCard from './LoadoutCard'
import SkillDialog from './SkillDialog'
import { classLabel, newId, type decodeShare } from '../data/loadouts'
import type { Skill } from '../data/skills'
import type { useLoadouts } from '../hooks/useLoadouts'
import { navigate } from '../hooks/useHashRoute'

interface Props {
  shared: ReturnType<typeof decodeShare>
  store: ReturnType<typeof useLoadouts>
}

export default function SharedLoadout({ shared, store }: Props) {
  const [skill, setSkill] = useState<Skill | null>(null)

  if (!shared) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Shared loadout</h1>
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950 dark:text-red-300">
          This loadout link is invalid or incomplete.
        </p>
        <a href="#/" className="mt-4 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
          Go to the Loadout Builder
        </a>
      </div>
    )
  }

  const { loadout, removed } = shared

  const saveCopy = () => {
    const id = newId()
    store.save({ ...loadout, id })
    navigate(`#/?saved=${encodeURIComponent(id)}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shared loadout</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Someone shared this loadout with you. Save it to edit it and keep it in this browser.</p>
      {removed > 0 && (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {removed} skill{removed === 1 ? ' was' : 's were'} removed because {removed === 1 ? 'it is' : 'they are'} unknown or not usable by {classLabel(loadout.pathId, loadout.classId)}.
        </p>
      )}
      <div className="mt-5 max-w-sm">
        <LoadoutCard loadout={loadout} onOpenSkill={setSkill}>
          <button type="button" onClick={saveCopy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Save to my loadouts
          </button>
        </LoadoutCard>
      </div>
      <SkillDialog skill={skill} onClose={() => setSkill(null)} onSelect={setSkill} />
    </div>
  )
}
