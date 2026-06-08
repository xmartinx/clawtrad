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

## 2025-06-08 — v0.2: SVG/HTML visual tab renderer with internal TabDocument model

**Decision:** Use SVG/HTML for the v0.2 visual tab renderer, backed by a pure-data TabDocument model, rather than Canvas.
**Reason:** SVG/HTML is easier to inspect, test, print, scale, and later export to PDF. Canvas remains deferred until there is a demonstrated need (e.g., performance with very large scores). The TabDocument model decouples arrangement data from presentation, supporting multiple renderers (SVG, plain text, future PDF).

---

## 2025-06-08 — TabDocument as pure data model

**Decision:** Introduce `src/music/tab/` with types (`tabLayoutTypes.ts`) and a builder (`buildTabDocument.ts`) that convert arrangement output into a renderer-agnostic document.
**Reason:** Clean separation of concerns. The arrangement engine produces (string, fret) positions; the TabDocument adds rhythmic structure (rests, barlines, measure grouping) needed for visual rendering. Both the SVG component and plain-text renderer can consume the same model.

---

## 2025-06-08 — v0.2.2: Real-world ABC paste tolerance before jig/drop-thumb support

**Decision:** Prioritise ABC parser tolerance (comments, missing headers, unsupported features) before expanding musical scope to jigs or drop-thumb.
**Reason:** Users will paste ABC from varied sources. A forgiving parser with clear, deduplicated warnings is required before investing in new musical features. Crashing or producing confusing output on real-world ABC undermines trust in the tool.

---

## 2025-06-08 — Warning deduplication and specific messaging

**Decision:** Deduplicate parser warnings and use specific, user-actionable messages rather than generic technical descriptions.
**Reason:** Multiple instances of the same unsupported feature (e.g., 5 chord symbols) should produce one clear warning, not 5 duplicates. Messages should tell the user what was ignored and why, not just state a technical fact ("Chord symbols were ignored: tab is generated from melody only." not "Chord annotations are not supported – skipped").

---

## 2025-06-08 — v0.2.3: Align visual tab with banjo engraving conventions

**Decision:** Add target-style visual elements (measure numbers, time signature, "x" for skipped notes, rhythm stems, chord labels) before adding new musical features like jigs or drop-thumb.
**Reason:** The product's usefulness depends on players recognising the output as readable banjo tab. Visual conventions are more important at this stage than expanding musical scope. Skipped notes as "x" on the expected string follows common tab practice. Chord labels are display-only — they do not affect the arrangement.

---

## 2025-06-08 — Chord labels as display-only annotations

**Decision:** Capture chord symbols from quoted ABC annotations (e.g., `"D"`, `"Em"`) and render them above notes in the visual tab, but do not use them in arrangement.
**Reason:** Chord symbols provide useful context for players but should not influence the melody-to-tab mapping in v0.2.3. The arrangement engine is melody-only. Chords are purely decorative at this stage.

---

## 2025-06-08 — v0.2.4: 5th string is drone-only; melody uses strings 1–4 only

**Decision:** The 5th string is treated as a drone-only open string. `findPositions()` excludes it from melody candidates entirely. Only `findDronePosition()` may return a 5th-string position, and only at fret 0.
**Reason:** Using the 5th string for fretted melody notes is not idiomatic clawhammer banjo. The 5th string is a high drone, physically short, and not intended for melody. Banning it from melody candidates eliminates unplayable/unnatural tab output.

---

## 2025-06-08 — v0.2.4: Expanded fret limits and octave-lower melody placement

**Decision:** Allow frets 0–10 on strings 1–2, frets 0–7 on strings 3–4. Additionally, generate octave-lower (pitch − 12) candidates for each note so the DP can choose better middle-string placement.
**Reason:** Restricting to fret 7 globally pushed melody too high on string 1. Allowing frets 8–10 on the top strings, combined with octave-lower options, lets the DP find natural middle-string (2–4) placements that are more playable and readable.

---

## 2025-06-08 — v0.2.7: Drone fill only in empty offbeat slots

**Decision:** Automatic 5th-string drones fill only empty offbeat slots. They are not inserted when a melody note occupies the offbeat.
**Reason:** For quarter-note melody (D2 E2 F2 G2), drones in slots 1,3,5,7 are idiomatic clawhammer. For full eighth-note melodies, inserting drones would displace melody notes — use drop-thumb or same-string H/P/Sl instead.

---

## 2025-06-08 — v0.2.7: Conservative drop-thumb and same-string technique preference

**Decision:** Thumb never plays string 1, never plays fretted 5th, and may drop to adjacent inner string (N+1) only. Second melody notes in a beat pair prefer same-string H/P/Sl over impossible thumb assignments.
**Reason:** User QA showed implausible thumb assignments (thumb on open 1st string for c→d). Same-string technique candidates (0→2 hammer-on, 1→3 slide) are more idiomatic and playable.

---

## 2025-06-08 — v0.2.4: Visual correctness before feature expansion

**Decision:** Prioritise visual tab corrections (string mapping, drone line, beam groups, clean header) over new musical features in v0.2.4.
**Reason:** User QA identified that the visual output did not match common clawhammer tab conventions. Correcting the rendering is a prerequisite for further manual testing and feature development.

---

## 2025-06-08 — v0.2.1: Visual tab wrapping and copy-to-clipboard before new musical features

**Decision:** Prioritise visual tab usability (line wrapping, copy-to-clipboard, print styling) before expanding musical scope to jigs, drop-thumb, or ornamentation.
**Reason:** Real pasted Irish tunes are longer than test phrases and produce very wide unwrapped SVG output. A usable multi-system tab display with copy/export basics is a prerequisite for testing with real-world ABC input. Musical features should not outpace the rendering infrastructure.

---

## 2025-06-08 — Layout calculator as pure functions

**Decision:** Implement tab line-wrapping via a pure-function layout calculator (`src/music/tab/tabLayout.ts`) rather than inline in the React component.
**Reason:** Pure functions are trivially testable without React or DOM. The layout logic (measure placement, system wrapping, event positioning) is deterministic and can be verified with simple assertions. This keeps the React component thin (rendering only) and the core layout logic reusable across renderers.

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
