// Where a person's own work meets public knowledge: written by the maker, never inferred.
//
// Each bridge says that one piece of a Whoeuvre relates to one Wikipedia article, and why, in the
// maker's own words. In the Fall, the article then shows a thread of credit to the piece ("made
// this"), and the piece a thread back to the article. Only pieces a visitor who is not signed in
// may enter are ever shown (the Whoeuvre source enforces that), so a bridge can never expose
// anything private: a bridge to a piece that is not open to everyone is simply not drawn.
//
// Empty until the maker says which of their pieces relate to what. Nothing here is guessed.

export interface Bridge {
  /** The piece, by its id on the Slate (e.g. "archive/sipsmolder"). */
  piece: string;
  /** The Wikipedia article, by its title with underscores (e.g. "Drinking_straw"). */
  article: string;
  /** Why, in the maker's words, shown when leaned toward from the article's side. */
  why: string;
}

export const BRIDGES: Bridge[] = [];
