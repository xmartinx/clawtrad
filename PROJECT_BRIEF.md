# Project Brief — ClawTrad

## Product Vision

ClawTrad is a web application (future PWA) that helps Irish traditional musicians who play clawhammer banjo generate playable tab arrangements from ABC notation.

The core promise: **"Turn Irish ABC notation into playable clawhammer banjo tab."**

Softer wording: **"Paste an Irish tune. Choose a tuning. Get a clawhammer tab starting point."**

## Target Users

- Irish traditional musicians who play 5-string clawhammer banjo
- Players looking for a starting point arrangement, not a definitive transcription
- Musicians comfortable with ABC notation (the standard for sharing Irish tunes online)
- Beginner-to-intermediate clawhammer players exploring Irish repertoire

## Main Problem Solved

There is no existing tool that converts Irish ABC notation into clawhammer-specific banjo tab. Existing ABC tools produce standard notation or generic tab. Clawhammer players currently transcribe tunes by hand.

ClawTrad automates the first pass of this process. It does not replace musical judgment — it provides a playable starting point that a musician can refine.

## Non-Goals

- We do not claim to produce perfect or definitive arrangements
- We do not scrape tune websites or import copyrighted tune collections
- We do not bundle tune databases without licence review
- We do not support audio playback or transcription
- We do not attempt full ornamentation (rolls, cuts, triplets) in v0.1
- We do not have a backend or user accounts in v0.1

## Success Criteria for v0.1

1. User can paste valid ABC notation for a simple reel
2. ABC renders as standard notation in the preview panel
3. User can select from three clawhammer banjo tunings (Open G, Double D, Sawmill A)
4. User can select melody-only or basic clawhammer output mode
5. A plain-text 5-string banjo tab is generated
6. The generated tab is a playable melody mapping (correct pitches, reasonable positions)
7. Warnings are shown when the ABC is unsupported or parsing is incomplete
8. All unit tests pass
9. The project is documented and handoff-ready
