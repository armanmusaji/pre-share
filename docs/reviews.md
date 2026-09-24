# The reviews

[Back to the prototype](https://pre-share.vercel.app)

**Short version:** Astra built, Claude reviewed at each checkpoint, and Arman made the final call on every finding.

## Concept review
Claude's biggest change: instead of letting anyone rewrite the notes freely, the person picks one of three answers (Confirmed, Conditional, Not decided), and a fix can only touch the items linked to that decision. That made it possible to check whether anything unrelated changed. Claude also recommended keeping live AI in scope with tighter limits, which Arman later cut.

## Build review
Claude used the live prototype on a phone and found three blockers:
1. The notes showed the correct reading of the decision one click away from the wrong one, so the product seemed to know about its own mistake.
2. The meeting transcript spelled out the condition so clearly that the mistake was hard to believe.
3. The part worth seeing sat two or three screens below where people landed.

It also found problems Arman had already caught once before: a mark that looked like a checkbox but did nothing, demo wording inside the product, and wording that gave Sam decisions he never owned.

## Astra pushed back
Astra challenged four of Claude's points, including Claude's claim that no competent AI would miss the condition (not supported) and its assumption that Maya alone owned the decision (the transcript says "we"). Claude accepted all four.

## Recheck
All three blockers were fixed. One new issue: a repaired task's source showed only half of what it depended on. Arman had it fixed before the case study was written.
