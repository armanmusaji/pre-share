import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, savedPatch, validate, apply, restore, quotes, classifications, sourcePassages } from './model.js';
const conditional = s => savedPatch(s, 'Conditional', true);
test('all six classification transitions preserve unrelated items, owners, links, and quotes', () => {
  const sources = JSON.stringify(quotes);
  for (const from of classifications) for (const to of classifications) {
    if (from === to) continue;
    let s = initial();
    if (from !== 'Decided') s = apply(s, savedPatch(s, from, from === 'Conditional'), from, from === 'Conditional');
    const next = apply(s, savedPatch(s, to, to === 'Conditional'), to, to === 'Conditional');
    assert.deepEqual(next.items.filter(i => !i.claims.includes('launch')), s.items.filter(i => !i.claims.includes('launch')));
    next.items.forEach((i,n) => { assert.deepEqual(i.claims,s.items[n].claims); assert.deepEqual(i.sources,s.items[n].sources); assert.equal(i.owner,s.items[n].owner); });
    assert.equal(next.classification,to);
  }
  assert.equal(JSON.stringify(quotes),sources);
});
test('conditional repair changes meaning and holds downstream execution',()=>{
  const s=initial(), n=apply(s,conditional(s),'Conditional',true);
  assert.match(n.items[0].text,/if the copy review/);
  assert.deepEqual(n.items.filter(i=>i.kind==='task').map(i=>i.state),['Needs review','Waiting','Open','Ready']);
});
test('whole patch rejected if unrelated task changes, with no mutation',()=>{
  const s=initial(), before=structuredClone(s), p=conditional(s);
  p.edits.push({id:'task-research',text:'Delay notes',state:'Waiting'});
  assert.match(validate(s,p,'Conditional',true).reason,/not linked/);
  assert.throws(()=>apply(s,p,'Conditional',true)); assert.deepEqual(s,before);
});
for (const [name,mutate] of [
  ['missing item', p=>p.edits.pop()], ['duplicate item',p=>p.edits[1]={...p.edits[0]}],
  ['protected field',p=>p.edits[0].sources=[]],['invalid status',p=>p.edits[1].state='Done'],
  ['empty text',p=>p.edits[0].text=' '],['oversized text',p=>p.edits[0].text='x'.repeat(241)],
  ['changed classification',p=>p.classification='Open'],['missing condition',p=>p.condition=false],
  ['extra top-level field',p=>p.transcript='changed'],['invalid edits',p=>p.edits=null],
]) test(`rejects ${name}`,()=>{const s=initial(),p=conditional(s);mutate(p);assert.equal(validate(s,p,'Conditional',true).ok,false);});
test('rejects malformed response',()=>{for(const p of [null,[],{},'text'])assert.equal(validate(initial(),p,'Conditional',true).ok,false);});
test('preview leaves accepted state unchanged; undo restores content with a new version',()=>{
  const s=initial(),before=structuredClone(s),p=conditional(s);assert.deepEqual(s,before);
  const n=apply(s,p,'Conditional',true),undone=restore(n,s);
  assert.deepEqual({...undone,version:0},s);assert.equal(undone.version,2);
  assert.equal(validate(undone,p,'Conditional',true).ok,false);
});
test('late responses cannot apply after another accept or reset',()=>{
  const s=initial(),p=conditional(s),n=apply(s,p,'Conditional',true);
  assert.throws(()=>apply(n,p,'Conditional',true),/older version/);
  assert.throws(()=>apply(restore(n,initial()),p,'Conditional',true),/older version/);
});

test('saved repairs follow item IDs even when display order changes',()=>{
  const s=initial();s.items.reverse();const next=apply(s,conditional(s),'Conditional',true);
  assert.equal(next.items.find(i=>i.id==='task-announcement').state,'Waiting');
  assert.equal(next.items.find(i=>i.id==='recap-launch').text,'Friday is possible if the copy review is finished.');
});
test('reselecting the saved classification cannot change anything',()=>{
  const s=initial(), p=savedPatch(s,'Decided',false);assert.throws(()=>apply(s,p,'Decided',false),/already saved/);
});

test('expanded recap has valid source references and only four launch-dependent items',()=>{
  const s=initial(), ids=new Set(quotes.map(q=>q.id));
  assert.equal(ids.size,quotes.length);
  for(const item of s.items) for(const id of item.sources) assert.ok(ids.has(id),id);
  assert.equal(s.items.filter(i=>i.claims.includes('launch')).length,4);
  const next=apply(s,conditional(s),'Conditional',true);
  for(const id of ['recap-context','recap-feedback','recap-research']) assert.deepEqual(next.items.find(i=>i.id===id),s.items.find(i=>i.id===id));
});

test('every repaired task cites its work and condition, without changing stored sources', () => {
  const start = initial();
  for (const classification of ['Conditional', 'Open']) {
    const repaired = apply(start, savedPatch(start, classification, classification === 'Conditional'), classification, classification === 'Conditional');
    const before = structuredClone(repaired);
    for (const id of ['task-launch', 'task-announcement', 'task-checklist']) {
      const task = repaired.items.find(i => i.id === id);
      assert.deepEqual(new Set(sourcePassages(repaired, task)), new Set(['q-work', 'q-launch']));
    }
    const research = repaired.items.find(i => i.id === 'task-research');
    assert.deepEqual(sourcePassages(repaired, research), ['q-research']);
    assert.deepEqual(repaired, before);
    const undone = restore(repaired, start);
    assert.deepEqual(sourcePassages(undone, undone.items.find(i => i.id === 'task-announcement')), ['q-work']);
  }
});
