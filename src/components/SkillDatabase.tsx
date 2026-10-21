import type { ReactNode } from 'react'
import { SkillIcon } from './SkillDialog'
import ClassNav, { colorOf } from './ClassNav'
import { availableClasses, type ClassDef, type PathDef } from '../data/classes'
import { isCompatible, type Loadout, type SlotTarget } from '../data/loadouts'
import { classIcon, skillsFor, type Skill, type SkillType } from '../data/skills'

const TYPES: SkillType[] = ['Technique', 'Charm']

interface SkillSelection {
  draft: Loadout
  target: SlotTarget
}

interface GridProps {
  onOpen: (s: Skill) => void
  selection: SkillSelection | null
}

function SkillGrid({ skills, onOpen, selection }: GridProps & { skills: Skill[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
      {skills.map((s) => {
        const slot = selection ? selection.draft[selection.target.kind].indexOf(String(s.id)) : -1
        const current = !!selection && slot === selection.target.index
        const disabled = !!selection && (
          !isCompatible(s, selection.target.kind, selection.draft.pathId, selection.draft.classId)
          || (slot >= 0 && !current)
        )
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s)}
            disabled={disabled}
            aria-current={current || undefined}
            title={slot >= 0 && !current ? `${s.name} (in slot ${slot + 1})` : s.name}
            className={`flex flex-col items-center gap-1 rounded-lg border bg-white p-2 text-center transition enabled:hover:border-[var(--path-color)] enabled:hover:shadow disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-900 ${current ? 'border-[var(--path-color)] ring-2 ring-[var(--path-color)]' : 'border-zinc-200 dark:border-zinc-700 dark:enabled:hover:border-[var(--path-color)]'}`}
          >
            <SkillIcon skill={s} size="size-12" />
            <span className="text-xs leading-tight">{s.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function ClassSection({ cls, onOpen, selection }: GridProps & { cls: ClassDef }) {
  const icon = classIcon(cls.id)
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h2 className="mb-3 flex items-center gap-2 border-l-4 border-[var(--path-color)] pl-3 text-lg font-semibold">
        {icon && <img src={icon} alt="" className="size-8" />}
        {cls.label}
      </h2>
      <div className="space-y-4">
        {TYPES.map((type) => {
          const skills = skillsFor(cls.id, type)
          if (!skills.length) return null
          return (
            <div key={type}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {type}s <span className="font-normal">({skills.length})</span>
              </h3>
              <SkillGrid skills={skills} onOpen={onOpen} selection={selection} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface Props extends GridProps {
  path: PathDef
  classId: string
  onClassSelect: (path: PathDef, classId: string) => void
  children: ReactNode
}

export default function SkillDatabase({ path, classId, onClassSelect, onOpen, selection, children }: Props) {
  const classes = availableClasses(path, classId).reverse()

  return (
    <div style={{ ['--path-color' as string]: colorOf(path.id) }}>
      <h1 className="text-2xl font-semibold">Sword X Staff Loadout Builder</h1>
      <div className="mt-4">
        <ClassNav pathId={path.id} classId={classId} onSelect={onClassSelect} />
      </div>
      <div className="mt-5">{children}</div>
      <div className="mt-5 space-y-5">
        {classes.map((cls) => (
          <ClassSection key={cls.id} cls={cls} onOpen={onOpen} selection={selection} />
        ))}
      </div>
    </div>
  )
}
