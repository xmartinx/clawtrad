# Data and Rights — ClawTrad

## Data Policy for v0.1

### What We Store

- **Nothing server-side.** There is no backend.
- All user-pasted ABC stays in the browser tab. Close the tab, it's gone.
- No cookies, no localStorage, no analytics, no tracking.

### User-Pasted ABC

- The user is responsible for the ABC they paste.
- ClawTrad does not validate the copyright status of pasted ABC.
- Users should only paste tunes they have the right to use (their own compositions, public domain tunes, or tunes shared with permission).

### No Scraping

- ClawTrad does not and will not scrape tune websites.
- There are no crawlers, no API integrations with tune databases.
- The product does not come with any bundled tune data.

### The Session Integration (Deferred)

The Session (thesession.org) is the leading online community for Irish traditional music. Integration with The Session is planned for a future version but requires:

1. Review of The Session's API terms of use
2. Clarification of attribution and licensing requirements
3. Permission from The Session maintainers if required
4. Compliance with any data-use restrictions

Until these are resolved, ClawTrad will not import, cache, or link to tunes from The Session.

### No Bundled Tune Databases

- ClawTrad does not include any ABC tune collections.
- Third-party ABC collections have diverse and often unclear licensing.
- If tune databases are added in future, each will be reviewed for licence compatibility before inclusion.

### Generated Arrangements

- Generated tab arrangements are derived works based on user-provided ABC.
- When the user provides a source (e.g., tune title, composer), the generated tab cites it.
- ClawTrad does not claim copyright over generated arrangements.
- Users are responsible for how they use generated arrangements.

### Data Processing

- All processing happens locally in the browser using JavaScript/TypeScript.
- No data is sent to any server.
- The abcjs library loads from npm at build time and runs in the browser at runtime.

### Manual Testing

A manual QA workflow is documented at `docs/manual_abc_qa.md`. The `manual-test-inputs/` folder is gitignored so private test ABC files can be stored locally without risk of committing third-party content.

### Compliance Summary

| Concern | v0.2.2 Stance |
|---------|---------------|
| Server-side storage | None |
| User tracking | None |
| Scraping | Not done |
| Tune database bundling | Not done |
| The Session import | Deferred |
| Copyright over arrangements | Not claimed |
| User responsibility | Users control what they paste |
| Manual ABC test files | Gitignored; not committed |
