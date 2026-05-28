import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, BookHeart, BookOpen, BookOpenCheck, LogOut, Home, LibraryBig, Search, Settings, Sparkles, Tags, Target, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-books", label: "My Books", icon: BookOpenCheck },
  { to: "/bookcases", label: "Bookcases", icon: LibraryBig },
  { to: "/trope-bookcase", label: "Trope Cases", icon: Tags },
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/search", label: "Search", icon: Search },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [dark, setDark] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    authService.getUser().then((user) => setUserEmail(user?.email ?? null));
  }, [location.pathname]);

  const signOut = async () => {
    await authService.signOut();
    setUserEmail(null);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <aside className="fixed left-5 top-5 z-30 hidden h-[calc(100vh-2.5rem)] w-72 flex-col justify-between rounded-3xl border border-white/40 bg-white/55 p-4 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-white/10 lg:flex">
        <div>
          <NavLink to="/" className="mb-6 flex items-center gap-3 px-2 py-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-espresso text-cream dark:bg-gold dark:text-espresso">
              <BookHeart size={24} />
            </span>
            <span>
              <span className="block font-serif text-2xl font-bold">The Book Parlor</span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-mocha/70 dark:text-cream/60">digital book cafe</span>
            </span>
          </NavLink>
          <nav className="grid gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isActive ? "bg-espresso text-cream shadow-lg shadow-mocha/20 dark:bg-gold dark:text-espresso" : "text-espresso/75 hover:bg-white/55 dark:text-cream/75 dark:hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="grid gap-2">
          {userEmail ? (
            <button type="button" onClick={signOut} className="btn-soft w-full"><LogOut size={16} />Log out</button>
          ) : (
            <NavLink to="/auth" className="btn-primary w-full">Log in</NavLink>
          )}
          <button type="button" onClick={() => setDark((value) => !value)} className="btn-soft w-full">
            {dark ? "Morning cafe" : "Late-night mode"}
          </button>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl px-4 py-5 lg:ml-80 lg:px-8">
        <div className="mb-5 flex items-center justify-between rounded-3xl border border-white/40 bg-white/45 px-4 py-3 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-white/10 lg:hidden">
          <NavLink to="/" className="flex items-center gap-2 font-serif text-xl font-bold">
            <BookOpen size={22} />
            The Book Parlor
          </NavLink>
          <div className="flex gap-2">
            <NavLink to={userEmail ? "/profile" : "/auth"} className="btn-soft px-3">{userEmail ? "Profile" : "Log in"}</NavLink>
            <button type="button" onClick={() => setDark((value) => !value)} className="btn-soft px-3">
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-5 rounded-3xl border border-white/50 bg-white/75 p-2 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-espresso/80 lg:hidden">
        {navItems.filter((item) => ["/", "/my-books", "/bookcases", "/trope-bookcase", "/search"].includes(item.to)).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold ${isActive ? "bg-espresso text-cream dark:bg-gold dark:text-espresso" : "text-mocha dark:text-cream/75"}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
