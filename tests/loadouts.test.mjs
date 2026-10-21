import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  SLOT_COUNT,
  changeClass,
  createLoadout,
  decodeShare,
  encodeShare,
  isCompatible,
  parseStored,
  reorderSlots,
  sanitizeLoadout,
  serializeStored,
} from '../src/data/loadouts.ts'

const skills = JSON.parse(readFileSync(new URL('../src/assets/data/skills.json', import.meta.url), 'utf8'))
const byId = new Map(skills.map((s) => [String(s.id), s]))
const lookup = (id) => byId.get(id)
const pick = (cls, type, n = 1) => skills.filter((s) => s.class === cls && s.type === type).slice(0, n).map((s) => String(s.id))

test('reordering moves skills in either direction without mutating the original slots', () => {
  const slots = ['a', 'b', 'c', 'd']
  assert.deepEqual(reorderSlots(slots, 0, 2), ['b', 'c', 'a', 'd'])
  assert.deepEqual(reorderSlots(slots, 3, 1), ['a', 'd', 'b', 'c'])
  assert.deepEqual(reorderSlots(slots, 1, 1), slots)
  assert.deepEqual(slots, ['a', 'b', 'c', 'd'])
})

test('reordering preserves empty slots and rejects invalid indices', () => {
  assert.deepEqual(reorderSlots(['a', null, 'b', null], 0, 3), [null, 'b', null, 'a'])
  for (const [from, to] of [[-1, 0], [0, 4], [4, 0], [0, -1], [0.5, 1], [0, NaN]]) {
    assert.throws(() => reorderSlots(['a', null, null, null], from, to), RangeError)
  }
})

test('reordered skills retain their order in storage and share links', () => {
  const [a, b, c] = pick('Warrior', 'Technique', 3)
  const loadout = {
    ...createLoadout('knight', 'Knight'),
    name: 'Reordered',
    techniques: reorderSlots([a, b, c, null], 0, 2),
  }
  assert.deepEqual(parseStored(serializeStored([loadout]), lookup)[0].techniques, [b, c, a, null])
  assert.deepEqual(decodeShare(encodeShare(loadout), lookup).loadout.techniques, [b, c, a, null])
})

test('compatibility allows own and earlier-tier classes in the same path only', () => {
  const [warriorTech] = pick('Warrior', 'Technique')
  const [paladinTech] = pick('Paladin', 'Technique')
  const [templarTech] = pick('Templar', 'Technique')
  const [duelistTech] = pick('Duelist', 'Technique')
  const [mageTech] = pick('Mage', 'Technique')
  const [paladinCharm] = pick('Paladin', 'Charm')

  assert.ok(isCompatible(lookup(warriorTech), 'techniques', 'knight', 'Paladin'))
  assert.ok(isCompatible(lookup(paladinTech), 'techniques', 'knight', 'Paladin'))
  assert.ok(!isCompatible(lookup(templarTech), 'techniques', 'knight', 'Paladin'), 'higher tier')
  assert.ok(!isCompatible(lookup(duelistTech), 'techniques', 'knight', 'Paladin'), 'other path')
  assert.ok(!isCompatible(lookup(mageTech), 'techniques', 'knight', 'Paladin'), 'other base class')
  assert.ok(!isCompatible(lookup(paladinCharm), 'techniques', 'knight', 'Paladin'), 'charm in technique slot')
  assert.ok(isCompatible(lookup(paladinCharm), 'charms', 'knight', 'Paladin'))
  assert.ok(isCompatible(lookup(warriorTech), 'techniques', 'duelist', 'Warrior'))
  assert.ok(!isCompatible(undefined, 'techniques', 'knight', 'Paladin'))
})

test('sanitizing drops unknown, incompatible and duplicate skills and pads to 4 slots', () => {
  const [a, b] = pick('Warrior', 'Technique', 2)
  const [mage] = pick('Mage', 'Technique')
  const result = sanitizeLoadout(
    { name: '  My   build  ', pathId: 'knight', classId: 'Knight', techniques: [a, a, mage, '999999', b, b], charms: null },
    lookup,
  )
  assert.equal(result.loadout.name, 'My build')
  assert.deepEqual(result.loadout.techniques, [a, null, null, null])
  assert.deepEqual(result.loadout.charms, [null, null, null, null])
  assert.equal(result.removed, 3)
  assert.equal(sanitizeLoadout({ pathId: 'knight', classId: 'Archmage' }, lookup), null)
  assert.equal(sanitizeLoadout({ pathId: 'nope', classId: 'Knight' }, lookup), null)
})

test('changing class removes skills the new class cannot use', () => {
  const [warrior] = pick('Warrior', 'Technique')
  const [templar] = pick('Templar', 'Technique')
  const [templarCharm] = pick('Templar', 'Charm')
  const loadout = { ...createLoadout('knight', 'Templar'), techniques: [warrior, templar, null, null], charms: [templarCharm, null, null, null] }
  const down = changeClass(loadout, 'knight', 'Paladin', lookup)
  assert.equal(down.removed, 2)
  assert.deepEqual(down.loadout.techniques, [warrior, null, null, null])
  assert.deepEqual(down.loadout.charms, [null, null, null, null])
  const otherPath = changeClass(loadout, 'duelist', 'Duelist', lookup)
  assert.deepEqual(otherPath.loadout.techniques, [warrior, null, null, null], 'Warrior skills carry over')
})

test('share links round-trip, preserving empty slot positions', () => {
  const techs = pick('Mage', 'Technique', 2)
  const charms = pick('Sorcerer', 'Charm', 1)
  const loadout = {
    ...createLoadout('sorcerer', 'Archmage'),
    name: 'Fire & Ice / 100% #1',
    techniques: [null, techs[0], null, techs[1]],
    charms: [charms[0], null, null, null],
  }
  const query = encodeShare(loadout)
  const decoded = decodeShare(query, lookup)
  assert.equal(decoded.removed, 0)
  assert.equal(decoded.loadout.name, loadout.name)
  assert.equal(decoded.loadout.pathId, 'sorcerer')
  assert.equal(decoded.loadout.classId, 'Archmage')
  assert.deepEqual(decoded.loadout.techniques, loadout.techniques)
  assert.deepEqual(decoded.loadout.charms, loadout.charms)
})

test('tampered share links are validated', () => {
  const [duelist] = pick('Duelist', 'Technique')
  const [knight] = pick('Knight', 'Technique')
  const decoded = decodeShare(`v=1&n=x&p=knight&c=Knight&t=${duelist}.${knight}&h=`, lookup)
  assert.deepEqual(decoded.loadout.techniques, [null, knight, null, null])
  assert.equal(decoded.removed, 1)
  assert.equal(decodeShare('v=2&p=knight&c=Knight', lookup), null)
  assert.equal(decodeShare('garbage', lookup), null)
})

test('storage round-trips and tolerates corrupt data', () => {
  const a = { ...createLoadout('sage', 'Sage'), name: 'A', techniques: [pick('Mage', 'Technique')[0], null, null, null] }
  const b = { ...createLoadout('knight', 'Vindicator'), name: 'B' }
  const parsed = parseStored(serializeStored([a, b]), lookup)
  assert.deepEqual(parsed, [a, b])
  assert.deepEqual(parseStored('not json', lookup), [])
  assert.deepEqual(parseStored('{"loadouts":{}}', lookup), [])
  assert.deepEqual(parseStored(null, lookup), [])
  const dupes = parseStored(serializeStored([a, a, { pathId: 'x' }]), lookup)
  assert.equal(dupes.length, 2)
  assert.notEqual(dupes[0].id, dupes[1].id)
  assert.equal(a.techniques.length, SLOT_COUNT)
})
