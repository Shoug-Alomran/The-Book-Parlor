import { supabase } from "../lib/supabase";
import type { Comment } from "../types";

export const commentService = {
  async listForBook(bookId: string): Promise<Comment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("comments")
      .select("id, book_id, body, has_spoilers, user_id")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });
    if (error) return [];

    return (data ?? []).map((row: any) => ({
      id: row.id,
      bookId: row.book_id,
      userName: "Book Parlor reader",
      body: row.body,
      hasSpoilers: row.has_spoilers,
    }));
  },
};
