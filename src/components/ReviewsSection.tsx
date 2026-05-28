import type { Review } from "../types";
import { Heart } from "lucide-react";

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="cozy-card">
      <h2 className="mb-4 font-serif text-3xl font-bold">Reviews</h2>
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
      </div>
    </section>
  );
}
