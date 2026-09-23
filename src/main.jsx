import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import './style.css';
import { initial, classifications, quotes, savedPatch, validate, apply, restore } from './model.js';

function App() {
  const [inspecting, setInspecting] = useState(false);
  const inspectorHeading=useRef(null),reviewTrigger=useRef(null);
  useEffect(()=>{if(inspecting) inspectorHeading.current?.focus();},[inspecting]);
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
  useEffect(() => { if (source) dialog.current.showModal(); }, [source]);
  useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);
  useEffect(() => { if (rejection) rejectHeading.current?.focus(); }, [rejection]);
  function openSource(ids, e) { sourceTrigger.current = e.currentTarget; setSource(ids); }
  function closeSource() { dialog.current.close(); setSource(null); sourceTrigger.current?.focus(); }
  function choose(value) { setChoice(value); setConfirmed(false); setPreview(null); setRejection(null); setNotice(''); }
  function request(reject = false) {
    if (!ready) return;
    const patch = savedPatch(snapshot, choice, choice === 'Conditional' && confirmed);
    if (reject) patch.edits.push({ id: 'task-research', text: 'Hold the research notes until launch', state: 'Waiting' });
    const check = validate(snapshot, patch, choice, choice === 'Conditional' && confirmed);
    if (!check.ok) { setPreview(null); setRejection({ reason: check.reason, text: 'Hold the research notes until launch', state: 'Waiting' }); setNotice('Response rejected. Your recap and tasks have not changed.'); }
    else { setPreview(patch); setRejection(null); setNotice('Saved example ready. Review four linked items before accepting.'); }
  }
  function accept() {
    try {
      const next = apply(snapshot, preview, choice, choice === 'Conditional' && confirmed);
      setHistory(h => [...h, snapshot]); setSnapshot(next); setPreview(null); setRejection(null);
      setNotice('Correction accepted. The claim, one recap line, and three tasks changed together. Research notes did not change.'); heading.current.focus();
    } catch (error) { setPreview(null); setRejection({ reason: error.message }); }
  }
  function undo() {
    const previous = history.at(-1);
    setSnapshot(restore(snapshot, previous)); setHistory(h => h.slice(0, -1)); setChoice(previous.classification); setConfirmed(previous.condition); setPreview(null); setRejection(null); setNotice('Undone. The previous claim, recap, and tasks are restored together.'); heading.current.focus();
  }
  function reset() { setInspecting(false); setSnapshot(restore(snapshot, initial())); setHistory([]); setChoice('Decided'); setConfirmed(false); setPreview(null); setRejection(null); setNotice('Original example restored.'); heading.current.focus(); }
  const launch = snapshot.items[0];
  function inspect() { setInspecting(true); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setPreview(null); setRejection(null); }
  function backToNotes() { setInspecting(false); setPreview(null); setRejection(null); setNotice('Draft unchanged.'); setTimeout(() => reviewTrigger.current?.focus(), 0); }
  return <>
    <a className="skip" href="#workspace">Skip to meeting notes</a>
    <aside className="experiment" aria-label="About this prototype"><div><strong>Before you share</strong><span> An interactive concept by Arman Musaji</span></div><p>You’re reviewing AI meeting notes before your team sees them. The AI treated a possible Friday launch as agreed. Can you correct the notes and the tasks it created?</p><small>Fictional meeting · Deliberately seeded mistake · Saved examples, no live AI · Nothing is shared</small></aside>
    <div className="product">
      <header className="appbar"><div className="brand"><svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/><path d="M8 9h10M8 13h10M8 17h6" stroke="currentColor" strokeWidth="2"/></svg><strong>Meeting notes</strong></div><span className="workspace-name">Product team workspace</span><button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? 'Light theme' : 'Dark theme'}</button></header>
      <main id="workspace">
        <div className="meeting-heading"><p className="breadcrumb">Meetings <span aria-hidden="true">/</span> September 23, 2026</p><div className="title-row"><div><h1 ref={heading} tabIndex="-1">Launch check-in</h1><p className="meeting-meta">Product launch planning <span>·</span> 3 participants</p></div><span className="draft-badge">Draft · Not shared</span></div><div className="people"><span className="avatar">M</span><span>Maya</span><span className="avatar sam">S</span><span>Sam</span><span className="avatar jules">J</span><span>Jules</span></div></div>
        <div className="processing"><span><span className="check" aria-hidden="true">✓</span> Meeting recorded</span><span className="flow-arrow" aria-hidden="true">→</span><span><span className="check" aria-hidden="true">✓</span> AI notes drafted</span><span className="flow-arrow" aria-hidden="true">→</span><strong>Your review</strong></div>
        <div className="review-banner"><div><h2>{history.length ? 'Correction saved. The draft is still yours to review.' : 'Your meeting notes are ready to review.'}</h2><p>{history.length ? 'The recap and its related tasks were updated together. Nothing has been shared.' : 'AI drafted this recap and suggested tasks from the transcript. Check the decisions, owners, and dates before sharing with your team.'}</p></div><div className="review-actions">{history.length > 0 && <button onClick={undo}>Undo correction</button>}<button onClick={reset}>Restart demo</button></div></div>
        <div className={`meeting-layout ${inspecting ? 'inspecting' : ''}`}>
          <section className="notes-sheet" aria-labelledby="notes-title">
            <div className="document-heading"><div><p className="eyebrow">AI-generated draft</p><h2 id="notes-title">{preview ? 'Review the proposed changes' : 'Meeting recap'}</h2></div><span className="paper-mark" aria-hidden="true">≡</span></div>
            {preview ? <><div className="preview-head"><h3 ref={previewHeading} tabIndex="-1">One correction. Four related updates.</h3><p>Launch: {snapshot.classification} → {choice}. These changes are a saved example, not live AI output. Check them before accepting.</p></div><div className="changes">{preview.edits.map(edit => { const item = snapshot.items.find(i => i.id === edit.id); return <article className="change" key={edit.id}><h3>{item.kind === 'recap' ? 'Recap · Launch decision' : 'Task · ' + (item.id === 'task-launch' ? 'Launch' : item.id === 'task-announcement' ? 'Announcement' : 'Checklist')}</h3><div className="diff"><div><span>Before</span><p>{item.text}</p>{item.state && <small>{item.state}</small>}</div><div className="after"><span>Proposed</span><p>{edit.text}</p>{edit.state && <small>{edit.state}</small>}</div></div></article>;})}</div><div className="unchanged"><strong>Stays the same</strong><p>Jules: Share the research notes. Sam remains the launch coordinator. Owners and transcript quotes are unchanged.</p></div><div className="accept-bar"><button className="primary" onClick={() => {accept(); setInspecting(false);}}>Accept correction</button><button onClick={() => {setPreview(null);setNotice('Preview cancelled. Your draft has not changed.');setTimeout(()=>inspectorHeading.current?.focus(),0);}}>Back to correction</button><p>This updates your draft only. Nothing is shared.</p></div></> : <>
              <p className="summary-intro">The team discussed launch timing, the copy review, and how to follow up after the meeting.</p>
              <div className="decision-row"><div className="row-label">Launch decision <span className="classification-tag">{snapshot.classification}</span></div><p className="launch-sentence">{launch.text}</p><div className="decision-bottom"><button className="text-button" onClick={e=>openSource(launch.sources,e)}>Source: Maya, 08:42</button><button className="review-button" ref={reviewTrigger} onClick={inspect}>{history.length ? 'Review this decision' : 'Check this decision'} <span aria-hidden="true">→</span></button></div></div>
              <div className="owner-row"><div><span className="row-label">Launch owner</span><p>{snapshot.items[1].text}</p></div><button className="text-button" onClick={e=>openSource(['q-work'],e)}>Source: Sam, 08:49</button></div>
              <div className="tasks-heading"><h2>Suggested tasks</h2><span>4 tasks · Not assigned yet</span></div><p className="section-note">Owners below are taken from the conversation. Review these suggestions before assigning work.</p>
              <ul className="task-list">{snapshot.items.filter(i=>i.kind==='task').map(i=><li key={i.id}><span className="task-symbol" aria-hidden="true">{i.state==='Ready' ? '□' : '○'}</span><div className="task-content"><p>{i.text}</p><div className="task-meta"><span>{i.owner}</span><span className="task-state">{i.state}</span>{inspecting && <span>{i.claims.includes('launch') ? 'Depends on launch decision' : 'Independent of launch'}</span>}</div></div><button className="text-button task-source" aria-label={`Source for task: ${i.text}`} onClick={e=>openSource(i.sources,e)}>Source</button></li>)}</ul>
              <p className="document-foot">Draft generated from this meeting’s transcript. Review suggestions against the original conversation.</p>
            </>}
          </section>
          <aside className="evidence" aria-label={inspecting ? 'Check the launch decision' : 'Meeting transcript'}>
            {inspecting ? <><div className="evidence-heading"><p className="eyebrow">Check the launch decision</p><button className="text-button" onClick={backToNotes}>Close review</button></div><h2 ref={inspectorHeading} tabIndex="-1">What did the team agree?</h2><div className="comparison"><span>The draft says</span><p>{launch.text}</p></div><div className="source-excerpt"><div className="speaker"><span className="avatar">M</span><strong>Maya</strong><span>08:42</span></div><blockquote>“{quotes[0].text}”</blockquote><p>From the meeting transcript</p></div>
            <fieldset><legend>How should the launch be recorded?</legend>{classifications.map(c=><label key={c} className={`option ${choice===c?'selected':''}`}><input type="radio" name="classification" checked={choice===c} onChange={()=>choose(c)}/><span><strong>{c}</strong><small>{c==='Decided'?'The team made a commitment':c==='Conditional'?'Only if a condition is met':'The team has not decided'}</small></span></label>)}</fieldset>
            {choice==='Conditional' && <label className="condition"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setPreview(null);setRejection(null);}}/><span>The condition is:<strong> Finish the copy review first.</strong></span></label>}
            {choice==='Decided' && snapshot.classification!=='Decided' && <p className="caution">The quote does not confirm an unconditional commitment. This restores the seeded mistake.</p>}
            <p className="scope-note">The recap and 3 launch tasks depend on this decision. The research-notes task does not.</p>
            <button className="primary wide" disabled={!ready} onClick={()=>request()}>Preview related changes</button><p className="hint">{!ready ? (choice===snapshot.classification?'Choose a different classification to correct the draft.':'Confirm the condition to continue.') : 'Saved example. You decide whether to apply it.'}</p>
            {rejection && <section className="rejection"><h3 ref={rejectHeading} tabIndex="-1">Nothing changed. This repair went too far.</h3><p>{rejection.reason}</p><p><strong>Attempted:</strong> “{rejection.text}”</p><button onClick={()=>request()}>Use saved example instead</button></section>}
            <details className="failure-demo"><summary>Demo: try a repair that changes too much</summary><p>This deliberately injected response also changes Jules’s unrelated research task. It is not a live model failure.</p><button disabled={!ready} onClick={()=>request(true)}>Run rejection example</button></details></> : <><div className="evidence-heading"><p className="eyebrow">Original conversation</p><span className="transcript-dot" aria-hidden="true"></span></div><h2>Meeting transcript</h2><p className="transcript-intro">Selected excerpts from the recorded meeting. Use these to check the AI draft.</p>{quotes.map(q=><div className="transcript-entry" key={q.id}><div className="speaker"><span className={`avatar ${q.speaker.toLowerCase()}`}>{q.speaker[0]}</span><strong>{q.speaker}</strong><span>{q.time}</span></div><p>{q.text}</p></div>)}<div className="transcript-foot">Demo transcript excerpts. Audio playback is not included.</div></>}
          </aside>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="announcement">{notice}</p>
      </main>
    </div>
    <footer>Before you share · Product concept, pass 02 <span>No recording, task assignment, or sharing happens in this prototype.</span></footer>
    <dialog ref={dialog} onCancel={e=>{e.preventDefault();closeSource();}} aria-labelledby="source-title"><div className="dialog-head"><h2 id="source-title">From the meeting transcript</h2><button onClick={closeSource}>Close source</button></div>{quotes.filter(q=>source?.includes(q.id)).map(q=><figure key={q.id}><figcaption>{q.speaker} · {q.time}</figcaption><blockquote>“{q.text}”</blockquote></figure>)}<p className="hint">Fictional transcript. Source quotes stay unchanged when you correct the draft.</p></dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
