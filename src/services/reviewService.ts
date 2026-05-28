import { supabase } from "../lib/supabase";
import type { Review } from "../types";

export const reviewService = {
  async listForBook(bookId: string): Promise<Review[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("reviews")
      .select("id, book_id, title, body, has_spoilers, is_public, user_id")
      .eq("book_id", bookId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) return [];

    return (data ?? []).map((row: any) => ({
      id: row.id,
      bookId: row.book_id,
      userName: "Book Parlor reader",
      title: row.title ?? "Untitled review",
      body: row.body ?? "",
      hasSpoilers: row.has_spoilers,
      isPublic: row.is_public,
      likes: 0,
    }));
  },
};
