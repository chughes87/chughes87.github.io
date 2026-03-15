# Flashcard System

A configuration-driven flashcard engine for studying technical topics, with a shared reusable template and multiple topic decks.

## File Organization

```
flashcards/
├── src/
│   ├── srs.js                   # SM-2 spaced repetition algorithm (pure functions)
│   └── flashcard-engine.js      # Shared UI engine
├── tests/
│   └── srs.test.js              # Unit tests for SM-2 algorithm
├── flashcards.html              # Hub page listing all decks
├── postgres-flashcards.html     # PostgreSQL deck (54 cards)
├── ruby-flashcards.html         # Ruby & Rails deck (57 cards)
├── napkin-math-flashcards.html  # Napkin Math deck (46 cards)
└── auth-flashcards.html         # Authorization Models deck (6 cards, React-based)
```

## How It Works

### Shared Engine (`flashcards/src/flashcard-engine.js`)

Each deck page is a minimal HTML file that:

1. Sets `window.FLASHCARD_CONFIG` with deck-specific data
2. Loads `srs.js` and `flashcard-engine.js` from `flashcards/src/`, which render the full UI

The config object shape:

```js
window.FLASHCARD_CONFIG = {
  title: "PostgreSQL Flashcards",
  storagePrefix: "pg-flashcards",       // localStorage key prefix
  accentColor: "#336791",               // light mode accent
  darkAccentColor: "#5b9bd5",           // dark mode accent
  categoryLabels: { "Background Jobs": "BG Jobs" },  // optional short labels for tabs
  categories: {
    "Indexes":     { color: "#336791", darkColor: "#5b9bd5" },
    "Queries":     { color: "#2e7d32", darkColor: "#66bb6a" },
    // ...
  },
  cards: [
    { term: "B-tree index", cat: "Indexes", desc: "...", code: "CREATE INDEX..." },
    // ...
  ]
};
```

**Card fields:**
- `term` — front of the card
- `cat` — category (used for filtering tabs)
- `desc` — back of card description
- `code` — optional code block shown on the back

### What the Engine Renders

- **Category tabs** — filter cards by topic, plus an "All" tab
- **3D flip cards** — click to reveal the answer (CSS `rotateY` transform)
- **SM-2 spaced repetition** — rate recall 0–5, cards scheduled based on performance
- **Progress bar** — shows learned vs. total cards
- **Theme toggle** — light/dark mode button (top-right corner)

### Adding a New Deck

Create an HTML file following the pattern of an existing deck:

1. Add Google Fonts link (`DM Sans` + `DM Mono`)
2. Set `window.FLASHCARD_CONFIG` with your title, categories, and cards
3. Add `<script src="/flashcards/src/srs.js"></script>` and `<script src="/flashcards/src/flashcard-engine.js"></script>`
4. Add a link to the new deck in `flashcards.html`

That's it — the engine handles all rendering, interaction, and persistence.

## Hub Page (`flashcards.html`)

Lists all available decks with:
- Card count and categories
- Progress bar (reads localStorage to show how many cards you've mastered)
- Links to each deck page

Each deck card uses `data-storage-key` and `data-total` attributes so the hub can compute progress client-side.

## localStorage Persistence

Two keys per deck, prefixed by `storagePrefix`:

| Key | Value |
|-----|-------|
| `{prefix}-theme` | `"light"` or `"dark"` |
| `{prefix}-srs` | JSON object of SM-2 card data keyed by term |

Example: `pg-flashcards-srs` → `{"B-tree index": {"ef": 2.5, "interval": 6, "reps": 2, "nextReview": 1742428800000}, ...}`

## Theming

CSS variables switch between light and dark mode via `[data-theme="dark"]`:

| Variable | Light | Dark |
|----------|-------|------|
| `--bg` | `#f5f5f0` | `#0e0e10` |
| `--surface` | `#fff` | `#18181c` |
| `--text` | `#1a1a1a` | `#f0eee8` |

Each category also gets its own color variables (`--cat1`, `--cat1-bg`, etc.) generated dynamically from the config.

## Auth Flashcards (Separate Implementation)

`auth-flashcards.html` uses React instead of the shared engine. It has a different interaction model:
- 4 sides per card (Concept, Pros, Cons, Best For) instead of front/back flip
- Arrow navigation between cards
- No localStorage persistence
- 6 cards covering RBAC, ABAC, ReBAC, PBAC, ACL, and a comparison card
