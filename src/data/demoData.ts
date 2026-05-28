import type { Book, Comment, Review, UserBook } from "../types";

export const demoBooks: Book[] = [
  {
    id: "demo-1",
    title: "Emily Wilde's Encyclopaedia of Faeries",
    authors: ["Heather Fawcett"],
    description: "A curmudgeonly scholar studies fae folklore in a remote village and discovers magic, danger, friendship, and a slow-blooming warmth beside the hearth.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593500132-L.jpg",
    isbn13: "9780593500132",
    pageCount: 336,
    publisher: "Del Rey",
    publishedYear: 2023,
    categories: ["Fantasy", "Romance"],
    language: "en",
    source: "demo",
    tropes: ["fae", "slow burn", "grumpy sunshine", "found family"],
    moods: ["cozy", "comforting", "addictive"],
  },
  {
    id: "demo-2",
    title: "The Very Secret Society of Irregular Witches",
    authors: ["Sangu Mandanna"],
    description: "A lonely witch is invited to teach three young witches at a hidden house where found family, soft magic, and tender romance brew together.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593439357-L.jpg",
    isbn13: "9780593439357",
    pageCount: 336,
    publisher: "Berkley",
    publishedYear: 2022,
    categories: ["Fantasy", "Romance"],
    language: "en",
    source: "demo",
    tropes: ["found family", "slow burn", "forbidden romance"],
    moods: ["cozy", "healing", "comforting"],
  },
  {
    id: "demo-3",
    title: "Babel",
    authors: ["R. F. Kuang"],
    description: "A dark academia fantasy about translation, empire, betrayal, and the devastating costs of knowledge inside an elite magical institute.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780063021426-L.jpg",
    isbn13: "9780063021426",
    pageCount: 560,
    publisher: "Harper Voyager",
    publishedYear: 2022,
    categories: ["Fantasy", "Historical Fiction"],
    language: "en",
    source: "demo",
    tropes: ["dark academia", "betrayal", "academy"],
    moods: ["dark", "devastating", "book hangover"],
    contentWarnings: ["violence", "death", "grief", "war"],
  },
  {
    id: "demo-4",
    title: "Book Lovers",
    authors: ["Emily Henry"],
    description: "A sharp literary agent and a brooding editor collide in a small town romance full of banter, family emotion, and publishing-world charm.",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593334836-L.jpg",
    isbn13: "9780593334836",
    pageCount: 384,
    publisher: "Berkley",
    publishedYear: 2022,
    categories: ["Romance", "Contemporary"],
    language: "en",
    source: "demo",
    tropes: ["enemies-to-lovers", "small town", "book club"],
    moods: ["funny", "emotional", "comforting"],
  },
];

export const demoUserBooks: UserBook[] = [
  { id: "ub-1", book: demoBooks[0], readingStatus: "Currently Reading", ownershipStatus: "Purchased / Physically Owned", format: "Physical book", currentPage: 182, isFavorite: true, isReread: false, shelves: ["Currently Reading", "Purchased", "Fantasy Romance"], rating: undefined },
  { id: "ub-2", book: demoBooks[1], readingStatus: "Read", ownershipStatus: "eBook Owned", format: "eBook", currentPage: 336, isFavorite: true, isReread: false, wouldReadAgain: true, shelves: ["Read", "Favorites", "Comfort Reads"] },
  { id: "ub-3", book: demoBooks[2], readingStatus: "Read", ownershipStatus: "Purchased / Physically Owned", format: "Physical book", currentPage: 560, isFavorite: false, isReread: false, wouldReadAgain: false, shelves: ["Read", "Purchased", "Dark Academia"] },
  { id: "ub-4", book: demoBooks[3], readingStatus: "Want to Read", ownershipStatus: "Purchased / Physically Owned", format: "Physical book", currentPage: 0, isFavorite: false, isReread: false, shelves: ["Want to Read", "Purchased", "Owned But Unread"] },
];

export const demoReviews: Review[] = [
  { id: "rev-1", bookId: "demo-1", userName: "parlor-reader", title: "Soft magic and sharper banter", body: "This feels like reading field notes beside a fire while someone interesting keeps interrupting.", hasSpoilers: false, isPublic: true, likes: 42 },
  { id: "rev-2", bookId: "demo-3", userName: "inkandcoffee", title: "Brilliant, brutal, unforgettable", body: "The kind of book that rearranges the furniture in your brain and leaves the room dimmer afterward.", hasSpoilers: false, isPublic: true, likes: 88 },
];

export const demoComments: Comment[] = [
  { id: "com-1", bookId: "demo-1", userName: "shelf-sprite", body: "The cozy academic energy is exactly my weakness.", hasSpoilers: false },
  { id: "com-2", bookId: "demo-4", userName: "mocha-margins", body: "Nora is such a good main character for eldest daughters.", hasSpoilers: false },
];
