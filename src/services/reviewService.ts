import { supabase } from "../lib/supabase";
import type { Review } from "../types";

export const reviewService = {
  async listForBook(bookId: string): Promise<Review[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("reviews")
      .select("id, book_id, title, body, has_spoilers, is_public, user_id, profiles(display_name, username)")
      .eq("book_id", bookId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) return [];
    const ids = (data ?? []).map((row: any) => row.id);
    const { data: likes } = ids.length
      ? await supabase.from("likes").select("target_id").eq("target_type", "review").in("target_id", ids)
      : { data: [] };
    const likeCounts = new Map<string, number>();
    (likes ?? []).forEach((like: any) => likeCounts.set(like.target_id, (likeCounts.get(like.target_id) ?? 0) + 1));

    return (data ?? []).map((row: any) => ({
      id: row.id,
      bookId: row.book_id,
      userName: row.profiles?.display_name ?? row.profiles?.username ?? "Book Parlor reader",
      title: row.title ?? "Untitled review",
      body: row.body ?? "",
      hasSpoilers: row.has_spoilers,
      isPublic: row.is_public,
      likes: likeCounts.get(row.id) ?? 0,
    }));
  },
  async createReview(input: { bookId: string; title: string; body: string; hasSpoilers: boolean; isPublic?: boolean }) {
    if (!supabase) throw new Error("auth_required");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("auth_required");
    const { error } = await supabase.from("reviews").insert({
      user_id: userData.user.id,
      book_id: input.bookId,
      title: input.title,
      body: input.body,
      has_spoilers: input.hasSpoilers,
      is_public: input.isPublic ?? true,
    });
    if (error) throw error;
  },
};
