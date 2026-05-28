import { motion } from "framer-motion";
import { Brush, Crown, Droplet, Flame, Heart, Moon, PawPrint, Sparkles, Star, Zap, BadgeAlert, ThumbsUp } from "lucide-react";
import { ratingIconMap } from "../data/ratingTemplates";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const iconByName = {
  stars: Star,
  fire: Flame,
  drop: Droplet,
  crown: Crown,
  heart: Heart,
  moon: Moon,
  exclamation: BadgeAlert,
  sparkles: PawPrint,
  lightning: Zap,
  clap: ThumbsUp,
  paintbrush: Brush,
};

export function RatingIconGroup({ label, value, onChange }: Props) {
  const Icon = iconByName[(ratingIconMap[label] ?? "stars") as keyof typeof iconByName] ?? Sparkles;
  return (
    <div className="rounded-2xl border border-mocha/10 bg-white/55 p-4 dark:border-white/10 dark:bg-white/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold text-espresso dark:text-cream">{label}</span>
        <span className="rounded-full bg-espresso px-2.5 py-1 text-xs font-black text-cream dark:bg-gold dark:text-espresso">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <motion.button
            key={score}
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -2 }}
            onClick={() => onChange(score)}
            className={`grid h-10 w-10 place-items-center rounded-2xl transition ${score <= value ? "bg-gold text-espresso shadow-lg shadow-gold/30" : "bg-espresso/10 text-mocha/45 hover:bg-white dark:bg-white/10 dark:text-cream/40"}`}
            aria-label={`${label} ${score}`}
          >
            <Icon size={20} fill={score <= value ? "currentColor" : "none"} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
