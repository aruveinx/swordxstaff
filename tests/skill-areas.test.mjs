import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { cellKey, defaultTarget, effectCells, gridExtent, parseSkillAreaData, rangeCells, shapeCells } from '../src/data/skillAreaGeometry.ts'

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const raw = readJson('../src/assets/data/skill-areas.json')
const data = parseSkillAreaData(raw)
const skills = readJson('../src/assets/data/skills.json')
const keys = (cells) => new Set(cells.map(cellKey))
const firstPanel = (id) => data.patterns[data.skills[id].pattern][0]

test('every Technique and spatial Charm is covered; entries refer to real skill IDs', () => {
  const ids = new Set(skills.map((skill) => String(skill.id)))
  for (const id of Object.keys(data.skills)) assert.ok(ids.has(id), `Unknown skill ${id}`)
  for (const skill of skills) {
    const entry = data.skills[skill.id] ?? data.defaults[skill.type]
    assert.ok(entry, `Missing area for ${skill.name}`)
    if (skill.type === 'Technique' || /within \d|grid area|in front|behind the caster|next to the caster|around the caster/i.test(skill.description)) {
      assert.ok(data.skills[skill.id], `Missing explicit area for ${skill.name}`)
    }
    if (!entry.pattern) assert.ok(entry.notes?.length, `Missing explanation for ${skill.name}`)
  }
})

test('JSON conventions and colors match the requested grid', () => {
  assert.equal(raw.conventions.distance, 'manhattan')
  assert.equal(raw.conventions.front, 'negative-y')
  assert.deepEqual(raw.conventions.origin, [0, 0])
  assert.deepEqual(raw.conventions.overlapPriority, ['caster', 'effect', 'range', 'empty'])
  assert.equal(data.colors.caster, '#ffffff')
  assert.equal(data.colors.range, '#3b82f6')
  assert.equal(data.colors.effect, '#ef4444')
})

test('default diamonds use Manhattan distance while explicit squares include diagonals', () => {
  for (let radius = 1; radius <= 7; radius++) {
    const cells = shapeCells(data.shapes[`diamond-${radius}`])
    assert.equal(cells.length, 1 + 2 * radius * (radius + 1))
    assert.ok(cells.every(([x, y]) => Math.abs(x) + Math.abs(y) <= radius))
  }
  assert.equal(shapeCells(data.shapes['diamond-1']).length, 5)
  assert.ok(!keys(shapeCells(data.shapes['diamond-1'])).has('1,1'))
  assert.equal(shapeCells(data.shapes['square-1']).length, 9)
  assert.ok(keys(shapeCells(data.shapes['square-1'])).has('1,1'))
  assert.equal(shapeCells(data.shapes['square-3']).length, 49)
})

test('diamond minimum range excludes the dead zone and exact range forms a diamond ring', () => {
  const panel = firstPanel('10001')
  const range = keys(rangeCells(panel, data.shapes))
  assert.equal(range.size, 48)
  assert.ok(!range.has('3,3'))
  assert.ok(range.has('2,2'))
  assert.ok(range.has('1,2'))
  assert.ok(range.has('0,-5'))
  assert.ok(!range.has('1,1'))
  assert.ok(!range.has('0,0'))
  assert.deepEqual(defaultTarget(panel, data.shapes), [0, -5])
  assert.deepEqual(rangeCells(firstPanel('10118'), data.shapes), rangeCells(panel, data.shapes))
  const exact = keys(rangeCells(firstPanel('10101'), data.shapes))
  assert.equal(exact.size, 8)
  assert.ok(exact.has('1,1'))
  assert.ok(exact.has('0,-2'))
  assert.ok(!exact.has('0,-1'))
  assert.ok(!exact.has('2,2'))
})

test('static previews always target the furthest eligible cell directly in front', () => {
  for (const panels of Object.values(data.patterns)) {
    for (const panel of panels) {
      const target = defaultTarget(panel, data.shapes)
      if (!panel.range) {
        assert.deepEqual(target, panel.previewTarget ?? [0, 0])
        continue
      }
      const forward = rangeCells(panel, data.shapes).filter(([x, y]) => x === 0 && y < 0)
      assert.deepEqual(target, [0, Math.min(...forward.map(([, y]) => y))], panel.label)
    }
  }
  const panel = { ...firstPanel('10028'), previewTarget: [0, -1] }
  assert.deepEqual(defaultTarget(panel, data.shapes), [0, -5])
  assert.equal(effectCells(panel, data.shapes, defaultTarget(panel, data.shapes)).length, 9)
})

test('single-target attacks affect one cell; the caster cannot be the enemy target', () => {
  const panel = firstPanel('10000')
  assert.equal(rangeCells(panel, data.shapes).length, 40)
  assert.ok(!keys(rangeCells(panel, data.shapes)).has('0,0'))
  assert.ok(!keys(rangeCells(panel, data.shapes)).has('4,4'))
  assert.deepEqual(effectCells(panel, data.shapes, [2, 2]), [[2, 2]])
})

test('targeted square areas translate with the target, including self-centered casts', () => {
  const panel = firstPanel('10028')
  assert.ok(keys(rangeCells(panel, data.shapes)).has('0,0'))
  assert.equal(rangeCells(panel, data.shapes).length, 61)
  assert.ok(!keys(rangeCells(panel, data.shapes)).has('5,-5'))
  const cells = keys(effectCells(panel, data.shapes, [2, -3]))
  assert.equal(cells.size, 9)
  assert.ok(cells.has('1,-4'))
  assert.ok(cells.has('3,-2'))
  assert.ok(!cells.has('0,0'))
})

test('unqualified targeted, caster-centered, and triggered areas are diamonds', () => {
  const targeted = effectCells(firstPanel('10043'), data.shapes, [2, -2])
  assert.equal(targeted.length, 5)
  assert.ok(keys(targeted).has('2,-3'))
  assert.ok(!keys(targeted).has('3,-3'))
  assert.equal(effectCells(firstPanel('10031'), data.shapes, [0, 0]).length, 13)
  assert.equal(effectCells(firstPanel('10543'), data.shapes, [0, -3]).length, 5)
  assert.equal(effectCells(firstPanel('10503'), data.shapes, [0, -3]).length, 13)
  assert.equal(effectCells(firstPanel('10570'), data.shapes, [0, -3]).length, 5)
  assert.equal(effectCells(firstPanel('10641'), data.shapes, [0, -3]).length, 9)
  for (const id of ['10571', '10658']) {
    assert.equal(effectCells(firstPanel(id), data.shapes, [0, 0]).length, 49)
  }
  for (const id of ['10044', '10014', '10513']) {
    assert.equal(effectCells(firstPanel(id), data.shapes, [0, 0]).length, 9)
  }
})

test('forward rectangles are width by depth, exclude the caster, and always point up', () => {
  for (const [name, shape] of Object.entries(data.shapes)) {
    if (shape.kind !== 'rectangle') continue
    const cells = shapeCells(shape)
    assert.equal(cells.length, shape.width * shape.depth, name)
    assert.ok(cells.every(([, y]) => y < 0 && y >= -shape.depth), name)
    assert.ok(cells.every(([x]) => Math.abs(x) <= Math.floor(shape.width / 2)), name)
  }
  assert.equal(shapeCells({ kind: 'rectangle', width: 2, depth: 3 }).length, 6)
  assert.equal(effectCells(firstPanel('10003'), data.shapes, [0, -3]).length, 12)
  assert.equal(effectCells(firstPanel('10075'), data.shapes, [0, -3]).length, 8)
})

test('explicit circles and crosses remain different from squares', () => {
  assert.equal(shapeCells(data.shapes['circle-2']).length, 13)
  assert.equal(shapeCells(data.shapes['circle-3']).length, 29)
  assert.equal(shapeCells(data.shapes['cross-2']).length, 9)
  assert.ok(!keys(shapeCells(data.shapes['cross-2'])).has('1,1'))
  assert.equal(effectCells(firstPanel('10146'), data.shapes, [0, -3]).length, 9)
})

test('movement area is centered on landing and moving single hits do not become splash attacks', () => {
  const panel = firstPanel('10015')
  assert.equal(rangeCells(panel, data.shapes).length, 24)
  assert.deepEqual(effectCells(panel, data.shapes, [1, 2]), shapeCells(data.shapes['diamond-1']).map(([x, y]) => [x + 1, y + 2]))
  assert.deepEqual(effectCells(firstPanel('10055'), data.shapes, [2, 3]), [[2, 2]])
  for (const name of ['move-3-area-1', 'move-3-area-2', 'move-5-area-2', 'move-4-single', 'move-5-single', 'place-4', 'teleport-4']) {
    const movement = data.patterns[name][0]
    assert.equal(data.shapes[movement.range].kind, 'diamond', name)
    assert.ok(!keys(rangeCells(movement, data.shapes)).has('0,0'), name)
  }
})

test('phases stay separate, chains show only the initial hit, and unknown summons are not invented', () => {
  assert.equal(data.patterns[data.skills['10074'].pattern].length, 2)
  const phases = data.patterns[data.skills['10111'].pattern]
  assert.deepEqual(phases.map((panel) => effectCells(panel, data.shapes, [0, 0]).length), [9, 13])
  assert.equal(effectCells(firstPanel('10030'), data.shapes, [0, -3]).length, 1)
  assert.match(data.skills['10030'].notes.join(' '), /No fixed final area/)
  assert.equal(data.skills['10058'].status, 'unspecified')
  assert.equal(data.skills['10058'].pattern, undefined)
})

test('all skill ranges and effect geometries match their source descriptions', () => {
  for (const skill of skills) {
    const entry = data.skills[skill.id]
    if (/square area|circular area|cross area|\d+×\d+/.test(skill.description)) {
      assert.ok(entry?.pattern, `${skill.name}: explicit geometry must have a preview`)
    }
    if (!entry?.pattern) continue
    const panels = data.patterns[entry.pattern]
    const effects = panels.flatMap((panel) => panel.effects.map((effect) => ({ ...effect, geometry: data.shapes[effect.shape] })))
    for (const panel of panels) {
      if (!panel.range) continue
      const range = data.shapes[panel.range]
      assert.equal(range.kind, 'diamond', `${skill.name}: unqualified cast/trigger/movement range must be diamond`)
      const distance = skill.description.match(/within (\d+)(?: to (\d+))? grids?/)
        ?? skill.description.match(/that is (\d+) grids/)
      assert.ok(distance, `${skill.name}: range has no source distance`)
      assert.equal(range.radius, Number(distance[2] ?? distance[1]), `${skill.name}: range radius differs from description`)
      if (distance[2]) assert.equal(range.minRadius, Number(distance[1]), `${skill.name}: minimum range differs from description`)
    }
    const explicitShapes = [
      ['square', /(?:within|in) (?:a )?(\d+)-grid square area/g],
      ['circle', /within (?:a )?(\d+)-grid circular area/g],
      ['cross', /within (?:a )?(\d+)-grid cross area/g],
    ]
    for (const [kind, expression] of explicitShapes) {
      const radii = [...skill.description.matchAll(expression)].map((match) => Number(match[1]))
      const actualRadii = effects.filter(({ geometry }) => geometry.kind === kind).map(({ geometry }) => geometry.radius)
      assert.deepEqual(actualRadii.sort((a, b) => a - b), radii.sort((a, b) => a - b), `${skill.name}: ${kind} area must be explicitly described`)
    }
    for (const { geometry } of effects) {
      if (geometry.kind !== 'diamond') continue
      assert.ok([...skill.description.matchAll(/within (\d+) grids?/g)].some((match) => Number(match[1]) === geometry.radius),
        `${skill.name}: diamond radius has no matching unqualified distance`)
    }
    const rectangle = skill.description.match(/(\d+)×(\d+)(?: grid)? area/)
    if (rectangle) {
      assert.ok(effects.some(({ geometry }) => geometry.kind === 'rectangle'
        && geometry.width === Number(rectangle[1]) && geometry.depth === Number(rectangle[2])), `${skill.name}: rectangle differs from description`)
    }
    const selection = skill.description.match(/selects? (?:a|1) (?:grid|target) within (\d+) grids/i)
    if (selection) {
      assert.ok(panels.some((panel) => panel.range && data.shapes[panel.range].kind === 'diamond'
        && data.shapes[panel.range].radius === Number(selection[1])), `${skill.name}: cast range differs from description`)
    }
    const targetRadius = skill.description.match(/all enemies within (\d+) grids? of the target grid/)
    if (targetRadius) {
      assert.ok(effects.some(({ anchor, geometry }) => anchor === 'target'
        && geometry.kind === 'diamond' && geometry.radius === Number(targetRadius[1])), `${skill.name}: target area differs from description`)
    }
  }
})

test('every preview stays centered with an odd grid that contains all possible effect cells', () => {
  for (const [name, panels] of Object.entries(data.patterns)) {
    for (const panel of panels) {
      const range = rangeCells(panel, data.shapes)
      const target = defaultTarget(panel, data.shapes)
      if (panel.range) assert.ok(keys(range).has(cellKey(target)), `${name}: invalid default target`)
      const extent = gridExtent(panel, data.shapes)
      assert.ok(Number.isInteger(extent) && extent >= 2)
      for (const cell of panel.range ? range : [target]) {
        for (const [x, y] of [cell, ...effectCells(panel, data.shapes, cell)]) {
          assert.ok(Math.abs(x) <= extent && Math.abs(y) <= extent, `${name}: clipped effect at ${x},${y}`)
        }
      }
    }
  }
})

test('invalid editable JSON fails explicitly with context', () => {
  const changed = () => structuredClone(raw)
  const badShape = changed()
  badShape.shapes['diamond-1'].radius = -1
  assert.throws(() => parseSkillAreaData(badShape), /Invalid skill area shape: diamond-1/)
  const badCell = changed()
  badCell.shapes['horizontal-3'].cells = [[1]]
  assert.throws(() => parseSkillAreaData(badCell), /Invalid skill area shape: horizontal-3/)
  const badReference = changed()
  badReference.skills['10000'].pattern = 'missing'
  assert.throws(() => parseSkillAreaData(badReference), /Unknown skill area pattern in 10000/)
  const badAnchor = changed()
  badAnchor.patterns['single-1'][0].effects[0].anchor = 'missing'
  assert.throws(() => parseSkillAreaData(badAnchor), /Invalid skill area pattern: single-1/)
  const badEffect = changed()
  badEffect.patterns['single-1'][0].effects[0].shape = 'missing'
  assert.throws(() => parseSkillAreaData(badEffect), /Unknown skill area shape in single-1/)
})
