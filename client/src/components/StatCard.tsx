import { useEffect, useRef } from 'react'

export function StatCard({
  label, value, sub, valueClass,
}: {
  label: string
  value: number | string
  sub?: string
  valueClass?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const last = useRef(value)

  useEffect(() => {
    if (last.current !== value && ref.current) {
      ref.current.classList.remove('flash')
      void ref.current.offsetWidth
      ref.current.classList.add('flash')
    }
    last.current = value
  }, [value])

  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div ref={ref} className={`card-value ${valueClass ?? ''}`}>{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  )
}
