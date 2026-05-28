import { defaultBookcases } from "../data/constants";
import { supabase } from "../lib/supabase";
import type { Bookcase, UserBook } from "../types";

export const bookcaseService = {
  async getBookcases(): Promise<Bookcase[]> {
    if (!supabase) return defaultBookcases;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return defaultBookcases;
    const { data, error } = await supabase.from("bookcases").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const caseIds = (data ?? []).map((row: any) => row.id);
    const { data: links } = caseIds.length
      ? await supabase.from("bookcase_books").select("bookcase_id, book_id").eq("user_id", userData.user.id).in("bookcase_id", caseIds)
      : { data: [] };
    const bookIdsByCase = new Map<string, string[]>();
    (links ?? []).forEach((link: any) => {
      bookIdsByCase.set(link.bookcase_id, [...(bookIdsByCase.get(link.bookcase_id) ?? []), link.book_id]);
    });
    return [...defaultBookcases, ...(data ?? []).map((row: any) => mapBookcaseRow(row, bookIdsByCase.get(row.id) ?? []))];
  },
  async createBookcase(input: {
    name: string;
    theme: Bookcase["theme"];
    shelfColor: string;
    background: string;
    decor: string[];
    visibility: Bookcase["visibility"];
    filterTrope?: string;
  }) {
    if (!supabase) {
      return {
        id: crypto.randomUUID(),
        type: "custom",
        ...input,
      } satisfies Bookcase;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before creating a bookcase.");
    const { data, error } = await supabase
      .from("bookcases")
      .insert({
        user_id: userData.user.id,
        name: input.name,
        type: input.filterTrope ? "trope" : "custom",
        theme: input.theme,
        shelf_color: input.shelfColor,
        background: input.background,
        decor: input.decor,
        visibility: input.visibility,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapBookcaseRow(data);
  },
  async deleteBookcase(bookcaseId: string) {
    if (!supabase) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before deleting a bookcase.");
    const { error } = await supabase.from("bookcases").delete().eq("id", bookcaseId).eq("user_id", userData.user.id);
    if (error) throw error;
  },
  async addBookToBookcase(bookcaseId: string, bookId: string) {
    if (!supabase) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before adding books.");
    const { error } = await supabase.from("bookcase_books").upsert(
      {
        bookcase_id: bookcaseId,
        user_id: userData.user.id,
        book_id: bookId,
      },
      { onConflict: "bookcase_id,book_id" },
    );
    if (error) throw error;
  },
  async removeBookFromBookcase(bookcaseId: string, bookId: string) {
    if (!supabase) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before removing books.");
    const { error } = await supabase
      .from("bookcase_books")
      .delete()
      .eq("bookcase_id", bookcaseId)
      .eq("book_id", bookId)
      .eq("user_id", userData.user.id);
    if (error) throw error;
  },
  booksForCase(bookcase: Bookcase, books: UserBook[]) {
    if (bookcase.type === "read") return books.filter((item) => item.readingStatus === "Read");
    if (bookcase.type === "purchased") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned");
    if (bookcase.type === "tbr") return books.filter((item) => item.readingStatus === "Want to Read");
    if (bookcase.type === "favorites") return books.filter((item) => item.isFavorite);
    if (bookcase.type === "owned-unread") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned" && item.readingStatus !== "Read");
    if (bookcase.filterTrope) return books.filter((item) => item.book.tropes.includes(bookcase.filterTrope!));
    if (bookcase.type === "custom") return books.filter((item) => (bookcase.bookIds ?? []).includes(item.book.id));
    return [];
  },
};

function mapBookcaseRow(row: any, bookIds: string[] = []): Bookcase {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? "custom",
    theme: row.theme ?? "cafe",
    shelfColor: row.shelf_color ?? "#7B5138",
    background: row.background ?? "warm plaster",
    decor: Array.isArray(row.decor) ? row.decor : [],
    visibility: row.visibility ?? "private",
    bookIds,
  };
}
