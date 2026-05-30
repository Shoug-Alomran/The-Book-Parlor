import type { UserBook } from "../types";
import { supabase } from "../lib/supabase";

export type RatingStats = {
  averageRating: number | null;
  count: number;
};

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
      longestBook: read.length ? Math.max(...read.map((item) => item.book.pageCount ?? item.currentPage ?? 0)) : 0,
      topFormat: mode(books.map((item) => item.format).filter(Boolean)) ?? "Not enough data yet",
      dnfReason: mode(books.map((item) => item.dnfReason ?? "").filter(Boolean)) ?? "Not enough data yet",
      streak: 0,
      favoriteGenre: mode(genres) ?? "Not enough data yet",
      mostReadAuthor: mode(authors) ?? "Not enough data yet",
      mostCommonTrope: mode(tropes) ?? "Not enough data yet",
      moodOfMonth: mode(books.flatMap((item) => item.book.moods)) ?? "Not enough data yet",
    };
  },

  async getRatingStats(): Promise<RatingStats> {
    if (!supabase) return { averageRating: null, count: 0 };
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { averageRating: null, count: 0 };
    const { data, error } = await supabase.from("ratings").select("overall").eq("user_id", userData.user.id);
    if (error || !data?.length) return { averageRating: null, count: 0 };
    const values = data.map((row: any) => Number(row.overall)).filter(Number.isFinite);
    if (!values.length) return { averageRating: null, count: 0 };
    return {
      averageRating: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10,
      count: values.length,
    };
  },

  booksReadByMonth(books: UserBook[], year = new Date().getFullYear()) {
    return Array.from({ length: 12 }, (_, month) => books.filter((item) => {
      if (item.readingStatus !== "Read" || !item.finishDate) return false;
      const date = new Date(item.finishDate);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length);
  },
};

const mode = (values: string[]) => {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
};
