import { useId } from 'react'

const RANKS = [
  { name: 'Rare', start: 1, end: 2, color: '#64748b', accents: ['#b8c7d6', '#b8c7d6'] },
  { name: 'Epic', start: 3, end: 5, color: '#80649e', accents: ['#a084bd', '#a084bd'] },
  { name: 'Legendary', start: 6, end: 9, color: '#c45b08', accents: ['#f28c28', '#f28c28'] },
  { name: 'Mythic', start: 10, end: 15, color: '#946800', accents: ['#facc15', '#facc15'] },
  { name: 'Divine', start: 16, end: 23, color: '#dc2626', accents: ['#ef4444', '#ef4444'] },
  { name: 'Immortal', start: 24, end: Infinity, color: '#79628f', accents: ['#c4c8d4', '#b7acd9', '#a9c7d5', '#d8bed5', '#b39bce', '#d1d3df'] },
]

interface Props {
  level: number
  maxLevel: number
  onChange: (level: number) => void
}

export default function SkillLevelSlider({ level, maxLevel, onChange }: Props) {
  const id = useId()
  const ranks = RANKS.filter((rank) => rank.start <= maxLevel).map((rank) => ({
    ...rank,
    end: Math.min(rank.end, maxLevel),
  }))
  const current = ranks.find((rank) => level <= rank.end)!
  const stars = level - current.start
  const totalStars = current.end - current.start
  const valueText = `${current.name}, ${stars} of ${totalStars} stars, level ${level} of ${maxLevel}`
  const track = ranks.map((rank) => {
    const start = maxLevel === 1 ? 0 : Math.max(0, (rank.start - 1.5) / (maxLevel - 1) * 100)
    const end = maxLevel === 1 ? 100 : Math.min(100, (rank.end - 0.5) / (maxLevel - 1) * 100)
    return rank.accents.map((color, index) =>
      `${color} ${start + (end - start) * index / (rank.accents.length - 1)}%`,
    ).join(', ')
  }).join(', ')

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center justify-between gap-2 text-sm">
        <label htmlFor={id} className="font-medium">Skill level</label>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">Level {level} / {maxLevel}</span>
      </div>
      <div className="mt-2 dark:brightness-150" style={{ color: current.color }} aria-live="polite">
        <div className="text-lg font-semibold">{current.name}</div>
        <div aria-label={`${stars} of ${totalStars} stars`} className="flex flex-wrap items-center gap-x-2">
          <span aria-hidden="true" className="text-lg tracking-wide">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${current.accents.join(', ')})` }}
            >{'★'.repeat(stars)}</span><span className="text-zinc-300 dark:text-zinc-500">{'☆'.repeat(totalStars - stars)}</span>
          </span>
          <span className="text-xs font-medium">{stars} / {totalStars} stars</span>
        </div>
      </div>
      <div className="py-3">
        <input
          id={id}
          type="range"
          min={1}
          max={maxLevel}
          step={1}
          value={level}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={valueText}
          className="skill-level-slider block w-full"
          style={{ background: `linear-gradient(to right, ${track})`, color: current.color }}
        />
      </div>
      <div role="group" aria-label="Skill ranks" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ranks.map((rank) => (
          <button
            key={rank.name}
            type="button"
            onClick={() => onChange(rank.start)}
            aria-label={`${rank.name}, levels ${rank.start} to ${rank.end}`}
            aria-pressed={rank.name === current.name}
            className={`relative min-w-0 rounded-md px-1 pb-2 pt-3 text-center text-xs outline-offset-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
              rank.name === current.name ? 'bg-white font-semibold ring-1 ring-zinc-300 dark:bg-zinc-900 dark:ring-zinc-600' : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 rounded-t-md"
              style={{ background: `linear-gradient(to right, ${rank.accents.join(', ')})` }}
            />
            <span className="block">{rank.name}</span>
            <span className="mt-0.5 block tabular-nums text-zinc-500 dark:text-zinc-400">{rank.start}–{rank.end}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Select a rank or drag to choose a star.</p>
    </div>
  )
}
