type Props = {
  items: string[];
  tone?: "trope" | "mood" | "warning";
};

export function TropeChips({ items, tone = "trope" }: Props) {
  if (!items.length) return null;
  const colors = {
    trope: "bg-sage/20 text-espresso dark:text-cream",
    mood: "bg-rose/20 text-espresso dark:text-cream",
    warning: "bg-gold/20 text-espresso dark:text-cream",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`chip ${colors[tone]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}
