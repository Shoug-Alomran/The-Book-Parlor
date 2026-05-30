import type { Comment } from "../types";
import { useState } from "react";

export function CommentsSection({ comments, onCreate }: { comments: Comment[]; onCreate?: (input: { body: string; hasSpoilers: boolean }) => Promise<void> }) {
  const [draft, setDraft] = useState({ body: "", hasSpoilers: false });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!draft.body.trim() || !onCreate) return;
    setSaving(true);
    try {
      await onCreate(draft);
      setDraft({ body: "", hasSpoilers: false });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="cozy-card">
      <h2 className="mb-4 font-serif text-3xl font-bold">Comments</h2>
      {onCreate && (
        <div className="mb-4 grid gap-3 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
          <textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Add a comment" className="min-h-20 rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.hasSpoilers} onChange={(event) => setDraft((current) => ({ ...current, hasSpoilers: event.target.checked }))} />Contains spoilers</label>
            <button type="button" disabled={saving || !draft.body.trim()} onClick={submit} className="btn-primary disabled:opacity-60">{saving ? "Posting..." : "Post comment"}</button>
          </div>
        </div>
      )}
      <div className="grid gap-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl bg-white/55 p-4 text-sm dark:bg-white/10">
            <p className="font-bold">{comment.userName}</p>
            <p className="mt-2 leading-6 text-espresso/75 dark:text-cream/75">{comment.hasSpoilers ? "Spoiler hidden." : comment.body}</p>
          </article>
        ))}
        {!comments.length && <p className="rounded-2xl bg-white/55 p-4 text-sm font-bold text-mocha/70 dark:bg-white/10 dark:text-cream/65">No comments yet.</p>}
      </div>
    </section>
  );
}
