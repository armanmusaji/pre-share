import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import './style.css';
import { initial, classifications, quotes, savedPatch, validate, apply, restore, sourcePassages } from './model.js';

const classificationLabel = value => ({Decided:'Confirmed', Conditional:'Conditional', Open:'Not decided'}[value]);
const taskStatus = (state, classification) => ({Ready:'Ready to start', 'Needs review':'Waiting on copy review', 'Needs decision':'Waiting on launch date', Waiting:'Waiting on launch confirmation', Open:classification==='Conditional'?'Waiting on copy review':'Waiting on copy and launch date'}[state]);

function App() {
  const [inspecting, setInspecting] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const inspectorHeading=useRef(null),reviewTrigger=useRef(null),decisionsHeading=useRef(null),correctionOrigin=useRef('notes'),reviewAction=useRef(false);
  const focusDecisions = () => setTimeout(()=>{decisionsHeading.current?.focus();decisionsHeading.current?.scrollIntoView({block:'start'});},0);
  useEffect(()=>{if(inspecting) inspectorHeading.current?.focus();},[inspecting,correcting]);
  const [snapshot, setSnapshot] = useState(initial);
  const [choice, setChoice] = useState('Decided');
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState(null);
  const [rejection, setRejection] = useState(null);
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState('');
  const [source, setSource] = useState(null);
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const dialog = useRef(null), sourceTrigger = useRef(null), heading = useRef(null), previewHeading = useRef(null), rejectHeading = useRef(null);
  const ready = choice !== snapshot.classification && (choice !== 'Conditional' || confirmed);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => {
    if (!source) return;
    dialog.current.showModal();
    const passage = dialog.current.querySelector('.transcript-match');
    const target = passage || dialog.current.querySelector('#source-title');
    target?.focus({preventScroll:true});
    if (passage) passage.scrollIntoView({block:'start'});
    else dialog.current.querySelector('.dialog-transcript').scrollTop = 0;
  }, [source]);
  useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);
  useEffect(() => { if (rejection) rejectHeading.current?.focus(); }, [rejection]);
  function openSource(ids, e) { sourceTrigger.current = e.currentTarget; setSource(ids); }
  function closeSource() { dialog.current.close(); setSource(null); sourceTrigger.current?.focus(); }
  function choose(value) { setChoice(value); setConfirmed(value === 'Conditional'); setPreview(null); setRejection(null); setNotice(''); }
  function request(reject = false) {
    if (!ready || (reject && choice === 'Decided')) return;
    const patch = savedPatch(snapshot, choice, choice === 'Conditional' && confirmed);
    if (reject) patch.edits.push({ id: 'task-research', text: 'Hold the research notes until launch', state: 'Waiting' });
    const check = validate(snapshot, patch, choice, choice === 'Conditional' && confirmed);
    if (!check.ok) { setPreview(null); setRejection({ reason: check.reason, text: 'Hold the research notes until launch', state: 'Waiting' }); setNotice('Response rejected. Your recap and tasks have not changed.'); }
    else { setPreview(patch); setRejection(null); setNotice('Review four linked items before accepting.'); }
  }
  function accept() {
    try {
      const next = apply(snapshot, preview, choice, choice === 'Conditional' && confirmed);
      setHistory(h => [...h, snapshot]); setSnapshot(next); setPreview(null); setRejection(null); setInspecting(false); setCorrecting(false);
      setNotice('Correction accepted. The claim, one recap line, and three tasks changed together. Research notes did not change.'); focusDecisions();
    } catch (error) { setPreview(null); setRejection({ reason: error.message }); }
  }
  function undo() {
    const previous = history.at(-1);
    setInspecting(false); setCorrecting(false); setSnapshot(restore(snapshot, previous)); setHistory(h => h.slice(0, -1)); setChoice(previous.classification); setConfirmed(previous.condition); setPreview(null); setRejection(null); setNotice('Undone. The previous claim, recap, and tasks are restored together.'); focusDecisions();
  }
  function reset() { setInspecting(false); setCorrecting(false); setSnapshot(restore(snapshot, initial())); setHistory([]); setChoice('Decided'); setConfirmed(false); setPreview(null); setRejection(null); setNotice('Original example restored.'); focusDecisions(); }
  const launch = snapshot.items.find(i=>i.id==='recap-launch');
  const launchQuote=quotes.find(q=>q.id==='q-launch');
  const contextItems=snapshot.items.filter(i=>['recap-context','recap-feedback','recap-research'].includes(i.id));
  function inspect(e, edit = false) { reviewTrigger.current = e.currentTarget; reviewAction.current=edit; correctionOrigin.current='notes'; setCorrecting(edit); setNotice(''); setInspecting(true); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setPreview(null); setRejection(null); }
  const changedIds = new Set(history.length ? snapshot.items.filter(i=>{const before=history.at(-1).items.find(b=>b.id===i.id);return before.text!==i.text || before.state!==i.state;}).map(i=>i.id) : []);
  function taskList(items) { return <ul className="task-list">{items.map(i=><li key={i.id}><div className="task-content"><p>{i.text} {changedIds.has(i.id) && <strong className="updated-label">Updated</strong>}</p><div className="task-meta"><span>{i.owner}</span><span className="task-state">{taskStatus(i.state,snapshot.classification)}</span></div></div><button className="text-button task-source" aria-label={`Source for task: ${i.text}`} onClick={e=>openSource(sourcePassages(snapshot,i),e)}>Source</button></li>)}</ul>; }
  function backToNotes() { setInspecting(false); setCorrecting(false); setPreview(null); setRejection(null); setNotice('Draft unchanged.'); setTimeout(() => document.querySelector(reviewAction.current ? '.decision-controls .primary' : '.decision-controls .review-button')?.focus(), 0); }
  function cancelCorrection() { if(correctionOrigin.current==='notes') { backToNotes(); return; } setCorrecting(false); setPreview(null); setRejection(null); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setNotice('Correction cancelled. Your notes and tasks are unchanged.'); }
  return <>
    <a className="skip" href="#workspace">Skip to meeting notes</a>
    <aside className="experiment" aria-label="About this prototype"><div className="intro-label">Arman Musaji <span>AI workflow experiment 02</span></div><div className="intro-grid"><div className="intro-title"><p className="project-name">About this experiment</p><h2>A possible launch<br/>became a promise.</h2><p className="intro-description">I designed Pre Share, an optional review feature inside a fictional meeting assistant. This experiment explores how one correction can repair related notes and tasks.</p></div><div className="visitor-brief"><div><h3>The situation</h3><p>A team discusses launching on Friday <strong>if the copy review is finished.</strong> The AI leaves out the condition and creates work as though the launch is confirmed.</p></div><div><h3>Your role</h3><p>You’re Maya, reading the draft before sharing. Correct the launch decision, then see how that changes the three tasks connected to it. Review the proposed changes together, or leave the draft as it is.</p></div><button className="enter-demo" onClick={()=>{focusDecisions();}}>Try the Pre Share feature <span aria-hidden="true">↓</span></button></div></div><div className="intro-disclosure"><strong>About this demo</strong><p>Fictional product and meeting. Deliberately seeded mistake. Repairs use authored examples. This prototype makes no live AI calls. Nothing is sent or shared.</p></div></aside>
    <aside className="demo-tools" aria-label="Prototype controls"><strong>Prototype controls</strong><button onClick={reset}>Restart demo</button><details><summary>Test a rejected change</summary><p>This authored example attempts to change Jules’s unrelated task. Choose Conditional or Not decided in the correction form first.</p><button disabled={!inspecting || !correcting || !!preview || !ready || choice==='Decided'} onClick={()=>request(true)}>Run rejection example</button></details></aside>
    <div className="product">
      <header className="appbar"><div className="brand"><svg className="preshare-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="M6 10V5h16l6 6v17H12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M21 5v7h7M5 18h13M13 13l5 5-5 5M5 28h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="product-wordmark"><strong>Meeting workspace</strong><small>Notes &amp; follow-up</small></span></div><span className="workspace-name">Product team</span><button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? 'Light theme' : 'Dark theme'}</button></header>
      <main id="workspace">
        <div className="meeting-heading"><p className="breadcrumb">Meetings / September 23, 2026 · Maya, Sam, Jules</p><div className="title-row"><h1 ref={heading} tabIndex="-1">Saved views: launch review</h1><span className="draft-badge">Draft · Not shared</span></div><p className="meeting-meta">Reviewing a feature that lets support teams save and reuse their queue filters.</p></div>
        <div className={`meeting-layout ${inspecting ? 'inspecting' : 'reading'}`}>
          <section className="notes-sheet" aria-labelledby="notes-title" hidden={inspecting && !preview}>
            <div className="document-heading"><div><p className="eyebrow">Optional review · AI-generated notes</p><h2 id="notes-title">{preview ? 'Review the proposed changes' : 'Pre Share'}</h2></div><button onClick={e=>openSource([],e)}>View transcript</button></div>
            {preview ? <><div className="preview-head"><h3 ref={previewHeading} tabIndex="-1">One decision corrected. Three tasks updated.</h3><p>Launch: {classificationLabel(snapshot.classification)} → {classificationLabel(choice)}. Check these changes before accepting.</p></div><div className="changes">{preview.edits.map(edit => { const item = snapshot.items.find(i => i.id === edit.id); return <article className="change" key={edit.id}><h3>{item.kind === 'recap' ? 'Recap · Launch decision' : 'Task · ' + (item.id === 'task-launch' ? 'Launch' : item.id === 'task-announcement' ? 'Announcement' : 'Checklist')}</h3><div className="diff"><div><span>Before</span><p>{item.text}</p>{item.state && <small>{taskStatus(item.state,snapshot.classification)}</small>}</div><div className="after"><span>Proposed</span><p>{edit.text}</p>{edit.state && <small>{taskStatus(edit.state,choice)}</small>}</div></div></article>;})}</div><div className="unchanged"><strong>Stays the same</strong><p>Product readiness, research feedback, and research follow-up stay as written. Jules’s research task, all owners, and the transcript also stay unchanged.</p></div><div className="accept-bar"><button className="primary" onClick={accept}>Apply all changes</button><button onClick={() => {setPreview(null);setNotice('Preview cancelled. Your draft has not changed.');setTimeout(()=>inspectorHeading.current?.focus(),0);}}>Back to correction</button><button onClick={cancelCorrection}>Discard proposed changes</button><p>This updates your draft only. Nothing is shared.</p></div></> : <>
              <section className="decisions-section" aria-labelledby="decisions-title"><div className="decisions-heading"><h2 id="decisions-title" ref={decisionsHeading} tabIndex="-1">Decisions</h2>{history.length > 0 && <button onClick={undo}>Undo correction</button>}</div>{history.length > 0 && <p className="saved-notice">Correction saved. Updated items are marked below.</p>}<div className="decision-row"><div className="row-label">Launch decision <span className="classification-tag">{classificationLabel(snapshot.classification)}</span></div><p className="launch-sentence">{launch.text} {changedIds.has(launch.id) && <strong className="updated-label">Updated</strong>}</p><div className="decision-bottom"><button className="text-button" onClick={e=>openSource(launch.sources,e)}>Source: Maya, 08:42</button><div className="decision-controls"><button className="review-button" onClick={e=>inspect(e)}>Review decision factors</button><button className="primary" onClick={e=>inspect(e,true)}>Correct this decision</button></div></div><section className="linked-work" aria-labelledby="linked-work-title"><div className="tasks-heading"><h3 id="linked-work-title">Follow-up linked to this decision</h3><span>3 draft tasks</span></div>{taskList(snapshot.items.filter(i=>i.kind==='task'&&i.claims.includes('launch')))}<p className="linked-foot">Suggested owners from the conversation. No tasks have been assigned.</p></section></div>
              <div className="owner-row"><div><span className="row-label">Launch owner</span><p>{snapshot.items[1].text}</p></div><button className="text-button" onClick={e=>openSource(['q-work'],e)}>Source: Sam, 08:49</button></div>
              </section><div className="tasks-heading"><h2>Independent follow-up</h2><span>1 draft task</span></div><p className="section-note">This work does not depend on the launch decision and stays unchanged when you correct it.</p>
              {taskList(snapshot.items.filter(i=>i.kind==='task'&&!i.claims.includes('launch')))}

<section className="recap-body"><h2>Meeting recap</h2>              <p className="summary-intro">Launch review for saved views. The team covered product readiness, feedback on visibility labels, launch timing, and follow-up responsibilities.</p>
              <div className="recap-sections">{contextItems.slice(0,2).map((item,n)=><section key={item.id}><h3>{n===0?'Product readiness':'Feedback and outstanding work'}</h3><p>{item.text}</p><button className="text-button" onClick={e=>openSource(item.sources,e)} aria-label={`View transcript for ${n===0?'product readiness':'feedback and outstanding work'}`}>View passage in transcript</button></section>)}</div>
<section className="research-recap"><h3>Research follow-up</h3><p>{contextItems[2].text}</p><button className="text-button" onClick={e=>openSource(contextItems[2].sources,e)}>View research transcript</button></section>
              </section>
            </>}
          </section>
          {inspecting && <aside className="evidence" hidden={!!preview} aria-label={correcting ? 'Correct the launch decision' : 'Launch decision factors'}>
            <div className="evidence-heading"><p className="eyebrow">Pre Share / Launch decision</p><button className="text-button" onClick={backToNotes}>Back to notes</button></div>
            <h2 ref={inspectorHeading} tabIndex="-1">{correcting ? 'Correct this decision' : 'Launch decision factors'}</h2>
            {!correcting ? <>
              <p className="inspection-intro">The recorded decision, the context behind it, and the work connected to it.</p>
              <div className="recorded-decision"><span className="row-label">In your recap</span><p>{launch.text}</p><span className="classification-tag">{classificationLabel(snapshot.classification)}</span></div>
              <section className="factor-section" aria-labelledby="factors-title"><h3 id="factors-title">From the conversation</h3>{['q-wait','q-launch','q-work'].map(id=>{const q=quotes.find(q=>q.id===id);return <div className="factor" key={id}><div><h4>{q.speaker} · {q.time}</h4><blockquote>“{q.text}”</blockquote></div><button className="text-button" onClick={e=>openSource([id],e)}>View passage</button></div>;})}</section>
              <section className="factor-section" aria-labelledby="related-title"><h3 id="related-title">Work connected to this decision</h3><ul className="related-tasks">{snapshot.items.filter(i=>i.kind==='task'&&i.claims.includes('launch')).map(i=><li key={i.id}><span>{i.text}</span><small>{i.owner} · {taskStatus(i.state,snapshot.classification)}</small></li>)}</ul><p className="independent-task"><strong>Separate work:</strong> Jules’s research notes do not depend on this decision.</p></section>
              <div className="factor-actions"><button onClick={backToNotes}>Back to notes</button><button className="text-button" onClick={()=>{correctionOrigin.current='factors';setCorrecting(true);setNotice('');}}>Correct this decision</button><p>Reviewing these details does not change your notes or tasks.</p></div>
            </> : <>
              <p className="inspection-intro">Change how this decision is recorded. We’ll prepare updates to the related work for you to review before anything changes.</p>
              <div className="evidence-comparison"><div className="comparison"><span>Currently in the recap</span><p>{launch.text}</p><small>Recorded as: {classificationLabel(snapshot.classification)}</small></div><div className="source-excerpt"><div className="speaker"><span className="avatar">M</span><strong>Maya</strong><span>08:42</span></div><blockquote>“{launchQuote.text}”</blockquote><button className="text-button" onClick={e=>openSource(['q-question','q-wait','q-launch','q-work'],e)}>Read the surrounding conversation</button></div></div>
              <fieldset><legend>Record Friday as</legend>{classifications.map(c=><label key={c} className={`option ${choice===c?'selected':''}`}><input type="radio" name="classification" checked={choice===c} onChange={()=>choose(c)}/><span><strong>{c==='Decided'?'Confirmed':c==='Conditional'?'Conditional on the copy review':'Not decided'}</strong></span></label>)}</fieldset>
              <p className="scope-note">Only the launch sentence and its 3 related tasks can change. The rest of the recap, research notes, and owners stay as they are.</p>
              <div className="correction-actions"><button className="primary" disabled={!ready} onClick={()=>request()}>Preview related updates</button><button onClick={cancelCorrection}>Cancel correction</button></div><p className="hint">{!ready ? 'No change selected.' : 'Nothing changes until you apply it.'}</p>
              {rejection && <section className="rejection"><h3 ref={rejectHeading} tabIndex="-1">Nothing changed. This repair went too far.</h3><p>{rejection.reason}</p><p><strong>Attempted:</strong> “{rejection.text}”</p><button onClick={()=>request()}>Preview linked changes only</button></section>}

            </>}
          </aside>}

        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="announcement">{notice}</p>
      </main>
    </div>
    <footer>Pre Share · A feature experiment by Arman Musaji</footer>
    <dialog className="transcript-dialog" ref={dialog} onCancel={e=>{e.preventDefault();closeSource();}} aria-labelledby="source-title"><div className="dialog-head"><div><h2 id="source-title" tabIndex="-1">Meeting transcript</h2><p className="hint">{source?.length ? 'Relevant passages are marked below. The full conversation is included.' : 'Saved views: launch review · Full conversation'}</p></div><button onClick={closeSource}>Close transcript</button></div><div className="dialog-transcript" tabIndex="0" role="region" aria-label="Full meeting transcript">{quotes.map(q=><figure tabIndex="-1" className={source?.includes(q.id) ? 'transcript-match' : ''} key={q.id}><figcaption>{q.speaker} · {q.time}{source?.includes(q.id) && <strong className="passage-label">Relevant passage</strong>}</figcaption><blockquote>“{q.text}”</blockquote></figure>)}<p className="hint">Source quotes stay unchanged when you correct the draft.</p></div></dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
