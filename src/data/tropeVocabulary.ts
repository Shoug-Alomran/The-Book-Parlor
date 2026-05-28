export type TropeVocabularyItem = {
  name: string;
  slug: string;
  aliases: string[];
};

export const tropeVocabulary: TropeVocabularyItem[] = [
  { name: "Enemies to lovers", slug: "enemies-to-lovers", aliases: ["enemies to lovers", "enemy to lover", "hate to love", "hate-to-love", "rivals to lovers"] },
  { name: "Friends to lovers", slug: "friends-to-lovers", aliases: ["friends to lovers", "friendship to romance"] },
  { name: "Forced proximity", slug: "forced-proximity", aliases: ["forced proximity", "stuck together"] },
  { name: "Fake dating", slug: "fake-dating", aliases: ["fake dating", "fake relationship", "pretend relationship"] },
  { name: "Marriage of convenience", slug: "marriage-of-convenience", aliases: ["marriage of convenience", "arranged marriage", "contract marriage"] },
  { name: "Morally gray characters", slug: "morally-gray-characters", aliases: ["morally gray", "morally grey", "morally gray mmc", "morally grey mmc"] },
  { name: "Touch her and die", slug: "touch-her-and-die", aliases: ["touch her and die", "touch him and die", "protective love interest"] },
  { name: "Found family", slug: "found-family", aliases: ["found family", "chosen family"] },
  { name: "Slow burn", slug: "slow-burn", aliases: ["slow burn", "slow-burn romance"] },
  { name: "Love triangle", slug: "love-triangle", aliases: ["love triangle"] },
  { name: "Second chance romance", slug: "second-chance-romance", aliases: ["second chance", "second chance romance"] },
  { name: "Grumpy sunshine", slug: "grumpy-sunshine", aliases: ["grumpy sunshine", "grumpy/sunshine"] },
  { name: "Only one bed", slug: "only-one-bed", aliases: ["one bed", "only one bed"] },
  { name: "Forbidden romance", slug: "forbidden-romance", aliases: ["forbidden romance", "forbidden love"] },
  { name: "Academy setting", slug: "academy-setting", aliases: ["academy", "academy setting", "school setting"] },
  { name: "Vampires", slug: "vampires", aliases: ["vampire", "vampires"] },
  { name: "Werewolves", slug: "werewolves", aliases: ["werewolf", "werewolves"] },
  { name: "Fae", slug: "fae", aliases: ["fae", "faerie", "faeries", "fair folk"] },
  { name: "Dystopian world", slug: "dystopian-world", aliases: ["dystopian", "dystopia"] },
  { name: "Chosen one", slug: "chosen-one", aliases: ["chosen one", "chosen-one"] },
  { name: "Revenge", slug: "revenge", aliases: ["revenge", "vengeance"] },
  { name: "Betrayal", slug: "betrayal", aliases: ["betrayal", "betrayed"] },
  { name: "Dark academia", slug: "dark-academia", aliases: ["dark academia"] },
  { name: "Sports romance", slug: "sports-romance", aliases: ["sports romance", "athlete romance"] },
  { name: "Small town", slug: "small-town", aliases: ["small town", "small-town"] },
  { name: "Mafia romance", slug: "mafia-romance", aliases: ["mafia", "mafia romance", "organized crime romance"] },
  { name: "Workplace romance", slug: "workplace-romance", aliases: ["workplace romance", "office romance"] },
  { name: "Rivals to lovers", slug: "rivals-to-lovers", aliases: ["academic rivals", "professional rivals"] },
  { name: "Who did this to you", slug: "who-did-this-to-you", aliases: ["who did this to you"] },
];

export const genreNames = new Set([
  "romance",
  "dark romance",
  "romantasy",
  "fantasy",
  "horror",
  "mystery",
  "thriller",
  "science fiction",
  "sci-fi",
  "literary fiction",
  "classic",
  "nonfiction",
  "biography",
  "self-help",
  "young adult",
  "children's book",
]);

export function normalizeTropeName(value: string) {
  const clean = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!clean || genreNames.has(clean)) return undefined;
  const match = tropeVocabulary.find((item) => item.slug.replace(/-/g, " ") === clean || item.aliases.some((alias) => alias.toLowerCase() === clean));
  if (match) return { name: match.name, slug: match.slug, custom: false };
  return { name: titleCase(clean), slug: slugify(clean), custom: true };
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
