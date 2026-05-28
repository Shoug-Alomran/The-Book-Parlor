import { Pencil, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { bookService } from "../services/bookService";
import { goalService, type ReadingGoal } from "../services/goalService";
import { statsService } from "../services/statsService";
import type { UserBook } from "../types";

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

const goalLabels = [
  { key: "yearly_books", label: "Yearly book goal", cadence: "Set once for this year" },
  { key: `monthly_books:${currentMonthKey}`, label: "Monthly goal", cadence: "Set for this month" },
  { key: "pages", label: "Page goal", cadence: "Set once for this year" },
  { key: "owned_books", label: "Owned-books goal", cadence: "Set once for this year" },
  { key: "series_completion", label: "Series completion goal", cadence: "Set once for this year" },
];

export function GoalsPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [editingGoals, setEditingGoals] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const stats = useMemo(() => statsService.summarize(books), [books]);

  const load = async () => {
    const [nextBooks, nextGoals] = await Promise.all([bookService.getUserBooks(), goalService.listGoals()]);
    setBooks(nextBooks);
    setGoals(nextGoals);
    setDrafts(Object.fromEntries(nextGoals.map((goal) => [goal.goalType, goal.targetNumber])));
    setEditingGoals((current) => {
      const next = { ...current };
      goalLabels.forEach((goal) => {
        if (!nextGoals.some((item) => item.goalType === goal.key)) next[goal.key] = true;
      });
      return next;
    });
  };

  useEffect(() => { load(); }, []);

  const currentForGoal = (goalType: string) => {
    if (goalType === "yearly_books") return stats.readCount;
    if (goalType.startsWith("monthly_books:")) return booksReadThisMonth(books);
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
      setEditingGoals((current) => ({ ...current, [goalType]: false }));
      await load();
    } catch {
      setMessage("We could not save that goal just now.");
    }
    window.setTimeout(() => setMessage(""), 2600);
  };

  return (
    <div>
      <PageHeader eyebrow="Reading goals" title="A shelf that fills as you read." description="Set your yearly goals once, then let your library update the progress for you. Monthly goals refresh with each new month." />
      {message && <div className="fixed right-5 top-5 z-50 rounded-2xl bg-espresso px-5 py-3 text-sm font-bold text-cream shadow-glow dark:bg-gold dark:text-espresso">{message}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {goalLabels.map(({ key: goalType, label, cadence }) => {
          const goal = goals.find((item) => item.goalType === goalType);
          const current = currentForGoal(goalType);
          const target = goal?.targetNumber ?? drafts[goalType] ?? 0;
          const isEditing = editingGoals[goalType] ?? !goal;
          return (
            <article key={goalType} className="cozy-card">
              <div className="mb-1 flex justify-between gap-4 font-bold"><span>{label}</span><span>{current}/{target || "set target"}</span></div>
              <p className="mb-4 text-sm font-semibold text-mocha/70 dark:text-cream/65">{goal ? cadence : "Choose a target to start tracking."}</p>
              <ProgressBar value={target ? (current / target) * 100 : 0} />
              {isEditing ? (
                <div className="mt-4 flex gap-2">
                  <input type="number" min="1" value={drafts[goalType] ?? ""} onChange={(event) => setDrafts((currentDrafts) => ({ ...currentDrafts, [goalType]: Number(event.target.value) }))} placeholder="Target" className="min-w-0 flex-1 rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
                  <button type="button" onClick={() => saveGoal(goalType)} className="btn-primary px-4"><Save size={18} />Save</button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditingGoals((currentGoals) => ({ ...currentGoals, [goalType]: true }))} className="btn-soft mt-4 px-4"><Pencil size={17} />Edit target</button>
              )}
            </article>
          );
        })}
      </div>
      <section className="cozy-card mt-5">
        <h2 className="font-serif text-3xl font-bold">Goal bookcase</h2>
        <div className="mt-5 flex gap-1 overflow-hidden rounded-2xl bg-mocha/20 p-4 dark:bg-white/10">
          {Array.from({ length: yearlyBookcaseTarget(goals) }).map((_, index) => <div key={index} className={`h-32 flex-1 rounded-t ${index < Math.min(yearlyBookcaseTarget(goals), stats.readCount) ? "bg-gradient-to-t from-mocha to-gold" : "bg-white/35 dark:bg-white/10"}`} />)}
        </div>
      </section>
    </div>
  );
}

function booksReadThisMonth(books: UserBook[]) {
  return books.filter((item) => {
    if (item.readingStatus !== "Read" || !item.finishDate) return false;
    const date = new Date(item.finishDate);
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;
}

function yearlyBookcaseTarget(goals: ReadingGoal[]) {
  return Math.max(1, Math.min(80, goals.find((goal) => goal.goalType === "yearly_books")?.targetNumber ?? 28));
}
