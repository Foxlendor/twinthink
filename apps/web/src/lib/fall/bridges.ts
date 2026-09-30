// Where a person's own work meets public knowledge: written by the maker, never inferred.
//
// Each bridge says that one piece of a Whoeuvre relates to one Wikipedia article, and why, in the
// maker's own words. In the Fall, the article then shows a thread of credit to the piece ("made
// this"), and the piece a thread back to the article. Only pieces a visitor who is not signed in
// may enter are ever shown (the Whoeuvre source enforces that), so a bridge can never expose
// anything private: a bridge to a piece that is not open to everyone is simply not drawn.
//
// Only what the maker has written here. Nothing is guessed, and nothing is added automatically.

export interface Bridge {
  /** The piece, by its id on the Slate (e.g. "archive/sipsmolder"). */
  piece: string;
  /** The Wikipedia article, by its title with underscores (e.g. "Drinking_straw"). */
  article: string;
  /** Why, in the maker's words, shown when leaned toward from the article's side. */
  why: string;
}

// johne.boi, 30 Sep 2026: the first three, in his words
export const BRIDGES: Bridge[] = [
  {
    piece: 'archive/sipsmolder',
    article: 'Drinking_straw',
    why: 'I wondered why a straw could only carry a drink instead of changing its temperature too.',
  },
  {
    piece: 'archive/bubbleblock',
    article: 'Ad_blocking',
    why: 'I wanted ad blocking to leave the screen and work on the physical world around you.',
  },
  {
    piece: 'archive/wear-os',
    article: 'Smart_ring',
    why: 'I wondered how much of a working device could disappear into something as ordinary as a ring.',
  },
];
