import { PATHS, availableClasses, type PathDef, type PathId } from './classes.ts'

export const SLOT_COUNT = 4
export const NAME_MAX_LENGTH = 40
export const STORAGE_KEY = 'swordxstaff.loadouts.v1'

export type SlotKind = 'techniques' | 'charms'
export interface SlotTarget {
  kind: SlotKind
  index: number
}
export type Slots = (string | null)[]

export interface Loadout {
  id: string
  name: string
  pathId: PathId
  classId: string
  techniques: Slots
  charms: Slots
  updatedAt: number
}

/** Minimal skill shape needed for compatibility checks (keeps this module free of JSON imports). */
export interface SkillRef {
  id: number | string
  type: 'Technique' | 'Charm'
  class: string
}

export type SkillLookup = (id: string) => SkillRef | undefined

export const SLOT_TYPE: Record<SlotKind, SkillRef['type']> = { techniques: 'Technique', charms: 'Charm' }

export const findPath = (pathId: string): PathDef | undefined => PATHS.find((p) => p.id === pathId)

export function classLabel(pathId: string, classId: string): string {
  const path = findPath(pathId)
  return (path && availableClasses(path, classId).at(-1)?.label) ?? classId
}

export function isValidClass(pathId: string, classId: string): boolean {
  const path = findPath(pathId)
  return !!path && availableClasses(path, classId).length > 0
}

/** Whether `skill` can be equipped in a `kind` slot by a character of the given class. */
export function isCompatible(skill: SkillRef | undefined, kind: SlotKind, pathId: string, classId: string): boolean {
  const path = findPath(pathId)
  if (!skill || !path || skill.type !== SLOT_TYPE[kind]) return false
  return availableClasses(path, classId).some((c) => c.id === skill.class)
}

export const emptySlots = (): Slots => Array<string | null>(SLOT_COUNT).fill(null)

/**
 * Normalizes slots to exactly SLOT_COUNT entries, emptying unknown, incompatible and duplicate skills.
 * Returns the cleaned slots and how many skills were removed.
 */
export function sanitizeSlots(
  slots: unknown,
  kind: SlotKind,
  pathId: string,
  classId: string,
  lookup: SkillLookup,
): { slots: Slots; removed: number } {
  const input = Array.isArray(slots) ? slots : []
  const seen = new Set<string>()
  let removed = 0
  const out = emptySlots().map((_, i) => {
    const raw = input[i]
    if (raw == null || raw === '') return null
    const id = String(raw)
    if (seen.has(id) || !isCompatible(lookup(id), kind, pathId, classId)) {
      removed++
      return null
    }
    seen.add(id)
    return id
  })
  return { slots: out, removed }
}

export function cleanName(name: unknown): string {
  return typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH) : ''
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createLoadout(pathId: PathId = PATHS[0].id, classId = PATHS[0].classes[0].id): Loadout {
  return { id: newId(), name: '', pathId, classId, techniques: emptySlots(), charms: emptySlots(), updatedAt: Date.now() }
}

/** Validates an untrusted object (from storage or a link). Returns null if the class is invalid. */
export function sanitizeLoadout(value: unknown, lookup: SkillLookup): { loadout: Loadout; removed: number } | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const pathId = String(v.pathId ?? '')
  const classId = String(v.classId ?? '')
  if (!isValidClass(pathId, classId)) return null
  const t = sanitizeSlots(v.techniques, 'techniques', pathId, classId, lookup)
  const c = sanitizeSlots(v.charms, 'charms', pathId, classId, lookup)
  return {
    loadout: {
      id: typeof v.id === 'string' && v.id ? v.id : newId(),
      name: cleanName(v.name) || 'Untitled loadout',
      pathId: pathId as PathId,
      classId,
      techniques: t.slots,
      charms: c.slots,
      updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
    },
    removed: t.removed + c.removed,
  }
}

/** Returns a copy of the loadout for a new class, dropping skills that the new class cannot use. */
export function changeClass(loadout: Loadout, pathId: PathId, classId: string, lookup: SkillLookup) {
  const t = sanitizeSlots(loadout.techniques, 'techniques', pathId, classId, lookup)
  const c = sanitizeSlots(loadout.charms, 'charms', pathId, classId, lookup)
  return { loadout: { ...loadout, pathId, classId, techniques: t.slots, charms: c.slots }, removed: t.removed + c.removed }
}

// ---- Storage ----

interface StoredData {
  version: 1
  loadouts: Loadout[]
}

export function parseStored(text: string | null, lookup: SkillLookup): Loadout[] {
  if (!text) return []
  try {
    const data = JSON.parse(text) as Partial<StoredData>
    if (!Array.isArray(data?.loadouts)) return []
    const ids = new Set<string>()
    return data.loadouts.flatMap((raw) => {
      const result = sanitizeLoadout(raw, lookup)
      if (!result) return []
      const loadout = ids.has(result.loadout.id) ? { ...result.loadout, id: newId() } : result.loadout
      ids.add(loadout.id)
      return [loadout]
    })
  } catch {
    return []
  }
}

export const serializeStored = (loadouts: Loadout[]): string =>
  JSON.stringify({ version: 1, loadouts } satisfies StoredData)

// ---- Share links ----
// Format: v=1&n=<name>&p=<pathId>&c=<classId>&t=<id>.<id>..<id>&h=<id>... (empty segments are empty slots)

const SLOT_SEPARATOR = '.'

export function encodeShare(loadout: Loadout): string {
  const params = new URLSearchParams({
    v: '1',
    n: loadout.name,
    p: loadout.pathId,
    c: loadout.classId,
    t: loadout.techniques.map((id) => id ?? '').join(SLOT_SEPARATOR),
    h: loadout.charms.map((id) => id ?? '').join(SLOT_SEPARATOR),
  })
  return params.toString()
}

export function decodeShare(query: string, lookup: SkillLookup): { loadout: Loadout; removed: number } | null {
  const params = new URLSearchParams(query)
  if (params.get('v') !== '1') return null
  const split = (key: string) => (params.get(key) ?? '').split(SLOT_SEPARATOR)
  return sanitizeLoadout(
    {
      name: params.get('n'),
      pathId: params.get('p'),
      classId: params.get('c'),
      techniques: split('t'),
      charms: split('h'),
    },
    lookup,
  )
}

/** Hash route used for share links, e.g. `#/share?v=1&...`. */
export const SHARE_ROUTE = '/share'

export const shareHash = (loadout: Loadout): string => `#${SHARE_ROUTE}?${encodeShare(loadout)}`
