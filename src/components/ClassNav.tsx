import { PATHS, type PathDef, type PathId } from '../data/classes'

export const colorOf = (id: string) => `var(--color-path-${id})`

interface Props {
  pathId: PathId
  classId: string
  onSelect: (path: PathDef, classId: string) => void
  label?: string
}

/** One row of class buttons per path, including its Warrior or Mage base class. */
export default function ClassNav({ pathId, classId, onSelect, label = 'Class navigation' }: Props) {
  return (
    <nav aria-label={label} className="space-y-2">
      {PATHS.map((path) => (
        <div key={path.id} role="group" aria-label={`${path.label} path`} className="flex gap-2 overflow-x-auto pb-1">
          {[path.root, ...path.classes].map((cls) => {
            const active = path.id === pathId && cls.id === classId
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => onSelect(path, cls.id)}
                aria-pressed={active}
                style={{ borderColor: colorOf(path.id), backgroundColor: active ? colorOf(path.id) : undefined }}
                className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-medium ${active ? 'text-white' : 'bg-white'}`}
              >
                {cls.label}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
