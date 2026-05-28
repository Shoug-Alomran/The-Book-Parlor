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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (mode: "sign-in" | "sign-up") => {
    try {
      setLoading(true);
      await (mode === "sign-in" ? authService.signIn(email, password) : authService.signUp(email, password, { username, displayName }));
      setMessage(mode === "sign-in" ? "Welcome back. Your library is ready." : "Account created. If email confirmation is enabled, confirm your email before logging in.");
      if (mode === "sign-in") navigate("/search");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Auth" title="Step into your private reading room." description="Create an account, then start adding books to your real Supabase-backed digital library." />
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
          {message && <p className="rounded-2xl bg-sage/20 p-3 text-sm font-bold">{message}</p>}
        </div>
      </section>
    </div>
  );
}
