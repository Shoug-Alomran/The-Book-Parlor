import { useState } from "react";
import { authService } from "../services/authService";
import { PageHeader } from "../components/PageHeader";

export function AuthPage() {
  const [email, setEmail] = useState("reader@example.com");
  const [password, setPassword] = useState("bookparlor-demo");
  const [message, setMessage] = useState("");

  const submit = async (mode: "sign-in" | "sign-up") => {
    try {
      await (mode === "sign-in" ? authService.signIn(email, password) : authService.signUp(email, password));
      setMessage("Demo session ready. Add Supabase keys to enable real authentication.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Auth" title="Step into your private reading room." description="Supabase Auth powers real sign up, login, logout, and profiles. Without keys, this page stays in demo mode." />
      <section className="cozy-card mx-auto max-w-xl">
        <div className="grid gap-3">
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" placeholder="Password" />
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => submit("sign-in")} className="btn-primary">Log in</button>
            <button type="button" onClick={() => submit("sign-up")} className="btn-soft">Sign up</button>
          </div>
          {message && <p className="rounded-2xl bg-sage/20 p-3 text-sm font-bold">{message}</p>}
        </div>
      </section>
    </div>
  );
}
