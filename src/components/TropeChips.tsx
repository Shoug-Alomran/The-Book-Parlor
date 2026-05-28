type Props = {
  items: string[];
  tone?: "trope" | "mood" | "warning";
  activeItem?: string;
  onSelect?: (item: string) => void;
};

export function TropeChips({ items, tone = "trope", activeItem, onSelect }: Props) {
  if (!items.length) return null;
  const colors = {
    trope: "bg-sage/20 text-espresso dark:text-cream",
    mood: "bg-rose/20 text-espresso dark:text-cream",
    warning: "bg-gold/20 text-espresso dark:text-cream",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = activeItem?.toLowerCase() === item.toLowerCase();
        const className = `chip ${colors[tone]} ${onSelect ? "cursor-pointer transition hover:-translate-y-0.5 hover:bg-gold/25 focus:outline-none focus:ring-2 focus:ring-gold/60" : ""} ${active ? "bg-gold/30 ring-2 ring-gold/50" : ""}`;
        if (onSelect) {
          return (
            <button key={item} type="button" onClick={() => onSelect(item)} className={className} aria-pressed={active}>
              {item}
            </button>
          );
        }
        return (
          <span key={item} className={className}>
            {item}
          </span>
        );
      })}
    </div>
  );
}
