export const classifications = ['Decided', 'Conditional', 'Open'];
export const quotes = Object.freeze([
  { id: 'q-launch', speaker: 'Maya', time: '08:42', text: 'Friday is possible if the copy review is finished.' },
  { id: 'q-work', speaker: 'Sam', time: '08:49', text: 'I will coordinate the launch, send the announcement once we confirm it, and keep the launch checklist open until the copy review is done.' },
  { id: 'q-research', speaker: 'Jules', time: '09:06', text: 'I will share the research notes with the team. That can happen independently of the launch.' },
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
