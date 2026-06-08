# Roadmap — ClawTrad

## v0.1 — Paste ABC to Basic Tab ✅ (current)

- [x] Vite React TypeScript scaffold
- [x] Three tunings: Open G, Double D, Sawmill A
- [x] Limited ABC parser (monophonic, 4/4, keys D/G/A/Em)
- [x] Melody-to-tab position selection with scoring
- [x] Melody-only mode
- [x] Basic clawhammer mode (simple drone on strong beats)
- [x] Plain-text tab output
- [x] Standard notation preview via abcjs
- [x] Warning panel for unsupported ABC features
- [x] Unit tests for core engine
- [x] Full project documentation

## v0.2 — Better Rendering, Export, Tuning Recommendation

- SVG or HTML canvas tab rendering
- PDF export of tab
- Copy-to-clipboard for plain text tab
- Tuning recommendation based on tune key/range
- Improved drone placement (off-beat drones, simple patterns)
- Better position selection (look-ahead, not just greedy)
- Support for 6/8 (jig rhythm awareness, even if drone logic is basic)
- Handle more ABC features (grace notes as warnings, not breakage)

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
