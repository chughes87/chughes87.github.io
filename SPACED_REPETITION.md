# Spaced Repetition Upgrade Plan

## Goal

Replace the current binary "study again / got it" flashcard model with SM-2-based spaced repetition scheduling. Cards are shown on a schedule based on how well the user recalls them, using a 0–5 quality rating.

## Current System

- Binary: "study again" (re-shuffle into deck) or "got it" (remove from deck permanently)
- localStorage stores a flat array of mastered card terms (`{prefix}-gotit`)
- Session-based: no concept of time, intervals, or review dates
- Deck is shuffled randomly each session

## SM-2 Algorithm Summary

Each card tracks:
- **easeFactor** (EF): starts at 2.5, adjusts based on recall quality (min 1.3)
- **interval**: days until next review (starts at 1)
- **repetitions**: consecutive successful recalls
- **nextReview**: ISO date string of when the card is next due

On rating (quality q = 0–5):
- If q >= 3 (pass):
  - rep 0 → interval = 1 day
  - rep 1 → interval = 6 days
  - rep 2+ → interval = previous interval × EF
  - repetitions++
- If q < 3 (fail):
  - repetitions = 0, interval = 1 (restart)
  - EF unchanged on fail
- EF adjusted: `EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))`, clamped to min 1.3

## Changes

### 1. Data Model (`localStorage`)

**Old key:** `{prefix}-gotit` → `["term1", "term2", ...]`

**New key:** `{prefix}-srs` → object keyed by card term:

```json
{
  "B-tree index": {
    "ef": 2.5,
    "interval": 6,
    "reps": 1,
    "nextReview": 1742428800000
  },
  "Hash index": {
    "ef": 2.36,
    "interval": 1,
    "reps": 0,
    "nextReview": 1741996800000
  }
}
```

Cards with no entry are treated as new (never reviewed).

**Migration:** On load, if old `{prefix}-gotit` key exists, import those terms as cards with `reps: 2, interval: 6, ef: 2.5, nextReview: today` (treat them as "known but due for review"). Then delete the old key.

### 2. Session Deck Building

Replace random shuffle with priority-based selection:

1. **Due cards**: `nextReview <= today`, sorted by most overdue first
2. **New cards**: no SRS entry yet, shuffled randomly

Each session presents: all due cards first, then new cards. The category filter still applies on top.

### 3. UI Changes

#### Replace button row

**Old:** Two buttons — "study again" / "got it"

**New:** Six buttons (0–5) shown after flipping, with labels and color coding:

| Score | Label | Color | Meaning |
|-------|-------|-------|---------|
| 0 | Blank | red | Complete blackout |
| 1 | Wrong | red | Wrong, but recognized answer |
| 2 | Hard | orange | Wrong, but answer felt close |
| 3 | Okay | yellow-green | Correct with serious difficulty |
| 4 | Good | green | Correct with some hesitation |
| 5 | Easy | blue/accent | Instant, effortless recall |

Buttons arranged in a single row, compact. Each shows the score digit and label.

After rating, show a brief toast/label: "See again in X days" (or "See again today" for fails).

#### Stats row update

**Old:** "done / got it / left"

**New:** "due / new / learned" where:
- **due** = cards with nextReview <= today (in current category)
- **new** = cards never reviewed (in current category)
- **learned** = cards with nextReview > today (in current category)

#### Progress bar

Change from "mastered / total" to "(learned + due completed this session) / total in category". This still gives a sense of overall progress.

#### "All done" state

When no due or new cards remain for today, show "all done for today!" with next review date: "Next card due: March 17".

Replace "study again" reset button with two options:
- **"Study ahead"** — pull in cards due soonest, even if not yet due
- **"Reset all progress"** — clear SRS data entirely

### 4. Hub Page Progress

`flashcards.html` currently reads `{prefix}-gotit` length for progress.

Update to read `{prefix}-srs`, count cards where `interval >= 21` (mature cards) as "learned" for the progress bar. Show "X learned / Y due today" instead of just a fraction.

### 5. Implementation Steps

These are ordered to be independently testable at each step.

1. **Add SM-2 functions to `flashcard-engine.js`**
   - `calcSRS(cardData, quality)` → returns updated `{ef, interval, reps, nextReview}`
   - `loadSRS()` / `saveSRS()` for localStorage
   - Migration function for old `gotit` data

2. **Change deck building**
   - `buildDeck()` returns due cards (sorted) + new cards (shuffled)
   - Respect category filter

3. **Replace button UI**
   - Remove "study again" / "got it" buttons
   - Add 0–5 rating buttons with colors and labels
   - Show interval preview on button hover or as static text ("1d", "6d", etc.)
   - Wire buttons to `calcSRS` + `saveSRS` + advance to next card

4. **Update stats and progress bar**
   - Change stat labels to due/new/learned
   - Update progress calculation
   - Update "all done" state with next review date

5. **Update hub page**
   - Read new `{prefix}-srs` key
   - Display learned/due counts

6. **Test migration path**
   - Verify old `gotit` data migrates cleanly
   - Verify fresh start works (no localStorage)

### 6. What Stays the Same

- Config format (`window.FLASHCARD_CONFIG`) — no changes needed to deck pages
- Card data structure (`term`, `cat`, `desc`, `code`)
- Category tabs and filtering
- 3D card flip animation
- Theme toggle and persistence
- Overall layout and styling
- Auth flashcards page (React, untouched)

### 7. Design Considerations

**Why SM-2 and not SM-18/FSRS?** SM-2 is simple, well-understood, and runs entirely client-side with minimal state. This is a static site with localStorage — no need for the complexity of newer algorithms. SM-2 is what original Anki used and works well for the scale of these decks (50-60 cards).

**Date handling:** Use Unix timestamps (milliseconds, via `Date.now()`) for `nextReview`. A card is due when `nextReview <= Date.now()`. Intervals are stored in days but converted to ms (`interval * 86400000`) when computing the next review time. This avoids timezone edge cases that arise with date strings.

**No daily limits:** Anki caps new cards/day and reviews/day. Skip this for now — our decks are small enough that daily limits aren't needed. Can add later if decks grow.
