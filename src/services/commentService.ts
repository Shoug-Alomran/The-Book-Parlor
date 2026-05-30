import { supabase } from "../lib/supabase";
import type { Comment } from "../types";

export const commentService = {
  async listForBook(bookId: string): Promise<Comment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("comments")
      .select("id, book_id, body, has_spoilers, user_id, profiles(display_name, username)")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });
    if (error) return [];

    return (data ?? []).map((row: any) => ({
      id: row.id,
      bookId: row.book_id,
      userName: row.profiles?.display_name ?? row.profiles?.username ?? "Book Parlor reader",
      body: row.body,
      hasSpoilers: row.has_spoilers,
    }));
  },
  async createComment(input: { bookId: string; body: string; hasSpoilers: boolean }) {
    if (!supabase) throw new Error("auth_required");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("auth_required");
    const { error } = await supabase.from("comments").insert({
      user_id: userData.user.id,
      book_id: input.bookId,
      body: input.body,
      has_spoilers: input.hasSpoilers,
    });
    if (error) throw error;
  },
};
