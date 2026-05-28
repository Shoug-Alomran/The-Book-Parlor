import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { PageHeader } from "../components/PageHeader";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [identifier, setIdentifier] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await (mode === "sign-in" ? authService.signIn(identifier, password) : authService.signUp(signupEmail, password, { username, displayName }));
      showToast(mode === "sign-in" ? "Welcome back. Your reading room is ready." : "Your reading room is almost ready. Check your email if confirmation is required.", "success");
      if (mode === "sign-in") navigate("/search");
    } catch (error) {
      showToast(friendlyAuthMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, tone: "success" | "error") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <div>
      <PageHeader eyebrow="Auth" title="Create your reading room." description="Sign in to continue your reading journey, or create an account to begin building your library." />
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-2xl px-5 py-3 text-sm font-bold shadow-glow ${toast.tone === "success" ? "bg-espresso text-cream dark:bg-gold dark:text-espresso" : "bg-rose text-espresso"}`}>
          {toast.text}
        </div>
      )}
      <section className="cozy-card mx-auto max-w-xl">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white/40 p-2 dark:bg-white/10">
            <button type="button" onClick={() => setMode("sign-in")} className={mode === "sign-in" ? "btn-primary" : "btn-soft"}>Log in</button>
            <button type="button" onClick={() => setMode("sign-up")} className={mode === "sign-up" ? "btn-primary" : "btn-soft"}>Sign up</button>
          </div>
          {mode === "sign-in" ? (
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Email or username" aria-label="Email or username" />
          ) : (
            <input value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Email" aria-label="Email" />
          )}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Password" />
          {mode === "sign-up" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Username" />
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Display name" />
            </div>
          )}
          <button type="button" disabled={loading} onClick={submit} className="btn-primary disabled:opacity-50">{mode === "sign-in" ? "Log in" : "Create account"}</button>
        </div>
      </section>
    </div>
  );
}

function friendlyAuthMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "auth_failed";
  const messages: Record<string, string> = {
    auth_not_configured: "The reading room is not connected yet. Add your Supabase settings and try again.",
    invalid_credentials: "Email/username or password is incorrect.",
    username_not_found: "We couldn’t find that username.",
    email_not_confirmed: "Please confirm your email before logging in.",
    account_exists: "An account already exists for this email. Try signing in instead.",
    weak_password: "Choose a stronger password for your reading room.",
    email_issue: "Please check the email address and try again.",
    network_error: "We could not open your reading room just now. Please try again.",
    sign_out_failed: "We could not sign you out just now. Please try again.",
    auth_failed: "We could not open your reading room just now. Please try again.",
  };
  return messages[code] ?? messages.auth_failed;
}
