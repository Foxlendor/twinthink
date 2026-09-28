// Breadcrumbs: record intentional choices (leans) as a viewer explores forks.
// A lean is stronger than a passive view - it's a deliberate turn.
// This data lives on-device and informs UI (showing unexplored paths, returns).

export interface Breadcrumb {
  /** The parent Twin id (the fork point). */
  forkId: string;
  /** The chosen child Twin id. */
  childId: string;
  /** When the choice was made (epoch ms). */
  leaned: number;
  /** Position in parent frame where the fork appeared. */
  forkX: number;
  forkY: number;
}

export interface ForkState {
  /** The parent Twin id. */
  parentId: string;
  /** Chosen child (if any). */
  chosen?: string;
  /** Unexplored siblings. */
  unexplored: string[];
  /** When we first arrived at this fork. */
  arrived: number;
}

/**
 * Track intentional choices through rabbit holes: which forks you've leaned into,
 * which paths you've chosen, and which remain unexplored.
 */
export class BreadcrumbTrail {
  private trail: Breadcrumb[] = [];
  private forkStack: ForkState[] = [];

  /**
   * Record an intentional choice: user leaned into a child at a fork.
   * Pass all siblings so we can track what's unexplored.
   */
  addLeaned(parentId: string, chosenChildId: string, siblings: string[], now: number) {
    const unexplored = siblings.filter((id) => id !== chosenChildId);

    // Record the breadcrumb
    this.trail.push({
      forkId: parentId,
      childId: chosenChildId,
      leaned: now,
      forkX: 0, // TODO: pass actual position
      forkY: 0,
    });

    // Push fork state
    this.forkStack.push({
      parentId,
      chosen: chosenChildId,
      unexplored,
      arrived: now,
    });
  }

  /**
   * When returning to a fork (ascending from child), note the return.
   * The viewer can now explore unexplored paths from this fork.
   */
  returnToFork(parentId: string) {
    // Check if this parent is in our fork stack
    const forkIdx = this.forkStack.findIndex((f) => f.parentId === parentId);
    if (forkIdx >= 0) {
      // Pop everything deeper than this fork
      this.forkStack = this.forkStack.slice(0, forkIdx + 1);
    }
  }

  /**
   * From the current fork, get siblings that haven't been leaned into yet.
   */
  unexploredAt(parentId: string): string[] {
    const fork = this.forkStack.find((f) => f.parentId === parentId);
    return fork?.unexplored ?? [];
  }

  /**
   * Check if a child was intentionally leaned into (not just scrolled past).
   */
  wasLeaned(parentId: string, childId: string): boolean {
    return this.trail.some((b) => b.forkId === parentId && b.childId === childId);
  }

  /**
   * The chosen path at a given fork.
   */
  chosenAt(parentId: string): string | undefined {
    return this.forkStack.find((f) => f.parentId === parentId)?.chosen;
  }

  /**
   * Full trail for debugging/inspection.
   */
  getTrail(): Breadcrumb[] {
    return [...this.trail];
  }

  /**
   * Clear all breadcrumbs (e.g., on page reload or entering a new Whoeuvre).
   */
  reset() {
    this.trail = [];
    this.forkStack = [];
  }
}

// Global trail for this session
export const breadcrumbs = new BreadcrumbTrail();
