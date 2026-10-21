export type Cell = readonly [x: number, y: number]

export type AreaShape =
  | { kind: 'diamond' | 'square' | 'circle' | 'cross'; radius: number; minRadius?: number }
  | { kind: 'rectangle'; width: number; depth: number }
  | { kind: 'cells'; cells: Cell[] }

export interface AreaPanel {
  label: string
  range?: string
  allowSelfTarget?: boolean
  effects: { shape: string; anchor: 'caster' | 'target'; offset?: Cell }[]
  targetLabel?: string
  previewTarget?: Cell
}

export interface SkillArea {
  pattern?: string
  status?: 'self' | 'unspecified' | 'inherited' | 'no-fixed-area'
  notes?: string[]
}

export interface SkillAreaData {
  version: number
  colors: Record<'caster' | 'range' | 'effect' | 'empty', string>
  shapes: Record<string, AreaShape>
  patterns: Record<string, AreaPanel[]>
  defaults: Partial<Record<'Technique' | 'Charm', SkillArea>>
  skills: Record<string, SkillArea>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)
const isCell = (value: unknown): value is Cell =>
  Array.isArray(value) && value.length === 2 && value.every(isInteger)

function isShape(value: unknown): value is AreaShape {
  if (!isRecord(value)) return false
  if (value.kind === 'cells') return Array.isArray(value.cells) && value.cells.every(isCell)
  if (value.kind === 'rectangle') {
    return isInteger(value.width) && value.width > 0 && isInteger(value.depth) && value.depth > 0
  }
  return ['diamond', 'square', 'circle', 'cross'].includes(String(value.kind))
    && isInteger(value.radius) && value.radius >= 0
    && (value.minRadius === undefined || (isInteger(value.minRadius) && value.minRadius >= 0 && value.minRadius <= value.radius))
}

function isPanel(value: unknown): value is AreaPanel {
  return isRecord(value) && typeof value.label === 'string'
    && (value.range === undefined || typeof value.range === 'string')
    && (value.allowSelfTarget === undefined || typeof value.allowSelfTarget === 'boolean')
    && (value.targetLabel === undefined || typeof value.targetLabel === 'string')
    && (value.previewTarget === undefined || isCell(value.previewTarget))
    && Array.isArray(value.effects) && value.effects.length > 0
    && value.effects.every((effect: unknown) => isRecord(effect)
      && typeof effect.shape === 'string' && ['caster', 'target'].includes(String(effect.anchor))
      && (effect.offset === undefined || isCell(effect.offset)))
}

function isArea(value: unknown): value is SkillArea {
  return isRecord(value)
    && ((typeof value.pattern === 'string' && value.status === undefined)
      || (value.pattern === undefined && ['self', 'unspecified', 'inherited', 'no-fixed-area'].includes(String(value.status))))
    && (value.notes === undefined || (Array.isArray(value.notes) && value.notes.every((note: unknown) => typeof note === 'string')))
}

export function parseSkillAreaData(value: unknown): SkillAreaData {
  if (!isRecord(value) || value.version !== 1) throw new Error('Unsupported skill area data version')
  const { colors, shapes, patterns, defaults, skills } = value
  if (!isRecord(colors) || typeof colors.caster !== 'string' || typeof colors.range !== 'string'
    || typeof colors.effect !== 'string' || typeof colors.empty !== 'string') {
    throw new Error('Invalid skill area colors')
  }
  if (!isRecord(shapes) || !isRecord(patterns) || !isRecord(defaults) || !isRecord(skills)) {
    throw new Error('Invalid skill area data tables')
  }
  const parsedShapes: Record<string, AreaShape> = {}
  for (const [name, shape] of Object.entries(shapes)) {
    if (!isShape(shape)) throw new Error(`Invalid skill area shape: ${name}`)
    parsedShapes[name] = shape
  }
  const parsedPatterns: Record<string, AreaPanel[]> = {}
  for (const [name, panels] of Object.entries(patterns)) {
    if (!Array.isArray(panels) || !panels.length || !panels.every(isPanel)) throw new Error(`Invalid skill area pattern: ${name}`)
    for (const panel of panels) {
      for (const shape of [panel.range, ...panel.effects.map((effect) => effect.shape)]) {
        if (shape !== undefined && !Object.hasOwn(parsedShapes, shape)) throw new Error(`Unknown skill area shape in ${name}: ${shape}`)
      }
    }
    parsedPatterns[name] = panels
  }
  function parseArea(area: unknown, context: string): SkillArea {
    if (!isArea(area)) throw new Error(`Invalid skill area entry: ${context}`)
    if (area.pattern && !Object.hasOwn(parsedPatterns, area.pattern)) throw new Error(`Unknown skill area pattern in ${context}: ${area.pattern}`)
    return area
  }
  const parsedDefaults: SkillAreaData['defaults'] = {}
  for (const [type, area] of Object.entries(defaults)) {
    if (type !== 'Charm' && type !== 'Technique') throw new Error(`Unknown skill area default: ${type}`)
    parsedDefaults[type] = parseArea(area, type)
  }
  return {
    version: value.version,
    colors: { caster: colors.caster, range: colors.range, effect: colors.effect, empty: colors.empty },
    shapes: parsedShapes,
    patterns: parsedPatterns,
    defaults: parsedDefaults,
    skills: Object.fromEntries(Object.entries(skills).map(([id, area]) => [id, parseArea(area, id)])),
  }
}

export const cellKey = ([x, y]: Cell) => `${x},${y}`

export function shapeCells(shape: AreaShape): Cell[] {
  if (shape.kind === 'cells') return shape.cells
  const cells: Cell[] = []
  if (shape.kind === 'rectangle') {
    for (let y = -shape.depth; y < 0; y++) {
      for (let column = 0; column < shape.width; column++) {
        cells.push([column - Math.floor(shape.width / 2), y])
      }
    }
    return cells
  }
  for (let y = -shape.radius; y <= shape.radius; y++) {
    for (let x = -shape.radius; x <= shape.radius; x++) {
      const distance = shape.kind === 'diamond' ? Math.abs(x) + Math.abs(y)
        : shape.kind === 'circle' ? Math.hypot(x, y) : Math.max(Math.abs(x), Math.abs(y))
      if (distance > shape.radius || distance < (shape.minRadius ?? 0)) continue
      if (shape.kind === 'cross' && x !== 0 && y !== 0) continue
      cells.push([x, y])
    }
  }
  return cells
}

function namedShape(shapes: Record<string, AreaShape>, name: string): Cell[] {
  const shape = shapes[name]
  if (!shape) throw new Error(`Unknown skill area shape: ${name}`)
  return shapeCells(shape)
}

export function rangeCells(panel: AreaPanel, shapes: Record<string, AreaShape>): Cell[] {
  if (!panel.range) return []
  return namedShape(shapes, panel.range).filter(([x, y]) => panel.allowSelfTarget || x !== 0 || y !== 0)
}

export function defaultTarget(panel: AreaPanel, shapes: Record<string, AreaShape>): Cell {
  return rangeCells(panel, shapes)
    .filter(([x, y]) => x === 0 && y < 0).sort((a, b) => a[1] - b[1])[0]
    ?? panel.previewTarget
    ?? [0, 0]
}

export function effectCells(panel: AreaPanel, shapes: Record<string, AreaShape>, target: Cell): Cell[] {
  const cells = new Map<string, Cell>()
  for (const effect of panel.effects) {
    const origin = effect.anchor === 'caster' ? [0, 0] : target
    for (const [x, y] of namedShape(shapes, effect.shape)) {
      const cell: Cell = [x + origin[0] + (effect.offset?.[0] ?? 0), y + origin[1] + (effect.offset?.[1] ?? 0)]
      cells.set(cellKey(cell), cell)
    }
  }
  return [...cells.values()]
}

export function gridExtent(panel: AreaPanel, shapes: Record<string, AreaShape>): number {
  const targets = panel.range ? rangeCells(panel, shapes) : [defaultTarget(panel, shapes)]
  let extent = 2
  for (const cell of targets) {
    for (const [x, y] of [cell, ...effectCells(panel, shapes, cell)]) {
      extent = Math.max(extent, Math.abs(x), Math.abs(y))
    }
  }
  return extent
}
