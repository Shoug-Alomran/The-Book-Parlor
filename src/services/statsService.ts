import type { UserBook } from "../types";

export const statsService = {
  summarize(books: UserBook[]) {
    const read = books.filter((item) => item.readingStatus === "Read");
    const purchased = books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned");
    const ownedUnread = purchased.filter((item) => item.readingStatus !== "Read");
    const authors = books.flatMap((item) => item.book.authors);
    const tropes = books.flatMap((item) => item.book.tropes);
    const genres = books.flatMap((item) => item.book.categories);
    return {
      readCount: read.length,
      tbrCount: books.filter((item) => item.readingStatus === "Want to Read").length,
      purchasedCount: purchased.length,
      ownedUnreadCount: ownedUnread.length,
      pagesRead: read.reduce((sum, item) => sum + (item.book.pageCount ?? item.currentPage), 0),
      streak: 8,
      favoriteGenre: mode(genres) ?? "Fantasy",
      mostReadAuthor: mode(authors) ?? "Heather Fawcett",
      mostCommonTrope: mode(tropes) ?? "slow burn",
      moodOfMonth: mode(books.flatMap((item) => item.book.moods)) ?? "cozy",
      yearlyGoal: 52,
    };
  },
};

const mode = (values: string[]) => {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
};
