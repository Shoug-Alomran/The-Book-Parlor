import { Palette } from "lucide-react";

const colors = ["pink", "blue", "yellow", "purple", "green", "orange"];

export function QuoteManager() {
  return (
    <section className="cozy-card">
      <h2 className="font-serif text-3xl font-bold">Quotes and annotations</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {colors.map((color) => <span key={color} className="chip"><Palette size={13} />{color}</span>)}
      </div>
      <div className="mt-4 rounded-2xl bg-white/55 p-4 text-sm font-semibold text-espresso/70 dark:bg-white/10 dark:text-cream/70">
        Quote card generator is ready for aesthetic share cards once quote exports are connected.
      </div>
    </section>
  );
}
