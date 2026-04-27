export function Pill({ value }: { value: string }) {
  return <span className={`pill ${value}`}>{value.replace(/_/g, ' ')}</span>
}
