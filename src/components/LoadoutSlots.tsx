import { useRef, useState, type PointerEvent } from 'react'
import { SkillIcon } from './SkillDialog'
import { SLOT_TYPE, type Loadout, type SlotKind, type SlotTarget } from '../data/loadouts'
import { getSkill, type Skill } from '../data/skills'

const KINDS: SlotKind[] = ['techniques', 'charms']
const DRAG_THRESHOLD = 8

interface PointerDrag {
  source: SlotTarget
  pointerId: number
  startX: number
  startY: number
  active: boolean
}

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
  const container = useRef<HTMLDivElement>(null)
  const pointerDrag = useRef<PointerDrag | null>(null)
  const suppressClick = useRef(false)
  const reorderable = editable && !!onReorder

  const move = (kind: SlotKind, from: number, to: number) => {
    if (from === to) return
    onReorder?.(kind, from, to)
    const skill = getSkill(loadout[kind][from] ?? '')
    setStatus(`Moved ${skill?.name ?? SLOT_TYPE[kind]} to ${SLOT_TYPE[kind]} slot ${to + 1}.`)
  }

  const endDrag = () => {
    pointerDrag.current = null
    setDragged(null)
    setDropTarget(null)
  }

  const slotAtPointer = (event: PointerEvent<HTMLButtonElement>, kind: SlotKind): SlotTarget | null => {
    const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot-kind]')
    if (!slot || !container.current?.contains(slot) || slot.getAttribute('data-slot-kind') !== kind) return null
    const index = Number(slot.getAttribute('data-slot-index'))
    return { kind, index }
  }

  const updatePointerDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = pointerDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return
      drag.active = true
      setDragged(drag.source)
    }
    event.preventDefault()
    const destination = slotAtPointer(event, drag.source.kind)
    setDropTarget(destination?.index === drag.source.index ? null : destination)
  }

  const finishPointerDrag = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const drag = pointerDrag.current
    if (!drag || drag.pointerId !== event.pointerId) return
    suppressClick.current = drag.active
    if (drag.active && !cancelled) {
      const destination = slotAtPointer(event, drag.source.kind)
      if (destination) move(drag.source.kind, drag.source.index, destination.index)
    }
    endDrag()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div ref={container} className={compact ? 'space-y-2' : 'space-y-4'}>
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
                  data-slot-kind={kind}
                  data-slot-index={i}
                  className={`relative min-w-0 rounded-lg ${dropTarget?.kind === kind && dropTarget.index === i ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}
                >
                  <button
                    type="button"
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onPointerDown={(event) => {
                      suppressClick.current = false
                      if (!reorderable || !skill || !event.isPrimary || event.button !== 0) return
                      pointerDrag.current = {
                        source: { kind, index: i },
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                        active: false,
                      }
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }}
                    onPointerMove={updatePointerDrag}
                    onPointerUp={(event) => finishPointerDrag(event, false)}
                    onPointerCancel={(event) => finishPointerDrag(event, true)}
                    onLostPointerCapture={(event) => finishPointerDrag(event, true)}
                    onContextMenu={(event) => {
                      if (reorderable && skill) event.preventDefault()
                    }}
                    onClick={(event) => {
                      if (suppressClick.current && event.detail !== 0) {
                        suppressClick.current = false
                        return
                      }
                      onSlotClick(kind, i, skill)
                    }}
                    disabled={!editable && !skill}
                    aria-label={editable ? `${label}. Choose skill` : label}
                    aria-pressed={editable ? target?.kind === kind && target.index === i : undefined}
                    title={skill?.name}
                    className={`flex w-full flex-col items-center gap-1 rounded-lg border text-center transition ${reorderable && skill ? 'touch-none select-none cursor-grab active:cursor-grabbing [-webkit-touch-callout:none]' : ''} ${dragged?.kind === kind && dragged.index === i ? 'opacity-60' : ''} ${compact ? 'p-1' : 'p-2'} ${
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
