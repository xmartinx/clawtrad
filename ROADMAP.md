# Roadmap — ClawTrad

## v0.1 — Paste ABC to Basic Tab ✅

- [x] Vite React TypeScript scaffold
- [x] Three tunings: Open G, Double D, Sawmill A
- [x] Limited ABC parser (monophonic, 4/4, keys D/G/A/Em)
- [x] Melody-to-tab position selection with scoring
- [x] Melody-only mode
- [x] Basic clawhammer mode (simple drone on strong beats)
- [x] Plain-text tab output
- [x] Standard notation preview via abcjs
- [x] Warning panel for unsupported ABC features
- [x] Unit tests for core engine (54 tests)
- [x] Full project documentation

## v0.1.1 — Arrangement Engine Reliability Pass ✅ (current)

- [x] Proper accidental support (^ = _ and their double forms)
- [x] Key signature expansion (Ador, Edor, Amix, Dmix, Ddor, Am, Em, Bm, Dm)
- [x] Better octave handling (case + markers, tested)
- [x] Dynamic-programming global-path arrangement (replaces greedy)
- [x] Separated intrinsic/transition scoring model
- [x] Improved warnings for unsupported ABC features
- [x] Diagnostic summary (note count, skipped count, tuning, mode, unplayable)
- [x] Comprehensive tests (124 tests, 7 test files)

## v0.2 — Rhythmic Tab Rendering Foundation ✅

- [x] TabDocument internal data model
- [x] SVG visual tab renderer (5 lines, fret numbers, rests, barlines, drones, labels)
- [x] Rhythm events in parser (notes + rests + barlines)
- [x] Rest preservation in tab output
- [x] Plain text tab kept as fallback
- [x] Fix clawhammer drone mutation bug

## v0.2.1 — Visual Tab Usability Pass ✅

- [x] SVG tab line-wrapping (multi-system layout)
- [x] Copy-to-clipboard for plain text tab
- [x] Print-friendly CSS styling
- [x] Layout calculator (pure functions, testable)

## v0.2.2 — Real-World ABC Compatibility Pass ✅

- [x] Tolerate comments (%), line continuations, blank lines
- [x] Handle missing K:/M:/L: with fallbacks and warnings
- [x] Support all common ABC headers
- [x] Multiple T: lines preserved
- [x] Ignore slurs/ties, first/second endings, +decorations+
- [x] Deduplicated, specific warning messages
- [x] ParseDiagnostics with feature detection
- [x] Manual QA documentation

## v0.2.21 — Current (parked) ✅

- [x] Per-measure stem grouping (fixes querySelectorAll=0)
- [x] Stems 3-way queryable (data-testid, class, data-attr)
- [x] Stem penetration 6px past beam bottom
- [x] Time signature font 22px, stacked on 2nd/4th string lines
- [x] Beat-pair beaming, drone fill, measure numbers, final barline
- [x] 331 tests, 19 files

## v0.2.3 — Banjo Tab Engraving Style Pass ✅

- [x] Measure numbers at start of each system
- [x] Time signature at first system
- [x] Skipped notes shown as "x" on expected string
- [x] Rhythm stems below tab (with beam flag for short notes)
- [x] Chord labels captured from quoted ABC, rendered above notes
- [x] Chord labels are display-only (do not affect arrangement)
- [x] Tab style reference documentation (`docs/tab_style_reference.md`)
- [ ] PDF export of tab
- [ ] Tuning recommendation based on tune key/range
- [ ] Improved drone placement (off-beat drones, simple patterns)
- [ ] Support for 6/8 (jig rhythm awareness, even if drone logic is basic)

## v0.3 — Jigs, Drop-Thumb, Editable Tab

- Full jig support (6/8, 9/8, 12/8)
- Drop-thumb mode (right-hand pattern modeling)
- Editable tab (click to change string/fret, see alternatives)
- Alternate position suggestions per note
- Better drone patterns for jig rhythms
- Simple undo/redo in tab editor

## Later Versions

- **The Session integration** (with permission and API terms clarity)
- **Saved tune library** (localStorage or optional cloud sync)
- **PWA install** (offline support, service worker)
- **Android wrapper** (Capacitor or TWA)
- **Audio preview** (Web Audio API synthesis of banjo-like tones)
- **MIDI export**
- **TablEdit / TEF export**
- **Custom tunings** (user-defined)
- **Capo support**
- **Multi-voice ABC** (harmony lines, counter-melody)
- **Style presets** (Round Peak, melodic clawhammer, etc.)
- **Community sharing** (with clear rights and attribution)

## Non-Roadmap (Things We Won't Do)

- Scrape tune websites or distribute copyrighted tune data
- Add paid API dependencies
- Add mandatory user accounts for basic use
- Claim to produce definitive or professional arrangements
- Support non-banjo instruments (this is a banjo tool)
