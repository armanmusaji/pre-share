# Pre Share

More detail: [research](docs/research.md) · [build history](docs/builds.md) · [reviews](docs/reviews.md) · [decisions](docs/decisions.md) · [checklist](docs/checklist.md)

Self-initiated portfolio experiment by Arman Musaji. Built by GPT Astra; Claude reviews at the gates.

This prototype implements an optional review feature inside a fictional meeting assistant. Review decision factors opens read-only context; Correct this decision starts a separate preview, acceptance, and undo flow. This is a deployed static prototype with authored saved examples only. No live model, outgoing messages, or external data. All meeting content is fictional; the initial error is intentionally seeded.

## Run

`npm install`, then `npm run dev`. `npm test` checks the scoped-patch contract and grouped restoration. `npm run build` builds the static app.

## Boundary

A claim classification controls one recap line and three dependent tasks. A separate owner recap and research task remain unchanged. Source quotes, IDs, links, owners, and item membership are protected. Preview is separate from accepted state. Any malformed or out-of-scope response is rejected as a whole. Undo increments the version to reject old responses. Scope validation cannot establish semantic truth.

The rejection example deliberately appends a change to the unrelated research task. It is labeled in the interface; it is not evidence of a live model failure.

## Shipping scope
Authored examples are the approved final scope, not a temporary substitute awaiting live AI. No API key, server, model calls, or inference charges. Source links open the full fictional transcript at relevant passages. The dependency links are authored; the app does not discover them automatically.

## Verification and release
Run the contract tests and production build, verify the browser flow, deploy the static app, and complete Claude's Gate B critique. Real-user testing is outside this project's scope. No user validation or live-model reliability is claimed; a full screen reader evaluation has not been completed.

## Gate B revision
Decisions and dependent tasks lead the product. Evidence contains verbatim quotes, with one transcript dialog for full and contextual reading. A single selection records Confirmed, Conditional on the copy review, or Not decided. Apply marks changed items and exposes Undo beside Decisions. Cancellation returns to the originating view.

Author controls hold Restart and the rejection test. Rejection is available only for changed Conditional or Not decided selections. No automatic interpretation, error detection, model calls, or assignment of decision authority is implied. The condition flag in the patch contract comes from the Conditional selection, not a separate checkbox.
