import { supabase } from "../lib/supabase";

export const authService = {
  async signUp(email: string, password: string) {
    if (!supabase) return { user: { email }, demo: true };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },
  async signIn(email: string, password: string) {
    if (!supabase) return { user: { email }, demo: true };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};
