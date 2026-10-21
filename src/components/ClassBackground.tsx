import type { PathId } from '../data/classes'

const artwork = import.meta.glob<string>('../assets/img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

interface Props {
  pathId: PathId
  classId: string
  variant?: 'page' | 'card'
}

export default function ClassBackground({ pathId, classId, variant = 'page' }: Props) {
  const name = classId === 'Warrior' ? 'warrior' : classId === 'Mage' ? 'mage' : pathId

  return (
    <div className={variant === 'card' ? 'loadout-background' : 'class-background'} aria-hidden="true">
      <img className="class-background-male" src={artwork[`../assets/img/${name}_m.webp`]} alt="" draggable={false} />
      <img className="class-background-female" src={artwork[`../assets/img/${name}_f.webp`]} alt="" draggable={false} />
    </div>
  )
}
