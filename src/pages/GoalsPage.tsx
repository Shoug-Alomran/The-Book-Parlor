import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { bookService } from "../services/bookService";
import { goalService, type ReadingGoal } from "../services/goalService";
import { statsService } from "../services/statsService";
import type { UserBook } from "../types";

const goalLabels = [
  ["yearly_books", "Yearly book goal"],
  ["monthly_books", "Monthly goal"],
  ["pages", "Page goal"],
  ["owned_books", "Owned-books goal"],
  ["series_completion", "Series completion goal"],
];

export function GoalsPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const stats = useMemo(() => statsService.summarize(books), [books]);

  const load = async () => {
    const [nextBooks, nextGoals] = await Promise.all([bookService.getUserBooks(), goalService.listGoals()]);
    setBooks(nextBooks);
    setGoals(nextGoals);
    setDrafts(Object.fromEntries(nextGoals.map((goal) => [goal.goalType, goal.targetNumber])));
  };

  useEffect(() => { load(); }, []);

  const currentForGoal = (goalType: string) => {
    if (goalType === "yearly_books" || goalType === "monthly_books") return stats.readCount;
    if (goalType === "pages") return stats.pagesRead;
    if (goalType === "owned_books") return stats.purchasedCount;
    return 0;
  };

  const saveGoal = async (goalType: string) => {
    const target = drafts[goalType] ?? 0;
    if (!target) {
      setMessage("Choose a target number first.");
      return;
    }
    try {
      await goalService.saveGoal(goalType, target, currentForGoal(goalType));
      setMessage("Goal saved.");
      await load();
    } catch {
      setMessage("We could not save that goal just now.");
    }
    window.setTimeout(() => setMessage(""), 2600);
  };

  return (
    <div>
      <PageHeader eyebrow="Reading goals" title="A shelf that fills as you read." description="Create yearly, monthly, page, genre, owned-books, and series completion goals." />
      {message && <div className="fixed right-5 top-5 z-50 rounded-2xl bg-espresso px-5 py-3 text-sm font-bold text-cream shadow-glow dark:bg-gold dark:text-espresso">{message}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {goalLabels.map(([goalType, label]) => {
          const goal = goals.find((item) => item.goalType === goalType);
          const current = currentForGoal(goalType);
          const target = goal?.targetNumber ?? drafts[goalType] ?? 0;
          return (
            <article key={goalType} className="cozy-card">
              <div className="mb-4 flex justify-between font-bold"><span>{label}</span><span>{current}/{target || "set target"}</span></div>
              <ProgressBar value={target ? (current / target) * 100 : 0} />
              <div className="mt-4 flex gap-2">
                <input type="number" min="1" value={drafts[goalType] ?? ""} onChange={(event) => setDrafts((currentDrafts) => ({ ...currentDrafts, [goalType]: Number(event.target.value) }))} placeholder="Target" className="min-w-0 flex-1 rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
                <button type="button" onClick={() => saveGoal(goalType)} className="btn-primary px-4"><Save size={18} />Save</button>
              </div>
            </article>
          );
        })}
      </div>
      <section className="cozy-card mt-5">
        <h2 className="font-serif text-3xl font-bold">Goal bookcase</h2>
        <div className="mt-5 flex gap-1 overflow-hidden rounded-2xl bg-mocha/20 p-4 dark:bg-white/10">
          {Array.from({ length: 28 }).map((_, index) => <div key={index} className={`h-32 flex-1 rounded-t ${index < Math.min(28, stats.readCount) ? "bg-gradient-to-t from-mocha to-gold" : "bg-white/35 dark:bg-white/10"}`} />)}
        </div>
      </section>
    </div>
  );
}
