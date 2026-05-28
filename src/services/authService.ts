import { supabase } from "../lib/supabase";

export const authService = {
  async signUp(email: string, password: string, profile?: { username?: string; displayName?: string }) {
    if (!supabase) return { user: { email }, demo: true };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: profile?.username,
          display_name: profile?.displayName,
        },
      },
    });
    if (error) throw error;
    if (data.user) {
      await this.ensureProfile(data.user.id, {
        username: profile?.username ?? email.split("@")[0],
        display_name: profile?.displayName ?? profile?.username ?? email.split("@")[0],
      });
    }
    return data;
  },
  async signIn(email: string, password: string) {
    if (!supabase) return { user: { email }, demo: true };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await this.ensureProfile(data.user.id, {
        username: data.user.email?.split("@")[0],
        display_name: data.user.email?.split("@")[0],
      });
    }
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
  async getUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  async ensureProfile(userId: string, profile: { username?: string; display_name?: string }) {
    if (!supabase) return;
    await supabase.from("profiles").upsert({
      id: userId,
      username: profile.username,
      display_name: profile.display_name ?? profile.username,
    });
  },
};
