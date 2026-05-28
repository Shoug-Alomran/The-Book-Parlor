import { PageHeader } from "../components/PageHeader";

export function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Settings" title="Keep the private things private." description="Configure account, profile, privacy defaults, theme, storage-backed photos, and future AI recommendation preferences." />
      <section className="grid gap-4 lg:grid-cols-2">
        {["Profile visibility", "Shelves privacy", "Reviews privacy", "Ratings privacy", "Quotes privacy", "Bookcases privacy"].map((label, index) => (
          <label key={label} className="cozy-card flex items-center justify-between gap-4 font-bold">
            <span>{label}</span>
            <select defaultValue={index < 2 ? "private" : "public"} className="rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
        ))}
      </section>
    </div>
  );
}
