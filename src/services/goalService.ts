import { supabase } from "../lib/supabase";

export type ReadingGoal = {
  id?: string;
  goalType: string;
  targetNumber: number;
  currentNumber: number;
};

export const goalService = {
  async listGoals(year = new Date().getFullYear()): Promise<ReadingGoal[]> {
    if (!supabase) return [];
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("goals")
      .select("id, goal_type, target_number, current_number")
      .eq("user_id", userData.user.id)
      .eq("year", year)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data ?? []).map((row: any) => ({
      id: row.id,
      goalType: row.goal_type,
      targetNumber: row.target_number,
      currentNumber: row.current_number ?? 0,
    }));
  },

  async saveGoal(goalType: string, targetNumber: number, currentNumber: number, year = new Date().getFullYear()) {
    if (!supabase) throw new Error("auth_required");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("auth_required");
    await ensureProfileForUser(userData.user);
    const goalRow = {
      user_id: userData.user.id,
      year,
      goal_type: goalType,
      target_number: targetNumber,
      current_number: currentNumber,
      updated_at: new Date().toISOString(),
    };
    const { data: existingGoal, error: lookupError } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("year", year)
      .eq("goal_type", goalType)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      console.error("Book Parlor goal lookup failed", lookupError);
      throw new Error("goal_save_failed");
    }

    const { error } = existingGoal
      ? await supabase.from("goals").update(goalRow).eq("id", existingGoal.id)
      : await supabase.from("goals").insert(goalRow);
    if (error) {
      console.error("Book Parlor goal save failed", error);
      throw new Error("goal_save_failed");
    }
  },
};

async function ensureProfileForUser(user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) {
  if (!supabase) return;
  const { data: profile, error: lookupError } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (lookupError) {
    console.error("Book Parlor goal profile lookup failed", lookupError);
    throw new Error("goal_save_failed");
  }
  if (profile) return;

  const metadata = user.user_metadata ?? {};
  const fallbackName = sanitizeUsername(user.email?.split("@")[0] ?? "reader");
  const username = sanitizeUsername(metadata.username ?? fallbackName);
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    display_name: metadata.display_name ?? username,
  });
  if (error) {
    console.error("Book Parlor goal profile creation failed", error);
    throw new Error("goal_save_failed");
  }
}

function sanitizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "reader";
}
