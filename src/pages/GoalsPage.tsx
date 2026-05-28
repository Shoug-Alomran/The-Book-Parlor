import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";

const goals = [
  ["Yearly book goal", 18, 52],
  ["Monthly goal", 4, 6],
  ["Page goal", 4730, 15000],
  ["Owned-books goal", 11, 24],
  ["Series completion", 2, 8],
];

export function GoalsPage() {
  return (
    <div>
      <PageHeader eyebrow="Reading goals" title="A shelf that fills as you read." description="Create yearly, monthly, page, genre, owned-books, and series completion goals." />
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map(([label, current, target]) => (
          <article key={label as string} className="cozy-card">
            <div className="mb-4 flex justify-between font-bold"><span>{label as string}</span><span>{current as number}/{target as number}</span></div>
            <ProgressBar value={((current as number) / (target as number)) * 100} />
          </article>
        ))}
      </div>
      <section className="cozy-card mt-5">
        <h2 className="font-serif text-3xl font-bold">Goal bookcase</h2>
        <div className="mt-5 flex gap-1 overflow-hidden rounded-2xl bg-mocha/20 p-4 dark:bg-white/10">
          {Array.from({ length: 28 }).map((_, index) => <div key={index} className={`h-32 flex-1 rounded-t ${index < 10 ? "bg-gradient-to-t from-mocha to-gold" : "bg-white/35 dark:bg-white/10"}`} />)}
        </div>
      </section>
    </div>
  );
}
