import { useState, useCallback, useEffect } from "react";

const CATEGORIES = {
  latency: { label: "Latency Numbers", color: "#e8590c", bg: "#fff4e6" },
  throughput: { label: "Throughput & Limits", color: "#1971c2", bg: "#e7f5ff" },
  storage: { label: "Storage & Scale", color: "#2f9e44", bg: "#ebfbee" },
  decisions: { label: "Decision Boundaries", color: "#9c36b5", bg: "#f8f0fc" },
  conversions: { label: "Quick Conversions", color: "#e03131", bg: "#fff5f5" },
};

const cards = [
  // === LATENCY NUMBERS ===
  {
    cat: "latency",
    q: "L1 cache reference",
    a: "~1 ns",
    note: "This is your baseline. Everything else is slower than this.",
  },
  {
    cat: "latency",
    q: "L2 cache reference",
    a: "~4 ns",
    note: "~4x slower than L1.",
  },
  {
    cat: "latency",
    q: "RAM (main memory) reference",
    a: "~100 ns",
    note: "100x slower than L1. Still extremely fast — in-memory data structures are your friend.",
  },
  {
    cat: "latency",
    q: "SSD random read",
    a: "~16 μs (16,000 ns)",
    note: "~160x slower than RAM. But still fast enough for most DB reads.",
  },
  {
    cat: "latency",
    q: "HDD disk seek",
    a: "~2–10 ms",
    note: "~100,000x slower than RAM. This is why we cache aggressively.",
  },
  {
    cat: "latency",
    q: "Round trip within same datacenter",
    a: "~0.5 ms (500 μs)",
    note: "Each network hop in your architecture adds ~0.5ms. 10 sequential service calls = 5ms just in network latency.",
  },
  {
    cat: "latency",
    q: "Round trip: California → Netherlands → California",
    a: "~150 ms",
    note: "Speed of light limit. This is why CDNs and regional replicas matter for global users.",
  },
  {
    cat: "latency",
    q: "Mutex lock/unlock",
    a: "~17 ns",
    note: "Cheap but adds up in hot paths with contention.",
  },
  {
    cat: "latency",
    q: "Read 1 MB sequentially from RAM",
    a: "~3 μs",
    note: "RAM is great for sequential access. ~250 μs from SSD, ~825 μs from HDD.",
  },
  {
    cat: "latency",
    q: "Read 1 MB sequentially from SSD",
    a: "~250 μs (0.25 ms)",
    note: "~80x slower than RAM for sequential reads. Still very fast.",
  },
  {
    cat: "latency",
    q: "Read 1 MB sequentially from HDD",
    a: "~825 μs (~1 ms)",
    note: "Only ~3x slower than SSD for sequential reads. HDDs are bad at random, decent at sequential.",
  },

  // === THROUGHPUT & LIMITS ===
  {
    cat: "throughput",
    q: "QPS a single web server can handle (e.g., Nginx)",
    a: "~10K–100K+ QPS",
    note: "For simple requests. CPU-heavy work drops this significantly. A typical app server: 1K–10K QPS.",
  },
  {
    cat: "throughput",
    q: "QPS a single MySQL/Postgres instance handles",
    a: "~1K–10K QPS (reads), ~1K–5K QPS (writes)",
    note: "Depends heavily on query complexity. Simple key lookups are fast; joins and scans kill throughput.",
  },
  {
    cat: "throughput",
    q: "QPS a single Redis instance handles",
    a: "~100K+ QPS",
    note: "In-memory, single-threaded. Great for caching, rate limiting, sessions. ~100K reads or writes/sec.",
  },
  {
    cat: "throughput",
    q: "QPS a single Cassandra node handles",
    a: "~10K–50K QPS (writes), ~5K–20K QPS (reads)",
    note: "Optimized for writes. Scales linearly by adding nodes.",
  },
  {
    cat: "throughput",
    q: "What's the bandwidth of a 1 Gbps network link?",
    a: "~125 MB/s",
    note: "1 Gbps ÷ 8 = 125 MB/s. Typical datacenter links are 1–25 Gbps. Cross-region is slower.",
  },
  {
    cat: "throughput",
    q: "How many connections can a single server handle?",
    a: "~10K–1M+ (C10K problem)",
    note: "With epoll/kqueue (event-driven): millions of idle connections. Active connections limited by CPU/memory.",
  },
  {
    cat: "throughput",
    q: "Kafka throughput per broker",
    a: "~100K–200K+ messages/sec, ~100 MB/s",
    note: "Kafka is built for throughput. A small cluster handles millions of events/sec.",
  },

  // === STORAGE & SCALE ===
  {
    cat: "storage",
    q: "How much storage for 1 billion user records (1 KB each)?",
    a: "~1 TB",
    note: "1B × 1 KB = 1 TB. Fits on a single modern disk. Don't over-shard too early.",
  },
  {
    cat: "storage",
    q: "How many tweets per day does Twitter/X handle?",
    a: "~500M tweets/day → ~6K tweets/sec",
    note: "Good benchmark for a high-write social system. Peak is 2–3x average.",
  },
  {
    cat: "storage",
    q: "Storage for 1 million images (each ~200 KB)?",
    a: "~200 GB",
    note: "1M × 200 KB = 200 GB. Object storage (S3) is the right answer, not your DB.",
  },
  {
    cat: "storage",
    q: "How much RAM does a modern server have?",
    a: "64 GB – 512 GB typical, up to 1–2 TB",
    note: "A single server can cache a LOT of data in memory. Don't jump to distributed caching too fast.",
  },
  {
    cat: "storage",
    q: "How much disk does a modern server have?",
    a: "1–16 TB SSD, up to 100 TB+ HDD",
    note: "A single machine can store a lot. Think twice before distributing data you don't have to.",
  },
  {
    cat: "storage",
    q: "How many daily active users (DAU) is 'large scale'?",
    a: "~10M+ DAU is genuinely large scale",
    note: "Most startups are <1M DAU. Don't design for Google scale unless the problem actually needs it.",
  },
  {
    cat: "storage",
    q: "Estimate storage for 5M users sending 40 messages/day (avg 100 bytes each) for 1 year",
    a: "~7 TB/year",
    note: "5M × 40 × 100B × 365 ≈ 7.3 TB. Add metadata overhead (~2x) → ~15 TB. One beefy machine or a small cluster.",
  },

  // === DECISION BOUNDARIES ===
  {
    cat: "decisions",
    q: "When do you NEED a cache (Redis/Memcached)?",
    a: "When your DB can't handle the read QPS, OR p99 latency is too high",
    note: "If your DB handles the load fine at <50ms, you don't need a cache. Don't add one 'just because.' Redis: ~100K QPS. DB: ~5K QPS. Add cache when you need that 20x gap.",
  },
  {
    cat: "decisions",
    q: "When do you need to shard your database?",
    a: "When data > single machine disk (multi-TB) OR write QPS > single node capacity (~5K–10K)",
    note: "Sharding is complex. Try vertical scaling, read replicas, and caching first. Many systems never need sharding.",
  },
  {
    cat: "decisions",
    q: "SQL vs. NoSQL — when to pick NoSQL?",
    a: "When you need: massive write throughput, flexible schema, horizontal scaling, OR no complex joins",
    note: "If you need transactions, complex queries, or strong consistency → SQL. Most CRUD apps are fine with SQL.",
  },
  {
    cat: "decisions",
    q: "When do you need a message queue (Kafka, SQS)?",
    a: "When you need to decouple producers/consumers, handle burst traffic, OR ensure at-least-once delivery",
    note: "If your write path is simple and synchronous and latency-sensitive, you might not need one. Queues add complexity.",
  },
  {
    cat: "decisions",
    q: "When does a single server stop being enough?",
    a: "At ~10K–50K QPS for a typical web app, or when you need high availability (HA)",
    note: "A single modern server is shockingly powerful. The main reason to distribute is HA, not just throughput.",
  },
  {
    cat: "decisions",
    q: "CDN: when is it worth it?",
    a: "When serving static assets to geographically distributed users AND latency matters",
    note: "Cross-continent round trip: ~150ms. CDN brings it to ~10–30ms. Essential for images, video, static files.",
  },
  {
    cat: "decisions",
    q: "When do you need a load balancer?",
    a: "When you have 2+ servers. So basically always in production.",
    note: "Even if you have one server, an LB gives you zero-downtime deploys. It's table stakes, not over-engineering.",
  },
  {
    cat: "decisions",
    q: "Read replicas vs. caching — which first?",
    a: "Caching first (it's simpler and gives 10–100x more throughput boost)",
    note: "A read replica doubles read capacity. A cache gives 10–100x. Cache for hot data, replicas for heavy analytical reads.",
  },
  {
    cat: "decisions",
    q: "When should you consider a search engine (Elasticsearch)?",
    a: "Full-text search, complex filtering across many fields, or fuzzy/typo-tolerant search",
    note: "Don't use ES as your primary database. Use it as a secondary index. SQL LIKE '%query%' doesn't scale.",
  },
  {
    cat: "decisions",
    q: "Monolith vs. microservices?",
    a: "Start monolith. Split when: team > ~20 engineers, deploy conflicts frequent, OR components scale very differently",
    note: "Microservices are a scaling strategy for TEAMS, not just traffic. Don't split prematurely.",
  },

  // === QUICK CONVERSIONS ===
  {
    cat: "conversions",
    q: "Seconds in a day?",
    a: "~86,400 → round to ~100K for napkin math",
    note: "24 × 60 × 60 = 86,400. Using 100K (10⁵) makes division easy.",
  },
  {
    cat: "conversions",
    q: "Seconds in a month? In a year?",
    a: "Month: ~2.5M (2.5 × 10⁶). Year: ~30M (3 × 10⁷).",
    note: "Handy for converting 'X per day' to 'X per second.' Just divide daily count by 100K.",
  },
  {
    cat: "conversions",
    q: "Daily Active Users → QPS rule of thumb?",
    a: "DAU × avg_requests_per_user ÷ 86,400. Peak ≈ 2–3x average.",
    note: "Example: 10M DAU, 10 requests each = 100M/day ÷ 100K ≈ 1K QPS avg, ~3K QPS peak.",
  },
  {
    cat: "conversions",
    q: "Powers of 2 you should know: 2¹⁰, 2²⁰, 2³⁰, 2⁴⁰",
    a: "2¹⁰ ≈ 1 Thousand, 2²⁰ ≈ 1 Million, 2³⁰ ≈ 1 Billion, 2⁴⁰ ≈ 1 Trillion",
    note: "KB = 2¹⁰, MB = 2²⁰, GB = 2³⁰, TB = 2⁴⁰. These are your anchors.",
  },
  {
    cat: "conversions",
    q: "Characters in a typical tweet / chat message?",
    a: "~140–280 chars → ~200 bytes (UTF-8 avg). With metadata: ~1 KB.",
    note: "For napkin math, use 1 KB per message/record as a safe default.",
  },
  {
    cat: "conversions",
    q: "Size of a typical UUID?",
    a: "16 bytes (128 bits) raw, 36 bytes as string",
    note: "IDs add up at scale. 1 billion UUIDs (string) ≈ 36 GB just for the IDs.",
  },
  {
    cat: "conversions",
    q: "Typical image sizes?",
    a: "Thumbnail: ~10 KB. Web image: ~200 KB. High-res photo: ~2–5 MB.",
    note: "Video frame: ~50 KB compressed. 1 min of 1080p video: ~10–15 MB compressed.",
  },
  {
    cat: "conversions",
    q: "The 80/20 rule for caching",
    a: "20% of data serves 80% of requests. Cache the hot 20%.",
    note: "If you have 100 GB of data, a 20 GB cache could handle 80% of reads. Size your cache accordingly.",
  },
];

const PROGRESS_KEY = "napkin-math-progress";

export default function NapkinMathFlashcards() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [mode, setMode] = useState("browse"); // browse | study | review

  const filtered = activeCategory
    ? cards.filter((c) => c.cat === activeCategory)
    : cards;

  const studyCards =
    mode === "review"
      ? filtered.filter((_, i) => !known.has(getCardKey(filtered[i])))
      : filtered;

  const current = studyCards[currentIndex];

  function getCardKey(card) {
    return card ? `${card.cat}:${card.q}` : "";
  }

  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % studyCards.length);
  }, [studyCards.length]);

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + studyCards.length) % studyCards.length);
  }, [studyCards.length]);

  const handleMarkKnown = useCallback(() => {
    if (current) {
      setKnown((prev) => {
        const next = new Set(prev);
        const key = getCardKey(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    }
    handleNext();
  }, [current, handleNext]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === "ArrowRight" || e.key === "l") handleNext();
      if (e.key === "ArrowLeft" || e.key === "h") handlePrev();
      if (e.key === "k") handleMarkKnown();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleFlip, handleNext, handlePrev, handleMarkKnown]);

  const catCounts = {};
  for (const cat of Object.keys(CATEGORIES)) {
    const total = cards.filter((c) => c.cat === cat).length;
    const done = cards.filter((c) => c.cat === cat && known.has(getCardKey(c))).length;
    catCounts[cat] = { total, done };
  }

  if (mode === "browse") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <span style={styles.titleAccent}>SYS</span>
            <span style={styles.titleMain}>DESIGN</span>
          </div>
          <div style={styles.subtitle}>Napkin Math Flashcards</div>
          <div style={styles.tagline}>
            {cards.length} cards across {Object.keys(CATEGORIES).length} categories
            {known.size > 0 && (
              <span style={styles.progressInline}> · {known.size}/{cards.length} mastered</span>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setCurrentIndex(0);
                setFlipped(false);
                setMode("study");
              }}
              style={{
                ...styles.catCard,
                borderLeft: `4px solid ${cat.color}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }}
            >
              <div style={{ ...styles.catLabel, color: cat.color }}>{cat.label}</div>
              <div style={styles.catCount}>
                {catCounts[key].total} cards
                {catCounts[key].done > 0 && (
                  <span style={{ color: "#2f9e44", marginLeft: 8, fontSize: 13 }}>
                    ✓ {catCounts[key].done}
                  </span>
                )}
              </div>
              <div style={styles.catBar}>
                <div
                  style={{
                    ...styles.catBarFill,
                    width: `${(catCounts[key].done / catCounts[key].total) * 100}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </button>
          ))}

          <button
            onClick={() => {
              setActiveCategory(null);
              setCurrentIndex(0);
              setFlipped(false);
              setMode("study");
            }}
            style={{
              ...styles.catCard,
              borderLeft: `4px solid #495057`,
              gridColumn: "1 / -1",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
            }}
          >
            <div style={{ ...styles.catLabel, color: "#495057" }}>📚 Study All Cards</div>
            <div style={styles.catCount}>{cards.length} cards total</div>
          </button>
        </div>

        <div style={styles.shortcutHint}>
          Keyboard: <code>Space</code> flip · <code>←→</code> navigate · <code>K</code> mark known
        </div>
      </div>
    );
  }

  // Study mode
  if (!current || studyCards.length === 0) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#2f9e44", marginBottom: 8 }}>
            All cards mastered!
          </div>
          <div style={{ color: "#868e96", marginBottom: 24 }}>
            You've marked all cards in this set as known.
          </div>
          <button onClick={() => setMode("browse")} style={styles.backBtn}>
            ← Back to Categories
          </button>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORIES[current.cat];

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => { setMode("browse"); setCurrentIndex(0); }} style={styles.backBtn}>
          ← Categories
        </button>
        <div style={styles.counter}>
          {currentIndex + 1} / {studyCards.length}
          {mode === "review" && (
            <span style={{ color: "#868e96", fontSize: 13, marginLeft: 8 }}>
              (review mode)
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setMode(mode === "review" ? "study" : "review");
            setCurrentIndex(0);
            setFlipped(false);
          }}
          style={{
            ...styles.modeToggle,
            backgroundColor: mode === "review" ? "#fff4e6" : "#f8f9fa",
            color: mode === "review" ? "#e8590c" : "#495057",
          }}
        >
          {mode === "review" ? "Show All" : "Hide Known"}
        </button>
      </div>

      <div
        onClick={handleFlip}
        style={{
          ...styles.card,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            ...styles.cardCategory,
            color: catMeta.color,
            backgroundColor: catMeta.bg,
          }}
        >
          {catMeta.label}
        </div>

        {!flipped ? (
          <div style={styles.cardFront}>
            <div style={styles.questionText}>{current.q}</div>
            <div style={styles.tapHint}>tap to reveal</div>
          </div>
        ) : (
          <div style={styles.cardBack}>
            <div style={styles.answerText}>{current.a}</div>
            <div style={styles.noteDivider} />
            <div style={styles.noteText}>{current.note}</div>
          </div>
        )}

        {known.has(getCardKey(current)) && (
          <div style={styles.knownBadge}>✓ Known</div>
        )}
      </div>

      <div style={styles.controls}>
        <button onClick={handlePrev} style={styles.navBtn}>
          ← Prev
        </button>
        <button
          onClick={handleMarkKnown}
          style={{
            ...styles.knownBtn,
            backgroundColor: known.has(getCardKey(current)) ? "#fff4e6" : "#ebfbee",
            color: known.has(getCardKey(current)) ? "#e8590c" : "#2f9e44",
            borderColor: known.has(getCardKey(current)) ? "#e8590c" : "#2f9e44",
          }}
        >
          {known.has(getCardKey(current)) ? "Unmark" : "✓ Got It"}
        </button>
        <button onClick={handleNext} style={styles.navBtn}>
          Next →
        </button>
      </div>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${(known.size / cards.length) * 100}%`,
          }}
        />
      </div>
      <div style={styles.progressLabel}>
        {known.size} / {cards.length} mastered
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    maxWidth: 620,
    margin: "0 auto",
    padding: "24px 16px",
    minHeight: "100vh",
    backgroundColor: "#fafafa",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  titleBlock: {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: 900,
    color: "#e8590c",
    letterSpacing: 4,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: 900,
    color: "#212529",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#868e96",
    fontWeight: 500,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: "#adb5bd",
    marginTop: 8,
  },
  progressInline: {
    color: "#2f9e44",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  catCard: {
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: 10,
    padding: "18px 16px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    fontFamily: "inherit",
  },
  catLabel: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
  },
  catCount: {
    fontSize: 13,
    color: "#868e96",
    marginBottom: 8,
  },
  catBar: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  shortcutHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 24,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    background: "none",
    border: "1px solid #dee2e6",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    color: "#495057",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  counter: {
    fontSize: 14,
    fontWeight: 700,
    color: "#495057",
  },
  modeToggle: {
    border: "1px solid #dee2e6",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "28px 24px",
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
    position: "relative",
    transition: "box-shadow 0.2s ease",
  },
  cardCategory: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  cardFront: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  questionText: {
    fontSize: 20,
    fontWeight: 700,
    color: "#212529",
    lineHeight: 1.4,
  },
  tapHint: {
    marginTop: 24,
    fontSize: 12,
    color: "#ced4da",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardBack: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  answerText: {
    fontSize: 26,
    fontWeight: 900,
    color: "#212529",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.3,
  },
  noteDivider: {
    height: 1,
    background: "linear-gradient(to right, transparent, #dee2e6, transparent)",
    margin: "4px 0 16px",
  },
  noteText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 1.6,
    textAlign: "center",
    fontWeight: 400,
  },
  knownBadge: {
    position: "absolute",
    top: 12,
    right: 14,
    fontSize: 12,
    fontWeight: 700,
    color: "#2f9e44",
    backgroundColor: "#ebfbee",
    padding: "3px 10px",
    borderRadius: 20,
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  navBtn: {
    background: "#fff",
    border: "1px solid #dee2e6",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
    color: "#495057",
    transition: "all 0.15s ease",
  },
  knownBtn: {
    border: "1.5px solid",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    transition: "all 0.15s ease",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    marginTop: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2f9e44",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  progressLabel: {
    textAlign: "center",
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 6,
  },
};
