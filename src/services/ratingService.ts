import { ratingTemplates } from "../data/ratingTemplates";
import type { Rating, RatingGenre } from "../types";

export const ratingService = {
  buildEmptyRating(bookId: string, genre: RatingGenre): Rating {
    const ratingData = Object.fromEntries(ratingTemplates[genre].map((field) => [field, field === "Overall" ? 4 : 0]));
    return { id: crypto.randomUUID(), bookId, ratingGenre: genre, overall: 4, ratingData, wouldReadAgain: true, isPublic: true };
  },
  communityAverage(ratings: Rating[]) {
    if (!ratings.length) return 4.3;
    return ratings.reduce((sum, rating) => sum + rating.overall, 0) / ratings.length;
  },
};
