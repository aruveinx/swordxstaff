import { useEffect, useRef, useState } from 'react'
import { getSkill, skillIcon, type Skill } from '../data/skills'
import SkillLevelSlider from './SkillLevelSlider'
import ElementDescription from './ElementDescription'
import SkillAreaPreview from './SkillAreaPreview'

interface Props {
  skill: Skill | null
  onClose: () => void
  onSelect: (skill: Skill) => void
}

export default function SkillDialog({ skill, onClose, onSelect }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (skill && !d.open) d.showModal()
    if (!skill && d.open) d.close()
  }, [skill])

  const maxLevel = Math.max(0, ...(skill?.scaling?.map((s) => s.values.length) ?? [0]))
  const lv = Math.min(level, maxLevel || 1)
  const summons = (skill?.summon_skills ?? []).map(getSkill).filter((s): s is Skill => !!s)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,34rem)] max-h-[85vh] rounded-xl border border-zinc-300 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {skill && (
        <div className="p-5">
          <div className="flex items-start gap-4">
            <SkillIcon skill={skill} size="size-16" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{skill.name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {skill.class} · {skill.type}
              </p>
              {skill.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {skill.tags.map((t) => (
                    <span key={t} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded px-2 text-2xl leading-none text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
              ×
            </button>
          </div>

          <p className="mt-4 whitespace-pre-line">
            <ElementDescription text={skill.description} keywords={skill.keywords} />
          </p>

          <section aria-label="Skill combat stats" className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4">
            <SkillAreaPreview skill={skill} />
            <dl className="min-w-0 space-y-2 text-sm">
              {skill.cooldown != null && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-zinc-600 dark:text-zinc-400">Cooldown</dt>
                  <dd className="font-medium">{skill.cooldown}</dd>
                </div>
              )}
              {skill.scaling?.map((s) => (
                <div key={s.stat} className="flex flex-wrap gap-x-2">
                  <dt className="text-zinc-600 dark:text-zinc-400">
                    {s.stat === 'Healing Power' ? 'Heal power'
                      : s.stat === 'ATK' && !/\bATK\b/i.test(skill.description) ? 'DMG' : s.stat}
                  </dt>
                  <dd className="font-medium" aria-live="polite">
                    {s.values[Math.min(lv, s.values.length) - 1]}{s.percent && '%'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {skill.scaling && maxLevel > 0 && (
            <section className="mt-4">
              <SkillLevelSlider level={lv} maxLevel={maxLevel} onChange={setLevel} />
            </section>
          )}

          {skill.keywords && skill.keywords.length > 0 && (
            <section className="mt-4 space-y-2">
              {skill.keywords.map((k) => (
                <div key={k.name} className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
                  <div className="font-semibold">{k.name}</div>
                  <div className="text-zinc-600 dark:text-zinc-300"><ElementDescription text={k.description} /></div>
                </div>
              ))}
            </section>
          )}

          {summons.length > 0 && (
            <section className="mt-4">
              <h3 className="text-sm font-semibold">Summon skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {summons.map((s) => (
                  <button key={s.id} onClick={() => onSelect(s)} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <SkillIcon skill={s} size="size-7" />
                    {s.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </dialog>
  )
}

export function SkillIcon({ skill, size }: { skill: Skill; size: string }) {
  const src = skillIcon(skill)
  return src ? (
    <img src={src} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
  ) : (
    <div className={`${size} shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800`} />
  )
}
