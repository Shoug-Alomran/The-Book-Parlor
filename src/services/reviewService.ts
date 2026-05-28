import { demoReviews } from "../data/demoData";

export const reviewService = {
  async listForBook(bookId: string) {
    return demoReviews.filter((review) => review.bookId === bookId);
  },
};
