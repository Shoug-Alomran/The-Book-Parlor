import { moods, tropes } from "../data/constants";
import type { Book } from "../types";

type DetectionResult = {
  genres: string[];
  tropes: string[];
  moods: string[];
  confidence: number;
};

const keywordMap: Array<{ keywords: string[]; tropes: string[]; moods: string[]; genres?: string[] }> = [
  { keywords: ["enemy", "rival", "banter"], tropes: ["enemies-to-lovers"], moods: ["intense", "addictive"], genres: ["Romance"] },
  { keywords: ["friend", "childhood"], tropes: ["friends-to-lovers"], moods: ["comforting"] },
  { keywords: ["forced proximity", "one room", "snowed in"], tropes: ["forced proximity", "one bed"], moods: ["funny", "intense"] },
  { keywords: ["fake dating", "pretend relationship"], tropes: ["fake dating"], moods: ["funny"] },
  { keywords: ["mafia", "crime family"], tropes: ["mafia", "morally gray MMC"], moods: ["dark", "intense"] },
  { keywords: ["fae", "fairy", "faerie"], tropes: ["fae"], moods: ["addictive"], genres: ["Fantasy"] },
  { keywords: ["vampire"], tropes: ["vampires"], moods: ["dark"], genres: ["Fantasy"] },
  { keywords: ["werewolf"], tropes: ["werewolves"], moods: ["intense"], genres: ["Fantasy"] },
  { keywords: ["academy", "university", "scholar"], tropes: ["academy", "dark academia"], moods: ["dark"], genres: ["Fantasy"] },
  { keywords: ["found family", "chosen family"], tropes: ["found family"], moods: ["healing", "comforting"] },
  { keywords: ["slow burn"], tropes: ["slow burn"], moods: ["addictive"] },
  { keywords: ["betrayal", "revenge"], tropes: ["betrayal", "revenge"], moods: ["devastating", "rage-inducing"] },
  { keywords: ["cozy", "tea", "cafe", "bookshop"], tropes: ["small town"], moods: ["cozy", "comforting"] },
  { keywords: ["grief", "death", "loss"], tropes: [], moods: ["emotional", "devastating"] },
  { keywords: ["magic", "dragon", "kingdom"], tropes: ["chosen one"], moods: ["addictive"], genres: ["Fantasy"] },
];

export const tropeDetectionService = {
  infer(description = "", categories: string[] = []): DetectionResult {
    const text = `${description} ${categories.join(" ")}`.toLowerCase();
    const foundTropes = new Set<string>();
    const foundMoods = new Set<string>();
    const foundGenres = new Set<string>(categories);

    keywordMap.forEach((rule) => {
      if (rule.keywords.some((keyword) => text.includes(keyword))) {
        rule.tropes.forEach((trope) => foundTropes.add(trope));
        rule.moods.forEach((mood) => foundMoods.add(mood));
        rule.genres?.forEach((genre) => foundGenres.add(genre));
      }
    });

    if (!foundMoods.size) foundMoods.add("cozy");
    return {
      genres: Array.from(foundGenres).filter(Boolean),
      tropes: Array.from(foundTropes).filter((trope) => tropes.includes(trope)),
      moods: Array.from(foundMoods).filter((mood) => moods.includes(mood)),
      confidence: Math.min(0.92, 0.45 + foundTropes.size * 0.08 + foundMoods.size * 0.04),
    };
  },

  enrichBook(book: Book): Book {
    const suggestions = this.infer(book.description, book.categories);
    return {
      ...book,
      categories: Array.from(new Set([...book.categories, ...suggestions.genres])),
      tropes: Array.from(new Set([...book.tropes, ...suggestions.tropes])),
      moods: Array.from(new Set([...book.moods, ...suggestions.moods])),
    };
  },
};
