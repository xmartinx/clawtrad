# Decisions Log — ClawTrad

Durable technical and product decisions. Each entry records what was decided, when, and why.

---

## 2025-06-08 — Product name: ClawTrad

**Decision:** Name the project ClawTrad.
**Reason:** Combines "clawhammer" and "trad" (short for Irish traditional music). Unique, searchable, relevant.

---

## 2025-06-08 — Internal slug: clawtrad

**Decision:** Use `clawtrad` as the internal project slug.
**Reason:** Lowercase, no spaces, suitable for npm package name, repo name, and URL paths.

---

## 2025-06-08 — Root folder: D:\Appbuilds\ClawTrad

**Decision:** Place the project at `D:\Appbuilds\ClawTrad`.
**Reason:** Developer's local environment. Contains no sensitive information.

---

## 2025-06-08 — Web app first

**Decision:** Build as a web application first. PWA and native wrappers deferred.
**Reason:** Fastest path to a working prototype. Web is universally accessible. PWA can be layered on later.

---

## 2025-06-08 — React + TypeScript + Vite

**Decision:** Use React 19 with TypeScript and Vite as the build tool.
**Reason:** Modern, widely adopted stack. TypeScript provides type safety for music engine logic. Vite offers fast dev iteration. All tools have strong community support.

---

## 2025-06-08 — abcjs for notation preview

**Decision:** Use abcjs for rendering standard notation from ABC input.
**Reason:** abcjs is the de facto standard for ABC rendering in browsers. It handles engraving with minimal configuration. We do not rely on abcjs for parsing — we use our own parser for the tab engine.

---

## 2025-06-08 — Custom arrangement engine

**Decision:** Build our own ABC-to-tab arrangement engine in TypeScript rather than adapting an existing ABC library's internal data.
**Reason:** Existing ABC libraries focus on notation rendering, not banjo tab generation. A custom engine gives us full control over position selection, scoring, and clawhammer-specific logic. It also avoids coupling to abcjs internals.

---

## 2025-06-08 — User-pasted ABC only for MVP

**Decision:** Accept only user-pasted ABC text. No file upload, no URL import, no tune database.
**Reason:** Keeps the MVP simple. Avoids copyright and licensing questions. Eliminates need for backend storage. File upload and tune library import can be added in later versions.

---

## 2025-06-08 — No scraping

**Decision:** Do not scrape any tune websites or databases.
**Reason:** Legal and ethical caution. Tune websites have varying terms of use. Scraping without permission raises copyright and ToS issues. We will seek proper integration paths (e.g., APIs with permission) for future versions.

---

## 2025-06-08 — No backend in v0.1

**Decision:** Do not add any server-side component in v0.1.
**Reason:** All processing is local and lightweight. A backend adds complexity, cost, and security surface area with no benefit for the MVP. User accounts, saved arrangements, and sync can be added later.

---

## 2025-06-08 — Plain text tab first before fancy rendering

**Decision:** Output plain-text ASCII tab in v0.1. Defer SVG/HTML canvas rendering to v0.2.
**Reason:** ASCII tab is functional, copyable, and universally readable. It validates the arrangement engine before investing in rendering. Fancy rendering is a presentation concern, not a musical one.

---

## 2025-06-08 — MIDI pitch numbers as internal representation

**Decision:** Use MIDI note numbers (middle C = 60) for all internal pitch calculations.
**Reason:** Integer, enharmonic, simple math. Trivially mapped to fret positions (fret = pitch − open_string_pitch). No need to carry around note names or accidentals internally.

---

## 2025-06-08 — Greedy position selection

**Decision:** Use a greedy (note-by-note) best-position algorithm rather than global optimisation.
**Reason:** Global optimisation (e.g., Viterbi) is complex to implement and tune. Greedy selection with good scoring weights produces reasonable results for the MVP. Can be upgraded later.

---

## 2025-06-08 — v0.1.1: Arrangement-engine reliability before visual tab rendering

**Decision:** Prioritise arrangement-engine reliability (parsing, key signatures, DP algorithm, warnings) over visual tab rendering in v0.1.1.
**Reason:** Visually polished tab should not precede musically trustworthy output. A reliable arrangement engine validates the core value proposition before investing in presentation.

---

## 2025-06-08 — Dynamic programming for position selection (replaces greedy)

**Decision:** Replace greedy position selection with Viterbi-style dynamic programming that finds the globally optimal (string, fret) path.
**Reason:** The greedy algorithm produces unnecessary string/fret jumps. DP with O(N×K²) complexity is trivial for our domain (K ≤ 5) and produces genuinely smoother fingerings. The original greedy selector is preserved as a fallback.

---

## 2025-06-08 — Separated intrinsic and transition scoring

**Decision:** Split the position scoring model into `intrinsicScore()` (position merit independent of context) and `transitionScore()` (cost of moving between two positions).
**Reason:** Cleaner architecture. Both the greedy and DP algorithms share the same scoring weights. Easier to tune: adjust intrinsic weights for note-level preferences, transition weights for movement smoothness.

---

## 2025-06-08 — Standard music-theory key signatures for modal tunes

**Decision:** Use standard music-theory key-signature mappings for dorian and mixolydian modes (e.g., Ador = 1 sharp, Amix = 2 sharps).
**Reason:** Matches the key signature that abcjs would render. Consistent with how most ABC tools interpret these mode declarations. Some Irish trad ABC collections use non-standard key signatures for modal tunes, but standard theory is the safest default.

---

## 2025-06-08 — Explicit tuning pitch tables

**Decision:** Hardcode exact MIDI pitches for each known tuning rather than inferring octaves from notation position.
**Reason:** Banjo tuning notation (e.g., "aDADE") does not encode octave for each string unambiguously. Position-based heuristics fail for the 2nd string (B3 in Open G, D4 in Double D). Explicit pitch tables are correct and maintenance is trivial for 3 tunings.
