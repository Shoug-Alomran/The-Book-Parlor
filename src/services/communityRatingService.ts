import { supabase } from "../lib/supabase";
import { isUuid } from "../lib/ids";

export type InternalRatingBreakdown = {
  type: "internal";
  sourceLabel: "Book Parlor community";
  totalRatings: number;
  overallAverage: number;
  detailedAverages: Array<{ label: string; average: number; count: number }>;
};

export type ExternalRatingFallback = {
  type: "external";
  sourceLabel: "Imported from Google Books";
  averageRating: number;
  ratingsCount: number;
};

export type NoRatingBreakdown = {
  type: "none";
  sourceLabel: "No ratings yet";
};

export type CommunityRatingBreakdown = InternalRatingBreakdown | ExternalRatingFallback | NoRatingBreakdown;

export const communityRatingService = {
  async getCommunityRatingBreakdown(bookId: string): Promise<CommunityRatingBreakdown> {
    if (!supabase) return { type: "none", sourceLabel: "No ratings yet" };
    if (!isUuid(bookId)) return { type: "none", sourceLabel: "No ratings yet" };

    const { data: completedUserBooks, error: statusError } = await supabase
      .from("user_books")
      .select("user_id")
      .eq("book_id", bookId)
      .in("reading_status", ["Read", "DNF", "read", "dnf"]);
    if (statusError) throw statusError;

    const eligibleUserIds = Array.from(new Set((completedUserBooks ?? []).map((row: any) => row.user_id)));
    if (eligibleUserIds.length) {
      const { data: ratings, error: ratingsError } = await supabase
        .from("ratings")
        .select("overall, rating_data")
        .eq("book_id", bookId)
        .in("user_id", eligibleUserIds);
      if (ratingsError) throw ratingsError;
      if (ratings?.length) return buildInternalBreakdown(ratings);
    }

    return this.getExternalRatingFallback(bookId);
  },

  async getExternalRatingFallback(bookId: string): Promise<CommunityRatingBreakdown> {
    if (!supabase) return { type: "none", sourceLabel: "No ratings yet" };
    const { data, error } = await supabase
      .from("books")
      .select("external_average_rating, external_ratings_count, external_rating_source")
      .eq("id", bookId)
      .maybeSingle();
    if (error) throw error;

    const externalAverage = Number(data?.external_average_rating);
    if (data?.external_rating_source === "google_books" && Number.isFinite(externalAverage)) {
      return {
        type: "external",
        sourceLabel: "Imported from Google Books",
        averageRating: round1(externalAverage),
        ratingsCount: data.external_ratings_count ?? 0,
      };
    }

    return { type: "none", sourceLabel: "No ratings yet" };
  },
};

function buildInternalBreakdown(ratings: Array<{ overall: number; rating_data: Record<string, number> | null }>): InternalRatingBreakdown {
  const totals = new Map<string, { sum: number; count: number }>();
  ratings.forEach((rating) => {
    Object.entries(rating.rating_data ?? {}).forEach(([label, value]) => {
      if (typeof value !== "number") return;
      const current = totals.get(label) ?? { sum: 0, count: 0 };
      totals.set(label, { sum: current.sum + value, count: current.count + 1 });
    });
  });

  return {
    type: "internal",
    sourceLabel: "Book Parlor community",
    totalRatings: ratings.length,
    overallAverage: round1(ratings.reduce((sum, rating) => sum + Number(rating.overall ?? 0), 0) / ratings.length),
    detailedAverages: Array.from(totals.entries())
      .map(([label, value]) => ({ label, average: round1(value.sum / value.count), count: value.count }))
      .sort((a, b) => (a.label === "Overall" ? -1 : b.label === "Overall" ? 1 : a.label.localeCompare(b.label))),
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;
