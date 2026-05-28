import { motion } from "framer-motion";
import type { UserBook } from "../types";

type Props = {
  item: UserBook;
  index: number;
  mode?: "spine" | "cover" | "grid" | "cozy";
};

const spineColors = ["#7B5138", "#8FA88F", "#C98E8B", "#D6A84F", "#6E4A5B", "#3C5F57", "#9C6B48"];

export function BookSpine({ item, index, mode = "spine" }: Props) {
  if (mode === "cover" || mode === "grid") {
    return (
      <motion.div whileHover={{ y: -7, rotate: -1 }} className="w-24">
        <div className="aspect-[2/3] overflow-hidden rounded-lg bg-white/40 shadow-lg">
          {item.book.coverUrl ? <img src={item.book.coverUrl} alt={item.book.title} className="h-full w-full object-cover" /> : null}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -12 }}
      className="relative flex h-44 w-11 items-end justify-center rounded-t-md border border-white/25 px-1 pb-3 shadow-lg"
      style={{ background: `linear-gradient(160deg, ${spineColors[index % spineColors.length]}, #2D1E18)` }}
    >
      <span className="line-clamp-1 origin-center -rotate-90 whitespace-nowrap text-xs font-extrabold text-cream">{item.book.title}</span>
      {mode === "cozy" && <span className="absolute -top-4 left-1/2 h-4 w-2 -translate-x-1/2 rounded-full bg-gold/80 shadow-[0_0_18px_rgba(214,168,79,0.8)]" />}
    </motion.div>
  );
}
