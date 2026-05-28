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
    return [...defaultBookcases, ...(data ?? []).map(mapBookcaseRow)];
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
  booksForCase(bookcase: Bookcase, books: UserBook[]) {
    if (bookcase.type === "read") return books.filter((item) => item.readingStatus === "Read");
    if (bookcase.type === "purchased") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned");
    if (bookcase.type === "tbr") return books.filter((item) => item.readingStatus === "Want to Read");
    if (bookcase.type === "favorites") return books.filter((item) => item.isFavorite);
    if (bookcase.type === "owned-unread") return books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned" && item.readingStatus !== "Read");
    if (bookcase.filterTrope) return books.filter((item) => item.book.tropes.includes(bookcase.filterTrope!));
    return books;
  },
};

function mapBookcaseRow(row: any): Bookcase {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? "custom",
    theme: row.theme ?? "cafe",
    shelfColor: row.shelf_color ?? "#7B5138",
    background: row.background ?? "warm plaster",
    decor: Array.isArray(row.decor) ? row.decor : [],
    visibility: row.visibility ?? "private",
  };
}
