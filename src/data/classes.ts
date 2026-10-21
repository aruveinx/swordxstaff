export type PathId = 'knight' | 'duelist' | 'sage' | 'sorcerer'

export interface ClassDef {
  /** Must match the "class" value in skills.json (also used for the class icon file name, lowercased). */
  id: string
  /** Label shown in the UI. Edit freely. */
  label: string
}

export interface PathDef {
  id: PathId
  label: string
  /** Shared base class (Warrior / Mage) whose skills every class in the path inherits. */
  root: ClassDef
  /** Ordered from lowest to highest tier. */
  classes: ClassDef[]
}

const c = (id: string, label = id): ClassDef => ({ id, label })

const WARRIOR = c('Warrior')
const MAGE = c('Mage')

export const PATHS: PathDef[] = [
  {
    id: 'knight',
    label: 'Knight',
    root: WARRIOR,
    classes: [c('Knight'), c('Paladin'), c('Guardian'), c('Templar'), c('Justicar'), c('Vindicator')],
  },
  {
    id: 'duelist',
    label: 'Duelist',
    root: WARRIOR,
    classes: [c('Duelist'), c('Berserker'), c('Conqueror'), c('Ravager'), c('Marauder'), c('Doomreaver')],
  },
  {
    id: 'sage',
    label: 'Sage',
    root: MAGE,
    classes: [c('Sage'), c('Arcanist'), c('Dominator'), c('Prophet'), c('Hierarch'), c('Demiurge')],
  },
  {
    id: 'sorcerer',
    label: 'Sorcerer',
    root: MAGE,
    classes: [c('Sorcerer'), c('Archmage'), c('Destroyer'), c('Magister'), c('Arcanarch'), c('Thaumaturge')],
  },
]

/** All classes a character of `classId` can use skills from, in tier order (root first). */
export function availableClasses(path: PathDef, classId: string): ClassDef[] {
  const all = [path.root, ...path.classes]
  const idx = all.findIndex((x) => x.id === classId)
  return idx < 0 ? [] : all.slice(0, idx + 1)
}
