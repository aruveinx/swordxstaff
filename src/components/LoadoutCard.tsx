import type { ReactNode } from 'react'
import ClassBackground from './ClassBackground'
import { colorOf } from './ClassNav'
import LoadoutSlots from './LoadoutSlots'
import { classLabel, type Loadout } from '../data/loadouts'
import { classIcon, type Skill } from '../data/skills'

interface Props {
  loadout: Loadout
  onOpenSkill: (skill: Skill) => void
  children?: ReactNode
  headingLevel?: 'h2' | 'h3'
  showArtwork?: boolean
}

export default function LoadoutCard({ loadout, onOpenSkill, children, headingLevel: Heading = 'h2', showArtwork = false }: Props) {
  const icon = classIcon(loadout.classId)
  return (
    <article
      className="relative isolate flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 border-t-4 border-t-[var(--path-color)] bg-white p-4 dark:border-x-zinc-700 dark:border-b-zinc-700 dark:bg-zinc-900"
      style={{ ['--path-color' as string]: colorOf(loadout.pathId) }}
    >
      {showArtwork && <ClassBackground pathId={loadout.pathId} classId={loadout.classId} variant="card" />}
      <div className="flex items-center gap-2">
        {icon && <img src={icon} alt="" className="size-8" />}
        <div className="min-w-0">
          <Heading className="truncate font-semibold">{loadout.name}</Heading>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{classLabel(loadout.pathId, loadout.classId)}</p>
        </div>
      </div>
      <LoadoutSlots loadout={loadout} compact onSlotClick={(_, __, skill) => skill && onOpenSkill(skill)} />
      {children && <div className="mt-auto flex flex-wrap gap-2 pt-1">{children}</div>}
    </article>
  )
}
