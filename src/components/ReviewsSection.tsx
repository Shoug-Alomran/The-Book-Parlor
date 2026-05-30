import type { Review } from "../types";
import { Heart } from "lucide-react";
import { useState } from "react";

export function ReviewsSection({ reviews, onCreate }: { reviews: Review[]; onCreate?: (input: { title: string; body: string; hasSpoilers: boolean }) => Promise<void> }) {
  const [draft, setDraft] = useState({ title: "", body: "", hasSpoilers: false });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!draft.body.trim() || !onCreate) return;
    setSaving(true);
    try {
      await onCreate(draft);
      setDraft({ title: "", body: "", hasSpoilers: false });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="cozy-card">
      <h2 className="mb-4 font-serif text-3xl font-bold">Reviews</h2>
      {onCreate && (
        <div className="mb-4 grid gap-3 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
          <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Review title" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
          <textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write your review" className="min-h-24 rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.hasSpoilers} onChange={(event) => setDraft((current) => ({ ...current, hasSpoilers: event.target.checked }))} />Contains spoilers</label>
            <button type="button" disabled={saving || !draft.body.trim()} onClick={submit} className="btn-primary disabled:opacity-60">{saving ? "Posting..." : "Post review"}</button>
          </div>
        </div>
      )}
      <div className="grid gap-3">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl bg-white/55 p-4 dark:bg-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{review.title}</p>
                <p className="text-sm text-mocha/70 dark:text-cream/60">by {review.userName}</p>
              </div>
              <span className="chip"><Heart size={13} />{review.likes}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-espresso/75 dark:text-cream/75">{review.hasSpoilers ? "Spoiler hidden. Tap to reveal in the full review view." : review.body}</p>
          </article>
        ))}
        {!reviews.length && <p className="rounded-2xl bg-white/55 p-4 text-sm font-bold text-mocha/70 dark:bg-white/10 dark:text-cream/65">No reviews yet.</p>}
      </div>
    </section>
  );
}
