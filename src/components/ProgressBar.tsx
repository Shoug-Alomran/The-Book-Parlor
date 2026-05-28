type Props = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  return (
    <div>
      {label && <div className="mb-2 flex justify-between text-xs font-bold text-espresso/70 dark:text-cream/70"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className="h-3 overflow-hidden rounded-full bg-espresso/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-rose via-cafe to-gold transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
