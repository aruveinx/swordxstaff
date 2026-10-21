import type { ReactNode } from 'react'
import { colorOf } from './ClassNav'
import LoadoutSlots from './LoadoutSlots'
import { classLabel, type Loadout } from '../data/loadouts'
import { classIcon, type Skill } from '../data/skills'

interface Props {
  loadout: Loadout
  onOpenSkill: (skill: Skill) => void
  children?: ReactNode
  headingLevel?: 'h2' | 'h3'
}

export default function LoadoutCard({ loadout, onOpenSkill, children, headingLevel: Heading = 'h2' }: Props) {
  const icon = classIcon(loadout.classId)
  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 border-t-4 border-t-[var(--path-color)] bg-white p-4"
      style={{ ['--path-color' as string]: colorOf(loadout.pathId) }}
    >
      <div className="flex items-center gap-2">
        {icon && <img src={icon} alt="" className="size-8" />}
        <div className="min-w-0">
          <Heading className="truncate font-semibold">{loadout.name}</Heading>
          <p className="text-sm text-zinc-600">{classLabel(loadout.pathId, loadout.classId)}</p>
        </div>
      </div>
      <LoadoutSlots loadout={loadout} compact onSlotClick={(_, __, skill) => skill && onOpenSkill(skill)} />
      {children && <div className="mt-auto flex flex-wrap gap-2 pt-1">{children}</div>}
    </article>
  )
}
