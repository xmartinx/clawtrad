# ClawTrad — Project Parking Handoff

**Date parked:** 2025-06-10
**Parked by:** Claude Code session (ClawTrad development)

---

## Current State

| Field | Value |
|-------|-------|
| Version | v0.2.21 |
| Commit | `ec96764` — fix: expose real stem elements and space meter |
| Branch | `master` |
| Repo | `https://github.com/xmartinx/clawtrad.git` |
| Root | `D:\Appbuilds\ClawTrad` |
| Tests | 331 passed (19 files) |
| TypeScript | clean |
| Build | succeeds (718 KB) |
| Pushed to GitHub | yes |

## Resuming — Exact Commands

```powershell
cd D:\Appbuilds\ClawTrad
git log -1 --oneline
git status
npm install          # if node_modules missing
npm run dev -- --force
```

Then hard refresh browser with **Ctrl+Shift+R**.

## Browser DevTools QA Checks

Paste into browser console after generating tab:

```js
document.querySelectorAll('[data-testid="tab-beam"]').length
document.querySelectorAll('[data-testid="tab-stem"]').length
document.querySelectorAll('.tab-stem').length
document.querySelectorAll('[data-clawtrad-stem="true"]').length
document.querySelectorAll('[data-testid="tab-time-signature"]').length
document.querySelectorAll('[data-testid="tab-final-barline"]').length
document.querySelector('[data-testid="visual-tab-svg"]')?.dataset
```

All three stem queries (`[data-testid="tab-stem"]`, `.tab-stem`, `[data-clawtrad-stem="true"]`) must return the same positive count.

## Manual QA Test ABCs

### 1. Quarter Beat Drone Fill

```
X:1
T:Quarter Beat Drone Fill Test
M:4/4
L:1/8
K:G
D2 E2 F2 G2 | A2 B2 c2 d2 |
```

Expected: 8 beams, 16 stems, 4 beat-pairs per measure, melody+drone pairs, large stacked 4/4 time sig, final barline.

### 2. Full Quaver Melody

```
X:2
T:Full Quaver Melody Test
M:4/4
L:1/8
K:G
D E F G A B c d | d c B A G F E D |
```

Expected: 8 beams, 16 stems, no drones, c d = 2nd string 1→3, large stacked 4/4.

### 3. C Natural vs C Sharp

```
X:3
T:C Natural vs C Sharp Test
M:2/4
L:1/8
K:G
c d c d | ^c d =c d |
```

Expected: 4 beams, 8 stems, large stacked 2/4, c=fret1, ^c=fret2, =c=fret1, final barline.

### 4. 6/8 Smoke Test

```
X:4
T:Six Eight Meter Visual Test
M:6/8
L:1/8
K:G
D E F G A B |
```

Expected: no crash, large stacked 6/8, final barline. Not full jig support.

## Known Limitations (v0.2.21)

1. **H/P/Sl labels** not rendered in SVG (hammer-on, pull-off, slide)
2. **Rest symbols** are Unicode 𝄽, not proper SVG glyphs
3. **Drop-thumb** reach rules modelled but not fully applied in arrangement
4. **Monophonic only** — no chords, no multi-voice
5. **Drone logic** is primarily 4/4-oriented
6. **Post-time-signature horizontal padding** not yet implemented — user asked for ~2× current padding before first note after time signature
7. **Time signature font** is 22px; user said numerals could be slightly larger
8. **Older reference screenshots** may have expired; ask user to re-upload if visual comparison needed

## Engraving Decisions (User-Approved)

- Basic Clawhammer is the **default mode**
- Plain-text tab fallback **removed from visible UI**
- "Drones on strong beats" wording is **wrong** — removed/corrected
- Drones are **offbeat thumb-position fills** where space allows
- 5th-string drone 0s are **normal tab fret glyphs** — same size/weight as other fret numbers
- Time signature: **large stacked numbers**, ~2× measure-number size
- Top time-sig number centred on **2nd string line**
- Bottom time-sig number centred on **4th string line**
- Time signature overlays the staff, just right of string-line start
- Measure numbers: **small, above measure starts**
- Final bar of tune closes with a **visible barline**
- Beams match stems/barlines in colour (`currentColor`)
- Beams do **not overhang** past paired stems
- Stems visibly **pass through or enter** the beam rectangle
- 5th string is **open-drone-only** for v1
- No fretted 5th-string melody
- No "x" markers in normal output

## Recommended First Task When Resuming

**Verify v0.2.21 browser QA** (stems queryable, stems visible, beams correct). If confirmed, proceed to:

**H/P/Sl label rendering** — render hammer-on (H), pull-off (P), and slide (Sl) labels between paired fret numbers in the SVG tab. The `assignPairRoles()` function in `src/music/arranger/clawhammer.ts` already computes technique candidates. Wire these into `src/components/VisualTab.tsx`.

Alternatively, if stems are still not queryable/visible:
- Investigate the render path discrepancy between jsdom tests and real browser
- Check for stale Vite dev server cache (`rm -rf node_modules/.vite`)
- Verify the `splitMeasureEvents` function in VisualTab is correctly segmenting events

## Rights/Data Posture

- **No scraping** of tune websites
- **No third-party tune collections** bundled or committed
- **No copied real tune ABC** from The Session or other websites
- **No backend**, no user accounts, no paid APIs
- User-pasted ABC only; all processing local in browser
- `manual-test-inputs/` folder is gitignored for private testing
- Do not commit real tune ABC files

## Key Source Files

| Area | File |
|------|------|
| Main app | `src/app/App.tsx` |
| Visual renderer | `src/components/VisualTab.tsx` |
| Beam calculator | `src/music/tab/beamPrimitives.ts` |
| Tab layout | `src/music/tab/tabLayout.ts` |
| Tab document builder | `src/music/tab/buildTabDocument.ts` |
| Rhythm grid | `src/music/tab/clawhammerRhythmGrid.ts` |
| Arrangement engine | `src/music/arranger/arrangeMelody.ts` |
| Position scoring | `src/music/arranger/scoring.ts` |
| Clawhammer drones | `src/music/arranger/clawhammer.ts` |
| Tuning definitions | `src/music/banjo/tunings.ts` |
| Fretboard mapping | `src/music/banjo/fretboard.ts` |
| ABC parser | `src/music/abc/parseAbc.ts` |
| App integration tests | `src/app/__tests__/App.render.test.tsx` |
| VisualTab render tests | `src/components/__tests__/VisualTab.render.test.tsx` |

## Specification Docs

| Doc | Content |
|-----|---------|
| `docs/tab_notation_spec.md` | Tab notation reference |
| `docs/tab_beaming_rules.md` | Beaming rules |
| `docs/clawhammer_arrangement_strategy.md` | Arrangement strategy |
| `docs/tab_style_reference.md` | Visual style reference |
| `docs/manual_abc_qa.md` | Manual QA workflow |
