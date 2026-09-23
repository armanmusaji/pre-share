export const classifications = ['Decided', 'Conditional', 'Open'];
export const quotes = Object.freeze([
  { id: 'q-purpose', speaker: 'Maya', time: '00:18', text: 'Today we need to review whether saved views is ready to launch. People will be able to save their filters instead of rebuilding the same support queue every morning.' },
  { id: 'q-ready', speaker: 'Sam', time: '01:12', text: 'The save and rename flows are implemented in the test environment. We walked through those yesterday. The feature itself is ready for the launch review.' },
  { id: 'q-feedback', speaker: 'Jules', time: '02:24', text: 'In the sessions, people understood saving a view. The confusing part was whether a saved view was private or visible to the team. That distinction needs to be clearer in the copy.' },
  { id: 'q-copy', speaker: 'Maya', time: '03:40', text: 'Let’s keep the scope to saved views. The current copy still needs a review, especially the visibility labels and the announcement. We have not signed that off.' },
  { id: 'q-announcement', speaker: 'Sam', time: '04:32', text: 'The announcement is drafted. I do not want to send it and then have to explain a different set of labels when people open the product.' },
  { id: 'q-question', speaker: 'Jules', time: '05:16', text: 'Are we committing to Friday now, or is that still the date we are aiming for?' },
  { id: 'q-wait', speaker: 'Maya', time: '06:03', text: 'It is the target. We need to see the finished copy before treating the date as confirmed.' },
  { id: 'q-plan', speaker: 'Sam', time: '07:21', text: 'Then the announcement and checklist need to follow that confirmation. I can coordinate those rather than treating them as separate launch decisions.' },
  { id: 'q-launch', speaker: 'Maya', time: '08:42', text: 'Friday is possible if the copy review is finished.' },
  { id: 'q-work', speaker: 'Sam', time: '08:49', text: 'I will coordinate the launch, send the announcement once we confirm it, and keep the launch checklist open until the copy review is done.' },
  { id: 'q-research', speaker: 'Jules', time: '09:06', text: 'I will share the research notes with the team. That can happen independently of the launch.' },
  { id: 'q-close', speaker: 'Maya', time: '09:38', text: 'That gives us a way forward. Keep the visibility feedback with the copy review so we do not lose the reason for those wording changes.' },
]);
const item = (id, kind, text, state, claims, sources, owner = null) => ({ id, kind, text, state, claims, sources, owner });
export function initial() {
  return { version: 0, classification: 'Decided', condition: false, items: [
    item('recap-launch', 'recap', 'Launch Friday', null, ['launch'], ['q-launch']),
    item('recap-owner', 'recap', 'Sam coordinates the launch and follow-through.', null, ['work'], ['q-work']),
    item('task-launch', 'task', 'Launch Friday', 'Ready', ['launch'], ['q-launch', 'q-work'], 'Sam'),
    item('task-announcement', 'task', 'Send the launch announcement', 'Ready', ['launch'], ['q-work'], 'Sam'),
    item('task-checklist', 'task', 'Close the launch checklist', 'Ready', ['launch'], ['q-work'], 'Sam'),
    item('task-research', 'task', 'Share the research notes', 'Ready', ['research'], ['q-research'], 'Jules'),
    item('recap-context', 'recap', 'Saved views lets support teams save their filters instead of rebuilding a queue each morning. The save and rename flows are implemented in the test environment and ready for launch review.', null, ['feature'], ['q-purpose', 'q-ready']),
    item('recap-feedback', 'recap', 'Research participants understood saving a view, but the distinction between private and team-visible views was unclear. The visibility labels and launch announcement still need a copy review.', null, ['feedback', 'copy'], ['q-feedback', 'q-copy', 'q-announcement']),
    item('recap-research', 'recap', 'Jules will share the research notes independently of the launch. The visibility feedback should stay with the copy review to explain the wording changes.', null, ['research'], ['q-research', 'q-close']),
  ] };
}
export const linked = snapshot => snapshot.items.filter(i => i.claims.includes('launch'));
const repairIds = ['recap-launch', 'task-launch', 'task-announcement', 'task-checklist'];
const repairs = {
  Decided: [['Launch Friday', null], ['Launch Friday', 'Ready'], ['Send the launch announcement', 'Ready'], ['Close the launch checklist', 'Ready']],
  Conditional: [['Friday is possible if the copy review is finished.', null], ['Confirm the copy review before confirming Friday', 'Needs review'], ['Wait for launch confirmation before sending the announcement', 'Waiting'], ['Keep the launch checklist open until the copy review is finished', 'Open']],
  Open: [['The launch date is open; Friday is a possibility, not a commitment.', null], ['Resolve the launch decision after reviewing the copy', 'Needs decision'], ['Hold the announcement until the launch is confirmed', 'Waiting'], ['Keep the launch checklist open while the copy review and launch decision are unresolved', 'Open']],
};
export function savedPatch(snapshot, classification, condition) {
  if (!classifications.includes(classification)) throw new Error('Unknown classification.');
  return { baseVersion: snapshot.version, classification, condition, edits: linked(snapshot).map(i => { const values = repairs[classification][repairIds.indexOf(i.id)]; return { id: i.id, text: values[0], state: values[1] }; }) };
}
const exactKeys = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === keys.length && keys.every(k => Object.hasOwn(obj, k));
export function validate(snapshot, candidate, requested, confirmed) {
  const fail = reason => ({ ok: false, reason });
  if (!exactKeys(candidate, ['baseVersion', 'classification', 'condition', 'edits'])) return fail('The response changed the document structure.');
  if (candidate.baseVersion !== snapshot.version) return fail('This response belongs to an older version. Request a new preview.');
  if (requested === snapshot.classification) return fail('This classification is already saved. Nothing needs to change.');
  if (candidate.classification !== requested || !classifications.includes(requested)) return fail('The response did not preserve your classification.');
  if (candidate.condition !== confirmed || (requested === 'Conditional' && confirmed !== true) || (requested !== 'Conditional' && confirmed !== false)) return fail('The source condition must match your selection.');
  if (!Array.isArray(candidate.edits)) return fail('The response did not contain a list of changes.');
  const allowed = new Map(linked(snapshot).map(i => [i.id, i]));
  const seen = new Set();
  for (const edit of candidate.edits) {
    if (!exactKeys(edit, ['id', 'text', 'state'])) return fail('A change tried to alter a protected field.');
    if (!allowed.has(edit.id)) return fail(`${snapshot.items.find(i => i.id === edit.id)?.text || String(edit.id).slice(0, 100)} is not linked to the launch claim. It cannot change.`);
    if (seen.has(edit.id)) return fail('The response changed the same item twice.');
    seen.add(edit.id);
    if (typeof edit.text !== 'string' || !edit.text.trim() || edit.text.length > 240 || /[\u0000-\u001f\u007f]/u.test(edit.text)) return fail('A change contains missing, oversized, or invalid text.');
    if (allowed.get(edit.id).kind === 'recap' ? edit.state !== null : !['Ready', 'Needs review', 'Needs decision', 'Waiting', 'Open'].includes(edit.state)) return fail('A change contains an unsupported task status.');
  }
  if (seen.size !== allowed.size) return fail('The response left out linked work. Nothing has been applied.');
  return { ok: true };
}
export function apply(snapshot, candidate, requested, confirmed) {
  const check = validate(snapshot, candidate, requested, confirmed);
  if (!check.ok) throw new Error(check.reason);
  return { version: snapshot.version + 1, classification: requested, condition: confirmed, items: snapshot.items.map(i => {
    const edit = candidate.edits.find(e => e.id === i.id);
    return edit ? { ...i, text: edit.text, state: edit.state } : { ...i };
  }) };
}
export const restore = (current, previous) => ({ ...structuredClone(previous), version: current.version + 1 });
