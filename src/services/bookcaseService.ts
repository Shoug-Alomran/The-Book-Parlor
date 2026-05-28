import { defaultBookcases } from "../data/constants";
import type { Bookcase, UserBook } from "../types";

export const bookcaseService = {
  getBookcases: (): Bookcase[] => defaultBookcases,
  booksForCase(bookcase: Bookcase, books: UserBook[]) {
    if (bookcase.type === "read") return books.filter((item) => item.readingStatus === "Read");
    if (bookcase.type === "purchased") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned");
    if (bookcase.type === "tbr") return books.filter((item) => item.readingStatus === "Want to Read");
    if (bookcase.type === "favorites") return books.filter((item) => item.isFavorite);
    if (bookcase.type === "owned-unread") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned" && item.readingStatus !== "Read");
    return books;
  },
};
