import { useState, type FormEvent } from 'react'
import LoadoutSlots from './LoadoutSlots'
import { NAME_MAX_LENGTH, SLOT_TYPE, classLabel, cleanName, type Loadout, type SlotKind, type SlotTarget } from '../data/loadouts'

interface Props {
  initial: Loadout
  draft: Loadout
  target: SlotTarget | null
  notice: string | null
  isNew: boolean
  onChange: (draft: Loadout) => void
  onTargetChange: (target: SlotTarget | null) => void
  onSave: (loadout: Loadout) => void
  onCancel: () => void
}

export default function LoadoutEditor({ initial, draft, target, notice, isNew, onChange, onTargetChange, onSave, onCancel }: Props) {
  const [nameError, setNameError] = useState(false)

  const setSlot = (kind: SlotKind, index: number, id: string | null) =>
    onChange({ ...draft, [kind]: draft[kind].map((v, i) => (i === index ? id : v)) })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = cleanName(draft.name)
    if (!name) {
      setNameError(true)
      return
    }
    onSave({ ...draft, name })
  }

  const cancel = () => {
    const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
    if (!dirty || window.confirm('Discard unsaved changes?')) onCancel()
  }

  return (
      <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isNew ? 'New loadout' : 'Edit loadout'}</h2>

        <div>
          <label htmlFor="loadout-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="loadout-name"
            value={draft.name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => {
              onChange({ ...draft, name: e.target.value })
              setNameError(false)
            }}
            placeholder="e.g. Boss DPS"
            aria-invalid={nameError}
            aria-describedby={nameError ? 'loadout-name-error' : undefined}
            autoFocus
            className={`mt-1 w-full max-w-sm rounded-lg border px-3 py-2 ${nameError ? 'border-red-500' : 'border-zinc-300'}`}
          />
          {nameError && (
            <p id="loadout-name-error" className="mt-1 text-sm text-red-600">
              Please enter a name.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium">
            Class: <span className="font-semibold">{classLabel(draft.pathId, draft.classId)}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">Use the class filters above to change this loadout's class. A class can equip its own skills and those of earlier classes in its path.</p>
          {notice && (
            <p role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {notice}
            </p>
          )}
        </div>

        <div className="max-w-md">
          <LoadoutSlots
            loadout={draft}
            editable
            target={target}
            onSlotClick={(kind, index) => onTargetChange({ kind, index })}
            onClear={(kind, index) => setSlot(kind, index, null)}
          />
        </div>

        <div role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {target ? (
            <>
              <p>Choose {SLOT_TYPE[target.kind]} {target.index + 1}: click a skill below to equip it. Already-equipped skills and other skill types are unavailable.</p>
              <button type="button" onClick={() => onTargetChange(null)} className="mt-2 font-medium underline">
                Cancel selection
              </button>
            </>
          ) : (
            <p>Click a slot to select a skill from the list below. Otherwise, clicking a skill opens its description.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Save loadout
          </button>
          <button type="button" onClick={cancel} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
            Cancel
          </button>
        </div>
      </form>
  )
}
