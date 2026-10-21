import raw from '../assets/data/skills.json'

export type SkillType = 'Technique' | 'Charm'

export interface Keyword {
  name: string
  description: string
}

export interface Scaling {
  stat: string
  percent: boolean
  values: number[]
}

export interface Skill {
  id: number | string
  name: string
  type: SkillType
  cooldown?: number
  class: string
  tags?: string[]
  description: string
  keywords?: Keyword[]
  icon?: string
  scaling?: Scaling[]
  summon_skills?: string[]
}

export const SKILLS = raw as Skill[]

const iconUrls = import.meta.glob('../assets/img/*.png', { eager: true, import: 'default' }) as Record<string, string>

function urlFor(name: string): string | undefined {
  return iconUrls[`../assets/img/${name}.png`]
}

export function skillIcon(skill: Skill): string | undefined {
  return urlFor(skill.icon ?? `skill_${skill.id}`)
}

export function classIcon(classId: string): string | undefined {
  return urlFor(classId.toLowerCase())
}

const byId = new Map(SKILLS.map((s) => [String(s.id), s]))
export const getSkill = (id: string) => byId.get(id)

export function skillsFor(classId: string, type: SkillType): Skill[] {
  return SKILLS.filter((s) => s.class === classId && s.type === type).sort((a, b) => a.name.localeCompare(b.name))
}
