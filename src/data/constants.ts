import type { Bookcase, OwnershipStatus, ReadingStatus } from "../types";
import { tropeVocabulary } from "./tropeVocabulary";

export const readingStatuses: ReadingStatus[] = ["Want to Read", "Currently Reading", "Read", "DNF", "Paused"];

export const ownershipStatuses: OwnershipStatus[] = [
  "Purchased / Physically Owned",
  "eBook Owned",
  "Audiobook Owned",
  "Borrowed",
  "Not Owned",
  "Need to Buy",
];

export const defaultShelves = [
  "Want to Read",
  "Currently Reading",
  "Read",
  "DNF",
  "Paused",
  "Purchased",
  "Need to Buy",
  "Favorites",
  "Owned But Unread",
  "Rereads",
  "Book Club",
  "Recommendations",
];

export const smartShelves = [
  "Enemies to Lovers",
  "Mafia Romance",
  "Fantasy Romance",
  "Owned But Unread",
  "High Spice TBR",
  "Books That Might Destroy Me",
  "Comfort Reads",
  "Slow Burn",
  "Dark Academia",
  "Fae Books",
  "Emotional Damage",
  "Cozy Reads",
];

export const tropes = tropeVocabulary.map((trope) => trope.slug);

export const moods = ["cozy", "dark", "emotional", "funny", "intense", "chaotic", "comforting", "healing", "devastating", "addictive", "rage-inducing", "book hangover"];

export const contentWarnings = ["violence", "gore", "death", "grief", "abuse", "cheating", "pregnancy", "SA", "mental health", "toxic relationship", "addiction", "self-harm", "animal death", "war"];

export const defaultBookcases: Bookcase[] = [
  { id: "case-read", name: "Read Bookcase", type: "read", theme: "cozy-library", shelfColor: "#80563f", background: "linen wallpaper", decor: ["plants", "coffee cup"], visibility: "private" },
  { id: "case-purchased", name: "Purchased Bookcase", type: "purchased", theme: "cafe", shelfColor: "#7B5138", background: "warm plaster", decor: ["candles", "fairy lights", "cat decor"], visibility: "private" },
  { id: "case-tbr", name: "TBR Bookcase", type: "tbr", theme: "fantasy-forest", shelfColor: "#6F7659", background: "sage botanical", decor: ["plants", "fairy lights"], visibility: "private" },
  { id: "case-favorites", name: "Favorites Bookcase", type: "favorites", theme: "dark-academia", shelfColor: "#3B2922", background: "mahogany wall", decor: ["candles", "seasonal decorations"], visibility: "public" },
  { id: "case-owned-unread", name: "Owned But Unread Bookcase", type: "owned-unread", theme: "cafe", shelfColor: "#9C6B48", background: "cream wall", decor: ["coffee cup decor"], visibility: "private" },
];
