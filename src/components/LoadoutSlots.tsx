import { useState } from 'react'
import { SkillIcon } from './SkillDialog'
import { SLOT_TYPE, type Loadout, type SlotKind, type SlotTarget } from '../data/loadouts'
import { getSkill, type Skill } from '../data/skills'

const KINDS: SlotKind[] = ['techniques', 'charms']

interface Props {
  loadout: Pick<Loadout, 'techniques' | 'charms'>
  /** Called when a filled slot is clicked (read-only mode) or any slot is clicked (edit mode). */
  onSlotClick: (kind: SlotKind, index: number, skill: Skill | undefined) => void
  onClear?: (kind: SlotKind, index: number) => void
  onReorder?: (kind: SlotKind, from: number, to: number) => void
  editable?: boolean
  compact?: boolean
  target?: SlotTarget | null
}

export default function LoadoutSlots({ loadout, onSlotClick, onClear, onReorder, editable = false, compact = false, target }: Props) {
  const [dragged, setDragged] = useState<SlotTarget | null>(null)
  const [dropTarget, setDropTarget] = useState<SlotTarget | null>(null)
  const [status, setStatus] = useState('')
  const reorderable = editable && !!onReorder

  const move = (kind: SlotKind, from: number, to: number) => {
    if (from === to) return
    onReorder?.(kind, from, to)
    const skill = getSkill(loadout[kind][from] ?? '')
    setStatus(`Moved ${skill?.name ?? SLOT_TYPE[kind]} to ${SLOT_TYPE[kind]} slot ${to + 1}.`)
  }

  const endDrag = () => {
    setDragged(null)
    setDropTarget(null)
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <p role="status" className="sr-only">{status}</p>
      {KINDS.map((kind) => (
        <div key={kind}>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">{SLOT_TYPE[kind]}s</h3>
          <ol className={`grid grid-cols-4 ${compact ? 'gap-1.5' : 'gap-2'}`}>
            {loadout[kind].map((id, i) => {
              const skill = id ? getSkill(id) : undefined
              const label = `${SLOT_TYPE[kind]} slot ${i + 1}: ${skill ? skill.name : 'empty'}`
              return (
                <li
                  key={i}
                  className={`relative min-w-0 rounded-lg ${dropTarget?.kind === kind && dropTarget.index === i ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}
                  onDragOver={(event) => {
                    if (!reorderable || dragged?.kind !== kind || dragged.index === i) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    setDropTarget({ kind, index: i })
                  }}
                  onDragLeave={(event) => {
                    if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTarget(null)
                  }}
                  onDrop={(event) => {
                    if (!reorderable || dragged?.kind !== kind) return
                    event.preventDefault()
                    move(kind, dragged.index, i)
                    endDrag()
                  }}
                >
                  <button
                    type="button"
                    draggable={reorderable && !!skill}
                    onDragStart={(event) => {
                      if (!reorderable || !skill) {
                        event.preventDefault()
                        return
                      }
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', String(skill.id))
                      setDragged({ kind, index: i })
                    }}
                    onDragEnd={endDrag}
                    onClick={() => onSlotClick(kind, i, skill)}
                    disabled={!editable && !skill}
                    aria-label={editable ? `${label}. Choose skill` : label}
                    aria-pressed={editable ? target?.kind === kind && target.index === i : undefined}
                    title={skill?.name}
                    className={`flex w-full flex-col items-center gap-1 rounded-lg border text-center transition ${reorderable && skill ? 'cursor-grab active:cursor-grabbing' : ''} ${compact ? 'p-1' : 'p-2'} ${
                      skill ? 'border-zinc-200 bg-white hover:border-[var(--path-color)] hover:shadow' : 'border-dashed border-zinc-300 bg-zinc-50 text-zinc-400'
                    } ${editable && !skill ? 'hover:border-[var(--path-color)] hover:text-zinc-600' : ''} ${target?.kind === kind && target.index === i ? 'ring-2 ring-[var(--path-color)]' : ''}`}
                  >
                    {skill ? (
                      <SkillIcon skill={skill} size={compact ? 'size-10' : 'size-12'} />
                    ) : (
                      <span className={`${compact ? 'size-10' : 'size-12'} flex items-center justify-center text-2xl`}>{editable ? '+' : ''}</span>
                    )}
                    {!compact && <span className="w-full truncate text-xs leading-tight">{skill?.name ?? 'Empty'}</span>}
                  </button>
                  {editable && skill && onClear && (
                    <button
                      type="button"
                      onClick={() => onClear(kind, i)}
                      aria-label={`Remove ${skill.name}`}
                      title="Remove"
                      className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm leading-none text-zinc-600 shadow hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}
