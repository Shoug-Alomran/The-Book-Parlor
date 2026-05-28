import { supabase } from "../lib/supabase";

export const authService = {
  async signUp(email: string, password: string, profile?: { username?: string; displayName?: string }) {
    if (!supabase) throw new Error("auth_not_configured");
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
    if (error) throw new Error(mapAuthError(error.message));
    return data;
  },
  async signIn(identifier: string, password: string) {
    if (!supabase) throw new Error("auth_not_configured");
    const email = await resolveEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error.message));
    return data;
  },
  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("sign_out_failed");
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
};

async function resolveEmail(identifier: string) {
  const input = identifier.trim();
  if (!input) throw new Error("invalid_credentials");
  if (input.includes("@")) return input;
  if (!supabase) throw new Error("auth_not_configured");

  const { data, error } = await supabase.rpc("get_email_by_username", { input_username: input });
  if (error) throw new Error(mapAuthError(error.message));
  if (!data) throw new Error("username_not_found");
  return data as string;
}

function mapAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "invalid_credentials";
  if (text.includes("email not confirmed")) return "email_not_confirmed";
  if (text.includes("already registered") || text.includes("already exists")) return "account_exists";
  if (text.includes("failed to fetch") || text.includes("network") || text.includes("timeout")) return "network_error";
  if (text.includes("password")) return "weak_password";
  if (text.includes("email")) return "email_issue";
  return "auth_failed";
}
