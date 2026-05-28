import { defaultShelves, smartShelves } from "../data/constants";
import type { UserBook } from "../types";

export const shelfService = {
  getDefaultShelves: () => defaultShelves,
  getSmartShelves: () => smartShelves,
  shelvesForBook(userBook: UserBook) {
    const shelves = new Set(userBook.shelves);
    shelves.add(userBook.readingStatus);
    if (userBook.ownershipStatus === "Purchased / Physically Owned") shelves.add("Purchased");
    if (userBook.ownershipStatus === "Need to Buy") shelves.add("Need to Buy");
    if (userBook.ownershipStatus === "Purchased / Physically Owned" && userBook.readingStatus !== "Read") shelves.add("Owned But Unread");
    if (userBook.isFavorite) shelves.add("Favorites");
    userBook.book.tropes.forEach((trope) => {
      if (trope === "slow burn") shelves.add("Slow Burn");
      if (trope === "dark academia") shelves.add("Dark Academia");
      if (trope === "fae") shelves.add("Fae Books");
    });
    userBook.book.moods.forEach((mood) => {
      if (mood === "cozy" || mood === "comforting") shelves.add("Comfort Reads");
      if (mood === "devastating") shelves.add("Books That Might Destroy Me");
    });
    return Array.from(shelves);
  },
};
