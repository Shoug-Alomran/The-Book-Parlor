import { BookOpen, CheckCircle2, HeartCrack, ListPlus, Save, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { bookService } from "../services/bookService";
import type { ReadingStatus, UserBook } from "../types";
import { ProgressBar } from "./ProgressBar";

const statuses: Array<{ value: ReadingStatus; label: string; icon: typeof BookOpen }> = [
  { value: "Want to Read", label: "Want to Read", icon: ListPlus },
  { value: "Currently Reading", label: "Currently Reading", icon: BookOpen },
  { value: "Read", label: "Read", icon: CheckCircle2 },
  { value: "DNF", label: "Did Not Finish", icon: HeartCrack },
];

type Props = {
  userBook: UserBook;
  compact?: boolean;
  onChange?: (book: UserBook) => void;
};

export function ReadingStatusControls({ userBook, compact = false, onChange }: Props) {
  const totalPages = userBook.book.pageCount ?? 0;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"pages" | "percent">("pages");
  const [progressValue, setProgressValue] = useState("");
  const progressPercent = useMemo(() => {
    if (!totalPages) return 0;
    return Math.min(100, Math.round((userBook.currentPage / totalPages) * 100));
  }, [totalPages, userBook.currentPage]);

  const updateStatus = async (readingStatus: ReadingStatus) => {
    const updates: Parameters<typeof bookService.updateUserBook>[1] = { readingStatus };
    if (readingStatus === "Currently Reading" && !userBook.startDate) updates.startDate = new Date().toISOString().slice(0, 10);
    if (readingStatus === "Read") {
      updates.finishDate = new Date().toISOString().slice(0, 10);
      if (totalPages) updates.currentPage = totalPages;
    }
    if (readingStatus === "Want to Read") {
      updates.currentPage = 0;
      updates.finishDate = null;
    }
    await saveUpdates(updates, "Reading status updated.");
  };

  const updateProgress = async () => {
    const numeric = Number(progressValue);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setMessage("Enter a valid progress number.");
      return;
    }
    const currentPage = mode === "percent"
      ? totalPages
        ? Math.round((Math.min(100, numeric) / 100) * totalPages)
        : 0
      : Math.round(Math.min(numeric, totalPages || numeric));
    await saveUpdates({ readingStatus: "Currently Reading", currentPage, startDate: userBook.startDate ?? new Date().toISOString().slice(0, 10), finishDate: null }, "Progress updated.");
    setProgressValue("");
  };

  const saveUpdates = async (updates: Parameters<typeof bookService.updateUserBook>[1], success: string) => {
    try {
      setSaving(true);
      const next = await bookService.updateUserBook(userBook.id, updates);
      onChange?.(next);
      setMessage(success);
    } catch {
      setMessage("We could not update this book just now.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(""), 2600);
    }
  };

  return (
    <section className={compact ? "rounded-2xl bg-white/55 p-4 dark:bg-white/10" : "cozy-card"}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-2xl font-bold">Reading status</h3>
          <p className="text-sm font-semibold text-mocha/70 dark:text-cream/65">Move this book through your real reading life.</p>
        </div>
        {message && <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-bold text-espresso dark:text-cream">{message}</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {statuses.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" disabled={saving} onClick={() => updateStatus(value)} className={userBook.readingStatus === value ? "btn-primary justify-center px-3" : "btn-soft justify-center px-3"}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => saveUpdates({ ownershipStatus: "Purchased / Physically Owned" }, "Marked as purchased.")}
        className={userBook.ownershipStatus === "Purchased / Physically Owned" ? "btn-primary mt-2 justify-center px-3" : "btn-soft mt-2 justify-center px-3"}
      >
        <ShoppingBag size={17} />
        <span>Purchased</span>
      </button>

      {userBook.readingStatus === "Currently Reading" && (
        <div className="mt-5 rounded-2xl bg-cream/70 p-4 dark:bg-espresso/40">
          <ProgressBar value={progressPercent} label={totalPages ? `${userBook.currentPage} of ${totalPages} pages completed` : `${userBook.currentPage} pages completed`} />
          <div className="mt-4 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
            <select value={mode} onChange={(event) => setMode(event.target.value as "pages" | "percent")} className="rounded-2xl border-0 bg-white/80 p-3 font-bold outline-none dark:bg-white/10">
              <option value="pages">Pages read</option>
              <option value="percent">% complete</option>
            </select>
            <input type="number" min="0" max={mode === "percent" ? 100 : undefined} value={progressValue} onChange={(event) => setProgressValue(event.target.value)} placeholder={mode === "percent" ? "Example: 42" : "Example: 128"} className="min-w-0 rounded-2xl border-0 bg-white/80 p-3 font-bold outline-none dark:bg-white/10" />
            <button type="button" disabled={saving} onClick={updateProgress} className="btn-primary px-4"><Save size={17} />Update progress</button>
          </div>
        </div>
      )}
    </section>
  );
}
