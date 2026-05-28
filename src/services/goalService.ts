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
    const { error } = await supabase.from("goals").upsert(
      {
        user_id: userData.user.id,
        year,
        goal_type: goalType,
        target_number: targetNumber,
        current_number: currentNumber,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,year,goal_type" },
    );
    if (error) throw error;
  },
};
