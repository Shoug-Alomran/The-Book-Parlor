import type { Comment } from "../types";

export function CommentsSection({ comments }: { comments: Comment[] }) {
  return (
    <section className="cozy-card">
      <h2 className="mb-4 font-serif text-3xl font-bold">Comments</h2>
      <div className="grid gap-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl bg-white/55 p-4 text-sm dark:bg-white/10">
            <p className="font-bold">{comment.userName}</p>
            <p className="mt-2 leading-6 text-espresso/75 dark:text-cream/75">{comment.hasSpoilers ? "Spoiler hidden." : comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
