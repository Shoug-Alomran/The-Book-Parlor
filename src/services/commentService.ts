import { demoComments } from "../data/demoData";

export const commentService = {
  async listForBook(bookId: string) {
    return demoComments.filter((comment) => comment.bookId === bookId);
  },
};
