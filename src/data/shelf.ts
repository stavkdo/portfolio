// The bookshelf in About me: one book for each pursuit, plus fantasy tomes.

export type Book = {
  /** the title on the spine; empty for an untitled tome with a gold ornament */
  title: string;
  /** height and width of the spine, in em */
  h: number;
  w: number;
  color: string;
  /** a pale spine, so its title is dark */
  light?: boolean;
  /** the last book leans on its neighbour */
  lean?: boolean;
};

export const books: Book[] = [
  { title: "Cyber security", h: 17, w: 3.2, color: "oklch(0.36 0.1 18)" },
  { title: "Cryptography", h: 18.6, w: 3.4, color: "oklch(0.36 0.12 266)" },
  { title: "", h: 15.4, w: 2.5, color: "oklch(0.35 0.07 165)" },
  { title: "Software", h: 16.6, w: 3, color: "oklch(0.84 0.04 85)", light: true },
  { title: "Martial arts", h: 17.8, w: 3.2, color: "oklch(0.4 0.09 45)" },
  { title: "Cello", h: 15, w: 2.9, color: "oklch(0.34 0.08 320)" },
  { title: "", h: 16.2, w: 2.4, color: "oklch(0.3 0.09 18)", lean: true },
];
