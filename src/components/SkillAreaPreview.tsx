import type { Skill } from '../data/skills'
import { areaForSkill, SKILL_AREAS } from '../data/skillAreas'
import { cellKey, defaultTarget, effectCells, gridExtent, rangeCells, type AreaPanel, type Cell } from '../data/skillAreaGeometry'

const { colors, shapes } = SKILL_AREAS

function AreaGrid({ panel }: { panel: AreaPanel }) {
  const target = defaultTarget(panel, shapes)
  const range = new Set(rangeCells(panel, shapes).map(cellKey))
  const effects = new Set(effectCells(panel, shapes, target).map(cellKey))
  const extent = gridExtent(panel, shapes)
  const size = extent * 2 + 1

  return (
    <div
      role="img"
      aria-label={`${panel.label}. Caster at center, facing up, in white; range in blue; effect in red.`}
      className="skill-area-grid"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: size * size }, (_, index) => {
        const cell: Cell = [index % size - extent, Math.floor(index / size) - extent]
        const key = cellKey(cell)
        const kind = key === '0,0' ? 'caster' : effects.has(key) ? 'effect' : range.has(key) ? 'range' : 'empty'
        return <span key={key} aria-hidden="true" className="skill-area-cell" style={{ backgroundColor: colors[kind] }} />
      })}
    </div>
  )
}

export default function SkillAreaPreview({ skill }: { skill: Skill }) {
  const { panels } = areaForSkill(skill)
  return (
    <div className="min-w-0 space-y-2">
      {panels.map((panel, index) => <AreaGrid key={`${skill.id}:${index}`} panel={panel} />)}
    </div>
  )
}
