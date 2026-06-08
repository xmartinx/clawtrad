# Manual ABC QA — ClawTrad

This document describes how to manually test pasted ABC notation in ClawTrad.

## Running the App

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`).

## Pasting ABC Safely

- Paste ABC into the text area and click **Generate Tab**.
- ClawTrad does NOT send your ABC anywhere — all processing is local.
- Close the browser tab to clear all data.

**⚠ Do not commit real third-party ABC files to the repository** unless the source and licence have been explicitly cleared. The `manual-test-inputs/` folder is gitignored for private manual testing.

## QA Checklist

For each test tune pasted:

- [ ] **Standard notation** renders in the preview panel
- [ ] **Visual tab** (SVG) renders with correct string labels
- [ ] **Visual tab** has correct fret numbers
- [ ] **Measures / barlines** appear correctly
- [ ] **Rests** show as "z" markers
- [ ] **Line wrapping** works for long tunes (multiple systems)
- [ ] **Warnings** are clear and understandable
- [ ] **No crash** — the app stays responsive
- [ ] **Plain text tab** can be copied to clipboard
- [ ] **Copy button** shows "Copied!" feedback
- [ ] **Key / tuning / mode** diagnostic bar is accurate
- [ ] Page remains responsive after multiple Generate clicks

## Unsupported Features: Expected Behaviour

| Feature | Expected Behaviour |
|---------|-------------------|
| Chord symbols `"D"` `"G"` | Warning: "Chord symbols were ignored" |
| Grace notes `{abc}` | Warning: "Grace notes were ignored" |
| Decorations `!trill!` `+roll+` | Warning: "Decorations were ignored" |
| Tuplets `(3abc` | Warning: "Tuplets were detected but simplified" |
| Broken rhythm `<` `>` | Warning: "Broken rhythm markers were detected but simplified" |
| First/second endings `[1` `[2` | Ignored silently |
| Repeated sections `|:` `:|` `::` | Ignored (repeats not expanded) |
| Multiple voices `V:` | Warning: "Multiple voices were detected" |
| Missing key signature | Warning: "Missing key signature; assuming C" |
| Missing meter | Warning: "Missing meter; assuming 4/4" |
| Missing note length | Warning: "Missing default note length; assuming 1/8" |
| Comments `% ...` | Ignored silently |

## Test Result Template

| Date | Tester | ABC Source | Key | Tuning | Visual Tab OK? | Warnings Clear? | Copy OK? | Notes |
|------|--------|-----------|-----|--------|----------------|-----------------|----------|-------|
| | | | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

## Known Limitations (v0.2.2)

- Only monophonic melody — chords produce a warning but only the first note in a chord bracket would be used
- Only frets 0–7 — notes requiring higher frets are skipped
- Repeats, endings, D.C./D.S. are not interpreted
- No ornamentation rendering
- No audio playback
- SVG tab is a basic visualisation, not professional engraving
