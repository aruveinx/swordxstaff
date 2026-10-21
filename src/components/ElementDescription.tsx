import type { Keyword } from '../data/skills'

const ELEMENT_COLORS = new Map([
  ['light', 'text-yellow-600'],
  ['dark', 'text-purple-900'],
  ['wind', 'text-[#169b78]'],
  ['water', 'text-[#4778bb]'],
  ['fire', 'text-orange-600'],
  ['physical', 'text-[#8a7160]'],
])

const ELEMENT_NAMES = [...ELEMENT_COLORS.keys()]

export default function ElementDescription({ text, keywords = [] }: { text: string; keywords?: Keyword[] }) {
  const annotations: Array<{ name: string; description?: string; color?: string }> = [
    ...keywords.map(({ name, description }) => ({ name, description })),
    ...ELEMENT_NAMES
      .filter((name) => !keywords.some((keyword) => keyword.name.toLowerCase() === name))
      .map((name) => ({ name, color: ELEMENT_COLORS.get(name) })),
  ].sort((a, b) => b.name.length - a.name.length)
  const annotationByName = new Map(annotations.map((annotation) => [annotation.name.toLowerCase(), annotation]))
  const expression = new RegExp(
    annotations.map(({ name }) => {
      const prefix = /^[\p{L}\p{N}_]/u.test(name) ? String.raw`(?<![\p{L}\p{N}_])` : ''
      const suffix = /[\p{L}\p{N}_]$/u.test(name) ? String.raw`(?![\p{L}\p{N}_])` : ''
      return `${prefix}${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${suffix}`
    }).join('|'),
    'giu',
  )

  const parts = []
  let lastIndex = 0
  for (const match of text.matchAll(expression)) {
    const index = match.index!
    if (index > lastIndex) parts.push(text.slice(lastIndex, index))

    const annotation = annotationByName.get(match[0].toLowerCase())
    if (annotation?.color) {
      parts.push(<strong key={index} className={`font-bold ${annotation.color}`}>{match[0]}</strong>)
    } else if (annotation) {
      parts.push(
        <span key={index} className="underline decoration-dotted underline-offset-2" title={annotation.description}>
          {match[0]}
        </span>,
      )
    }
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
