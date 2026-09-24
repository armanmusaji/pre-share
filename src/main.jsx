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
  const launch = snapshot.items.find(i=>i.id==='recap-launch');
  const launchQuote=quotes.find(q=>q.id==='q-launch');
  const contextItems=snapshot.items.filter(i=>['recap-context','recap-feedback','recap-research'].includes(i.id));
  function inspect() { setInspecting(true); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setPreview(null); setRejection(null); }
  function backToNotes() { setInspecting(false); setPreview(null); setRejection(null); setNotice('Draft unchanged.'); setTimeout(() => reviewTrigger.current?.focus(), 0); }
  return <>
    <a className="skip" href="#workspace">Skip to meeting notes</a>
    <aside className="experiment" aria-label="About this prototype"><div className="intro-label">Arman Musaji <span>AI workflow experiment 02</span></div><div className="intro-grid"><div className="intro-title"><p className="project-name">About this experiment</p><h2>A possible launch<br/>became a promise.</h2><p className="intro-description">I designed PreShare, a fictional AI meeting-notes product, to explore how people can correct a mistaken assumption and the work created from it.</p></div><div className="visitor-brief"><div><h3>The situation</h3><p>A team discusses launching on Friday <strong>if the copy review is finished.</strong> The AI leaves out the condition and creates work as though the launch is confirmed.</p></div><div><h3>Your role</h3><p>You’re reviewing the draft before the team sees it. Check the conversation, correct what the notes say, and review which tasks need to change.</p></div><button className="enter-demo" onClick={()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:'instant'});}}>Try the PreShare demo <span aria-hidden="true">↓</span></button></div></div><div className="intro-disclosure"><strong>About this demo</strong><p>Fictional product and meeting. Deliberately seeded mistake. Repairs use saved examples; live AI is not connected. Nothing is sent or shared.</p></div></aside>
    <div className="product">
      <header className="appbar"><div className="brand"><svg className="preshare-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="M6 10V5h16l6 6v17H12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M21 5v7h7M5 18h13M13 13l5 5-5 5M5 28h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="product-wordmark"><strong>PreShare</strong><small>AI meeting notes</small></span></div><span className="workspace-name">Product team workspace</span><button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? 'Light theme' : 'Dark theme'}</button></header>
      <main id="workspace">
        <div className="meeting-heading"><p className="breadcrumb">Meetings <span aria-hidden="true">/</span> September 23, 2026</p><div className="title-row"><div><h1 ref={heading} tabIndex="-1">Saved views: launch review</h1><p className="meeting-meta">September 23 · 10-minute meeting <span>·</span> Maya, Sam, Jules</p></div><span className="draft-badge">Draft · Not shared</span></div><div className="people"><span className="avatar">M</span><span>Maya</span><span className="avatar sam">S</span><span>Sam</span><span className="avatar jules">J</span><span>Jules</span></div></div>
        <div className="processing"><span><span className="check" aria-hidden="true">✓</span> Meeting recorded</span><span className="flow-arrow" aria-hidden="true">→</span><span><span className="check" aria-hidden="true">✓</span> AI notes drafted</span><span className="flow-arrow" aria-hidden="true">→</span><strong>Your review</strong></div>
        <div className="review-banner"><div><h2>{history.length ? 'Correction saved. The draft is still yours to review.' : 'Your meeting notes are ready to review.'}</h2><p>{history.length ? 'The recap and its related tasks were updated together. Nothing has been shared.' : 'AI drafted this recap and suggested tasks from the transcript. Check the decisions, owners, and dates before sharing with your team.'}</p></div><div className="review-actions">{history.length > 0 && <button onClick={undo}>Undo correction</button>}<button onClick={reset}>Restart demo</button></div></div>
        {!inspecting && <section className="conversation-overview" aria-labelledby="conversation-title"><div className="conversation-top"><div><p className="eyebrow">Start with the conversation</p><h2 id="conversation-title">What this meeting was about</h2></div><span className="transcript-duration">Recording transcript · 00:18–09:38</span></div><p className="meeting-synopsis">The team is preparing to launch <strong>saved views</strong>, a feature that lets support teams reuse their queue filters. They discuss the finished feature, confusing visibility labels, the copy review, and whether Friday is a realistic launch date.</p><div className="meeting-topics"><span>Feature readiness</span><span>Research feedback</span><span>Launch timing</span><span>Follow-up work</span></div><details className="full-transcript"><summary>Read the meeting transcript <span>12 contributions · Fictional recording</span></summary><div className="transcript-list">{quotes.map(q=><div className="transcript-entry" key={q.id}><div className="speaker"><span className={`avatar ${q.speaker.toLowerCase()}`}>{q.speaker[0]}</span><strong>{q.speaker}</strong><span>{q.time}</span></div><p>{q.text}</p></div>)}</div><p className="hint">Authored example, not an actual recording. Audio playback is not included.</p></details></section>}
        <div className={`meeting-layout ${inspecting ? 'inspecting' : 'reading'}`}>
          <section className="notes-sheet" aria-labelledby="notes-title" hidden={inspecting && !preview}>
            <div className="document-heading"><div><p className="eyebrow">AI-generated draft</p><h2 id="notes-title">{preview ? 'Review the proposed changes' : 'Meeting recap'}</h2></div><span className="paper-mark" aria-hidden="true">≡</span></div>
            {preview ? <><div className="preview-head"><h3 ref={previewHeading} tabIndex="-1">One correction. Four related updates.</h3><p>Launch: {snapshot.classification} → {choice}. These changes are a saved example, not live AI output. Check them before accepting.</p></div><div className="changes">{preview.edits.map(edit => { const item = snapshot.items.find(i => i.id === edit.id); return <article className="change" key={edit.id}><h3>{item.kind === 'recap' ? 'Recap · Launch decision' : 'Task · ' + (item.id === 'task-launch' ? 'Launch' : item.id === 'task-announcement' ? 'Announcement' : 'Checklist')}</h3><div className="diff"><div><span>Before</span><p>{item.text}</p>{item.state && <small>{item.state}</small>}</div><div className="after"><span>Proposed</span><p>{edit.text}</p>{edit.state && <small>{edit.state}</small>}</div></div></article>;})}</div><div className="unchanged"><strong>Stays the same</strong><p>Product readiness, research feedback, and research follow-up stay as written. Jules’s research task, all owners, and the transcript also stay unchanged.</p></div><div className="accept-bar"><button className="primary" onClick={() => {accept(); setInspecting(false);}}>Accept correction</button><button onClick={() => {setPreview(null);setNotice('Preview cancelled. Your draft has not changed.');setTimeout(()=>inspectorHeading.current?.focus(),0);}}>Back to correction</button><p>This updates your draft only. Nothing is shared.</p></div></> : <>
              <p className="summary-intro">Launch review for saved views. The team covered product readiness, feedback on visibility labels, launch timing, and follow-up responsibilities.</p>
              <div className="recap-sections">{contextItems.slice(0,2).map((item,n)=><section key={item.id}><h3>{n===0?'Product readiness':'Feedback and outstanding work'}</h3><p>{item.text}</p><button className="text-button" onClick={e=>openSource(item.sources,e)} aria-label={`View transcript for ${n===0?'product readiness':'feedback and outstanding work'}`}>View transcript</button></section>)}</div>
              <div className="decision-row"><div className="row-label">Launch decision <span className="classification-tag">{snapshot.classification}</span></div><p className="launch-sentence">{launch.text}</p><div className="decision-bottom"><button className="text-button" onClick={e=>openSource(launch.sources,e)}>Source: Maya, 08:42</button><button className="review-button" ref={reviewTrigger} onClick={inspect}>Compare with what was said <span aria-hidden="true">→</span></button></div></div>
              <div className="owner-row"><div><span className="row-label">Launch owner</span><p>{snapshot.items[1].text}</p></div><button className="text-button" onClick={e=>openSource(['q-work'],e)}>Source: Sam, 08:49</button></div>
              <section className="research-recap"><h3>Research follow-up</h3><p>{contextItems[2].text}</p><button className="text-button" onClick={e=>openSource(contextItems[2].sources,e)}>View research transcript</button></section>
              <div className="tasks-heading"><h2>Suggested tasks</h2><span>4 tasks · Not assigned yet</span></div><p className="section-note">Owners below are taken from the conversation. Review these suggestions before assigning work.</p>
              <ul className="task-list">{snapshot.items.filter(i=>i.kind==='task').map(i=><li key={i.id}><span className="task-symbol" aria-hidden="true">{i.state==='Ready' ? '□' : '○'}</span><div className="task-content"><p>{i.text}</p><div className="task-meta"><span>{i.owner}</span><span className="task-state">{i.state}</span>{inspecting && <span>{i.claims.includes('launch') ? 'Depends on launch decision' : 'Independent of launch'}</span>}</div></div><button className="text-button task-source" aria-label={`Source for task: ${i.text}`} onClick={e=>openSource(i.sources,e)}>Source</button></li>)}</ul>
              <p className="document-foot">Draft generated from this meeting’s transcript. Review suggestions against the original conversation.</p>
            </>}
          </section>
          {inspecting && <aside className="evidence" hidden={!!preview} aria-label={inspecting ? 'Check the launch decision' : 'Meeting transcript'}>
            {inspecting ? <><div className="evidence-heading"><p className="eyebrow">Check the launch decision</p><button className="text-button" onClick={backToNotes}>Close review</button></div><h2 ref={inspectorHeading} tabIndex="-1">Make the note match the conversation</h2><p className="inspection-intro">Your job is to correct the meeting notes. Choose the sentence that reflects what Maya said. This does not set a launch date or assign any work.</p><div className="evidence-comparison"><div className="comparison"><span>What the AI wrote</span><p>{launch.text}</p><small>Recorded as: {snapshot.classification}</small></div><div className="source-excerpt"><div className="speaker"><span className="avatar">M</span><strong>Maya</strong><span>08:42</span></div><blockquote>“{launchQuote.text}”</blockquote><p>What was said in the recording</p><button className="text-button" onClick={e=>openSource(['q-question','q-wait','q-launch','q-work'],e)}>Read the surrounding conversation</button></div></div>
            <fieldset><legend>What should the recap say about Friday?</legend>{classifications.map(c=><label key={c} className={`option ${choice===c?'selected':''}`}><input type="radio" name="classification" checked={choice===c} onChange={()=>choose(c)}/><span><strong>{c==='Decided'?'Friday is confirmed':c==='Conditional'?'Friday depends on the copy review':'There is no launch commitment yet'}</strong><small>{c==='Decided'?'Decided: record a firm commitment':c==='Conditional'?'Conditional: keep the requirement attached':'Open: leave the decision unresolved'}</small></span></label>)}</fieldset>
            {choice==='Conditional' && <label className="condition"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setPreview(null);setRejection(null);}}/><span>The condition is:<strong> Finish the copy review first.</strong></span></label>}
            {choice==='Decided' && snapshot.classification!=='Decided' && <p className="caution">The quote does not confirm an unconditional commitment. This restores the seeded mistake.</p>}
            <p className="scope-note">Your choice will propose an update to the launch sentence and these 3 tasks: launch, send the announcement, close the checklist. The research notes will stay unchanged. You will review every change before accepting it.</p>
            <button className="primary wide" disabled={!ready} onClick={()=>request()}>Show how this changes the draft</button><p className="hint">{!ready ? (choice===snapshot.classification?'Choose a different classification to correct the draft.':'Confirm the condition to continue.') : 'Saved example. You decide whether to apply it.'}</p>
            {rejection && <section className="rejection"><h3 ref={rejectHeading} tabIndex="-1">Nothing changed. This repair went too far.</h3><p>{rejection.reason}</p><p><strong>Attempted:</strong> “{rejection.text}”</p><button onClick={()=>request()}>Use saved example instead</button></section>}
            <details className="failure-demo"><summary>Demo: try a repair that changes too much</summary><p>This deliberately injected response also changes Jules’s unrelated research task. It is not a live model failure.</p><button disabled={!ready} onClick={()=>request(true)}>Run rejection example</button></details></> : null}
          </aside>}
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="announcement">{notice}</p>
      </main>
    </div>
    <footer>Before you share · PreShare concept, pass 05 <span>No recording, task assignment, or sharing happens in this prototype.</span></footer>
    <dialog ref={dialog} onCancel={e=>{e.preventDefault();closeSource();}} aria-labelledby="source-title"><div className="dialog-head"><h2 id="source-title">From the meeting transcript</h2><button onClick={closeSource}>Close source</button></div>{quotes.filter(q=>source?.includes(q.id)).map(q=><figure key={q.id}><figcaption>{q.speaker} · {q.time}</figcaption><blockquote>“{q.text}”</blockquote></figure>)}<p className="hint">Fictional transcript. Source quotes stay unchanged when you correct the draft.</p></dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
