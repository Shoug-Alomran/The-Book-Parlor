import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { PageHeader } from "../components/PageHeader";

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (mode: "sign-in" | "sign-up") => {
    try {
      setLoading(true);
      await (mode === "sign-in" ? authService.signIn(email, password) : authService.signUp(email, password, { username, displayName }));
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
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Password" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Username for signup" />
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Display name" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={loading} onClick={() => submit("sign-in")} className="btn-primary disabled:opacity-50">Log in</button>
            <button type="button" disabled={loading} onClick={() => submit("sign-up")} className="btn-soft disabled:opacity-50">Sign up</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function friendlyAuthMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "auth_failed";
  const messages: Record<string, string> = {
    auth_not_configured: "The reading room is not connected yet. Add your Supabase settings and try again.",
    invalid_credentials: "That email and password do not match. Try again when you are ready.",
    email_not_confirmed: "Please confirm your email before signing in.",
    account_exists: "An account already exists for this email. Try signing in instead.",
    weak_password: "Choose a stronger password for your reading room.",
    email_issue: "Please check the email address and try again.",
    sign_out_failed: "We could not sign you out just now. Please try again.",
    auth_failed: "We could not open your reading room just now. Please try again.",
  };
  return messages[code] ?? messages.auth_failed;
}
