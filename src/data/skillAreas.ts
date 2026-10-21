import raw from '../assets/data/skill-areas.json'
import type { Skill } from './skills'
import { parseSkillAreaData } from './skillAreaGeometry'

export const SKILL_AREAS = parseSkillAreaData(raw)

export function areaForSkill(skill: Skill) {
  const area = SKILL_AREAS.skills[String(skill.id)] ?? SKILL_AREAS.defaults[skill.type]
  if (!area) throw new Error(`Missing skill area entry for ${skill.name} (${skill.id})`)
  const panels = area.pattern ? SKILL_AREAS.patterns[area.pattern] : []
  if (!panels) throw new Error(`Unknown skill area pattern: ${area.pattern}`)
  return { area, panels }
}
