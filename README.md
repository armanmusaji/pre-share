# Pre Share

Self-initiated portfolio experiment by Arman Musaji. Built by GPT Astra; Claude reviews at the gates.

This prototype implements an optional review feature inside a fictional meeting assistant. Review Decision Factors opens read-only context; Correct this decision starts a separate preview, acceptance, and undo flow. This is a local working prototype with authored saved examples only. No live model, outgoing messages, or external data. All meeting content is fictional; the initial error is intentionally seeded.

## Run

`npm install`, then `npm run dev`. `npm test` checks the scoped-patch contract and grouped restoration. `npm run build` builds the static app.

## Boundary

A claim classification controls one recap line and three dependent tasks. A separate owner recap and research task remain unchanged. Source quotes, IDs, links, owners, and item membership are protected. Preview is separate from accepted state. Any malformed or out-of-scope response is rejected as a whole. Undo increments the version to reject old responses. Scope validation cannot establish semantic truth.

The rejection example deliberately appends a change to the unrelated research task. It is labeled in the interface; it is not evidence of a live model failure.

## Shipping scope
Authored examples are the approved final scope, not a temporary substitute awaiting live AI. No API key, server, model calls, or inference charges. Source links open the full fictional transcript at relevant passages. The dependency links are authored; the app does not discover them automatically.

## Verification and release
Run the contract tests and production build, verify the browser flow, deploy the static app, and complete Claude's Gate B critique. Real-user testing is outside this project's scope. No user validation or live-model reliability is claimed; a full screen reader evaluation has not been completed.
