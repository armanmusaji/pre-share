import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import './style.css';
import { initial, classifications, quotes, savedPatch, validate, apply, restore } from './model.js';

function App() {
  const [inspecting, setInspecting] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const inspectorHeading=useRef(null),reviewTrigger=useRef(null);
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
      setHistory(h => [...h, snapshot]); setSnapshot(next); setPreview(null); setRejection(null); setInspecting(false); setCorrecting(false);
      setNotice('Correction accepted. The claim, one recap line, and three tasks changed together. Research notes did not change.'); heading.current.focus();
    } catch (error) { setPreview(null); setRejection({ reason: error.message }); }
  }
  function undo() {
    const previous = history.at(-1);
    setInspecting(false); setCorrecting(false); setSnapshot(restore(snapshot, previous)); setHistory(h => h.slice(0, -1)); setChoice(previous.classification); setConfirmed(previous.condition); setPreview(null); setRejection(null); setNotice('Undone. The previous claim, recap, and tasks are restored together.'); heading.current.focus();
  }
  function reset() { setInspecting(false); setCorrecting(false); setSnapshot(restore(snapshot, initial())); setHistory([]); setChoice('Decided'); setConfirmed(false); setPreview(null); setRejection(null); setNotice('Original example restored.'); heading.current.focus(); }
  const launch = snapshot.items.find(i=>i.id==='recap-launch');
  const launchQuote=quotes.find(q=>q.id==='q-launch');
  const contextItems=snapshot.items.filter(i=>['recap-context','recap-feedback','recap-research'].includes(i.id));
  function inspect(e, edit = false) { reviewTrigger.current = e.currentTarget; setCorrecting(edit); setNotice(''); setInspecting(true); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setPreview(null); setRejection(null); }
  function taskList(items) { return <ul className="task-list">{items.map(i=><li key={i.id}><span className="task-symbol" aria-hidden="true">{i.state==='Ready' ? '□' : '○'}</span><div className="task-content"><p>{i.text}</p><div className="task-meta"><span>{i.owner}</span><span className="task-state">{i.state}</span></div></div><button className="text-button task-source" aria-label={`Source for task: ${i.text}`} onClick={e=>openSource(i.sources,e)}>Source</button></li>)}</ul>; }
  function backToNotes() { setInspecting(false); setCorrecting(false); setPreview(null); setRejection(null); setNotice('Draft unchanged.'); setTimeout(() => reviewTrigger.current?.focus(), 0); }
  function cancelCorrection() { setCorrecting(false); setPreview(null); setRejection(null); setChoice(snapshot.classification); setConfirmed(snapshot.condition); setNotice('Correction cancelled. Your notes and tasks are unchanged.'); }
  return <>
    <a className="skip" href="#workspace">Skip to meeting notes</a>
    <aside className="experiment" aria-label="About this prototype"><div className="intro-label">Arman Musaji <span>AI workflow experiment 02</span></div><div className="intro-grid"><div className="intro-title"><p className="project-name">About this experiment</p><h2>A possible launch<br/>became a promise.</h2><p className="intro-description">I designed Pre Share, an optional review feature inside a fictional meeting assistant. This experiment explores how one correction can repair related notes and tasks.</p></div><div className="visitor-brief"><div><h3>The situation</h3><p>A team discusses launching on Friday <strong>if the copy review is finished.</strong> The AI leaves out the condition and creates work as though the launch is confirmed.</p></div><div><h3>Your role</h3><p>You’re Maya, reading the draft before sharing. Correct the launch decision, then see how that changes the three tasks connected to it. Review the proposed changes together, or leave the draft as it is.</p></div><button className="enter-demo" onClick={()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:'instant'});}}>Try the Pre Share feature <span aria-hidden="true">↓</span></button></div></div><div className="intro-disclosure"><strong>About this demo</strong><p>Fictional product and meeting. Deliberately seeded mistake. Repairs use saved examples; live AI is not connected. Nothing is sent or shared.</p></div></aside>
    <div className="product">
      <header className="appbar"><div className="brand"><svg className="preshare-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><path d="M6 10V5h16l6 6v17H12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M21 5v7h7M5 18h13M13 13l5 5-5 5M5 28h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="product-wordmark"><strong>Meeting workspace</strong><small>Notes &amp; follow-up</small></span></div><span className="workspace-name">Product team</span><button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? 'Light theme' : 'Dark theme'}</button></header>
      <main id="workspace">
        <div className="meeting-heading"><p className="breadcrumb">Meetings <span aria-hidden="true">/</span> September 23, 2026</p><div className="title-row"><div><h1 ref={heading} tabIndex="-1">Saved views: launch review</h1><p className="meeting-meta">September 23 · 10-minute meeting <span>·</span> Maya, Sam, Jules</p></div><span className="draft-badge">Draft · Not shared</span></div><div className="people"><span className="avatar">M</span><span>Maya</span><span className="avatar sam">S</span><span>Sam</span><span className="avatar jules">J</span><span>Jules</span></div></div>
        <div className="processing"><span><span className="check" aria-hidden="true">✓</span> Meeting recorded</span><span className="flow-arrow" aria-hidden="true">→</span><span><span className="check" aria-hidden="true">✓</span> AI notes drafted</span><span className="flow-arrow" aria-hidden="true">→</span><strong>Notes ready</strong></div>
        <div className="review-banner"><div><p className="eyebrow feature-label">Pre Share · Optional review</p><h2>{history.length ? 'Correction saved to your draft.' : 'Review before sharing'}</h2><p>{history.length ? 'The recap and its related tasks were updated together. Nothing has been shared.' : 'Your recap and suggested tasks are here. Open a source or a decision’s details whenever you need more context.'}</p></div><div className="review-actions">{history.length > 0 && <button onClick={undo}>Undo correction</button>}<button onClick={reset}>Restart demo</button></div></div>
        {!inspecting && <section className="conversation-overview" aria-labelledby="conversation-title"><div className="conversation-top"><div><p className="eyebrow">Meeting context</p><h2 id="conversation-title">What this meeting was about</h2></div><span className="transcript-duration">Recording transcript · 00:18–09:38</span></div><p className="meeting-synopsis">The team is preparing to launch <strong>saved views</strong>, a feature that lets support teams reuse their queue filters. They discuss the finished feature, confusing visibility labels, the copy review, and whether Friday is a realistic launch date.</p><details className="full-transcript"><summary>Read the meeting transcript <span>12 contributions · Fictional recording</span></summary><div className="transcript-list">{quotes.map(q=><div className="transcript-entry" key={q.id}><div className="speaker"><span className={`avatar ${q.speaker.toLowerCase()}`}>{q.speaker[0]}</span><strong>{q.speaker}</strong><span>{q.time}</span></div><p>{q.text}</p></div>)}</div><p className="hint">Authored example, not an actual recording. Audio playback is not included.</p></details></section>}
        <div className={`meeting-layout ${inspecting ? 'inspecting' : 'reading'}`}>
          <section className="notes-sheet" aria-labelledby="notes-title" hidden={inspecting && !preview}>
            <div className="document-heading"><div><p className="eyebrow">AI-generated draft</p><h2 id="notes-title">{preview ? 'Review the proposed changes' : 'Meeting recap'}</h2></div><span className="paper-mark" aria-hidden="true">≡</span></div>
            {preview ? <><div className="preview-head"><h3 ref={previewHeading} tabIndex="-1">One correction. Four related updates.</h3><p>Launch: {snapshot.classification} → {choice}. These changes are a saved example, not live AI output. Check them before accepting.</p></div><div className="changes">{preview.edits.map(edit => { const item = snapshot.items.find(i => i.id === edit.id); return <article className="change" key={edit.id}><h3>{item.kind === 'recap' ? 'Recap · Launch decision' : 'Task · ' + (item.id === 'task-launch' ? 'Launch' : item.id === 'task-announcement' ? 'Announcement' : 'Checklist')}</h3><div className="diff"><div><span>Before</span><p>{item.text}</p>{item.state && <small>{item.state}</small>}</div><div className="after"><span>Proposed</span><p>{edit.text}</p>{edit.state && <small>{edit.state}</small>}</div></div></article>;})}</div><div className="unchanged"><strong>Stays the same</strong><p>Product readiness, research feedback, and research follow-up stay as written. Jules’s research task, all owners, and the transcript also stay unchanged.</p></div><div className="accept-bar"><button className="primary" onClick={accept}>Apply all changes</button><button onClick={() => {setPreview(null);setNotice('Preview cancelled. Your draft has not changed.');setTimeout(()=>inspectorHeading.current?.focus(),0);}}>Back to correction</button><button onClick={cancelCorrection}>Discard proposed changes</button><p>This updates your draft only. Nothing is shared.</p></div></> : <>
              <p className="summary-intro">Launch review for saved views. The team covered product readiness, feedback on visibility labels, launch timing, and follow-up responsibilities.</p>
              <div className="recap-sections">{contextItems.slice(0,2).map((item,n)=><section key={item.id}><h3>{n===0?'Product readiness':'Feedback and outstanding work'}</h3><p>{item.text}</p><button className="text-button" onClick={e=>openSource(item.sources,e)} aria-label={`View transcript for ${n===0?'product readiness':'feedback and outstanding work'}`}>View transcript</button></section>)}</div>
              <section className="decisions-section" aria-labelledby="decisions-title"><h2 id="decisions-title">Decisions</h2><div className="decision-row"><div className="row-label">Launch decision <span className="classification-tag">{snapshot.classification}</span></div><p className="launch-sentence">{launch.text}</p><div className="decision-bottom"><button className="text-button" onClick={e=>openSource(launch.sources,e)}>Source: Maya, 08:42</button><div className="decision-controls"><button className="review-button" onClick={e=>inspect(e)}>Review Decision Factors</button><button className="primary" onClick={e=>inspect(e,true)}>Correct this decision</button></div></div><section className="linked-work" aria-labelledby="linked-work-title"><div className="tasks-heading"><h3 id="linked-work-title">Follow-up linked to this decision</h3><span>3 draft tasks</span></div><p className="section-note">These tasks depend on the launch decision. Correcting it lets you review their updates together.</p>{taskList(snapshot.items.filter(i=>i.kind==='task'&&i.claims.includes('launch')))}<p className="linked-foot">Suggested owners from the conversation. No tasks have been assigned.</p></section></div>
              <div className="owner-row"><div><span className="row-label">Launch owner</span><p>{snapshot.items[1].text}</p></div><button className="text-button" onClick={e=>openSource(['q-work'],e)}>Source: Sam, 08:49</button></div>
              </section><section className="research-recap"><h3>Research follow-up</h3><p>{contextItems[2].text}</p><button className="text-button" onClick={e=>openSource(contextItems[2].sources,e)}>View research transcript</button></section>
              <div className="tasks-heading"><h2>Independent follow-up</h2><span>1 draft task</span></div><p className="section-note">This work does not depend on the launch decision and stays unchanged when you correct it.</p>
              {taskList(snapshot.items.filter(i=>i.kind==='task'&&!i.claims.includes('launch')))}
              <p className="document-foot">Draft generated from this meeting’s transcript. Review suggestions against the original conversation.</p>
            </>}
          </section>
          {inspecting && <aside className="evidence" hidden={!!preview} aria-label={correcting ? 'Correct the launch decision' : 'Launch decision factors'}>
            <div className="evidence-heading"><p className="eyebrow">Pre Share / Launch decision</p><button className="text-button" onClick={backToNotes}>Back to notes</button></div>
            <h2 ref={inspectorHeading} tabIndex="-1">{correcting ? 'Correct this decision' : 'Launch decision factors'}</h2>
            {!correcting ? <>
              <p className="inspection-intro">The recorded decision, the context behind it, and the work connected to it.</p>
              <div className="recorded-decision"><span className="row-label">In your recap</span><p>{launch.text}</p><span className="classification-tag">{snapshot.classification}</span></div>
              <section className="factor-section" aria-labelledby="factors-title"><h3 id="factors-title">What the conversation establishes</h3>
                <div className="factor"><div><h4>Timing discussed</h4><p>Friday is the target, pending the finished copy.</p></div><button className="text-button" onClick={e=>openSource(['q-question','q-wait'],e)}>Source: Maya, 06:03</button></div>
                <div className="factor"><div><h4>Condition stated</h4><blockquote>“{launchQuote.text}”</blockquote></div><button className="text-button" onClick={e=>openSource(['q-copy','q-launch'],e)}>Source: Maya, 08:42</button></div>
                <div className="factor"><div><h4>Follow-through</h4><p>Sam coordinates the launch. The announcement follows confirmation, and the checklist stays open until the copy review is done.</p></div><button className="text-button" onClick={e=>openSource(['q-work'],e)}>Source: Sam, 08:49</button></div>
              </section>
              <section className="factor-section" aria-labelledby="related-title"><h3 id="related-title">Work connected to this decision</h3><ul className="related-tasks">{snapshot.items.filter(i=>i.kind==='task'&&i.claims.includes('launch')).map(i=><li key={i.id}><span>{i.text}</span><small>{i.owner} · {i.state}</small></li>)}</ul><p className="independent-task"><strong>Separate work:</strong> Jules’s research notes do not depend on this decision.</p></section>
              <div className="factor-actions"><button onClick={backToNotes}>Back to notes</button><button className="text-button" onClick={()=>{setCorrecting(true);setNotice('');}}>Correct this decision</button><p>Reviewing these details does not change your notes or tasks.</p></div>
            </> : <>
              <p className="inspection-intro">Change how this decision is recorded. We’ll prepare updates to the related work for you to review before anything changes.</p>
              <div className="evidence-comparison"><div className="comparison"><span>Currently in the recap</span><p>{launch.text}</p><small>Recorded as: {snapshot.classification}</small></div><div className="source-excerpt"><div className="speaker"><span className="avatar">M</span><strong>Maya</strong><span>08:42</span></div><blockquote>“{launchQuote.text}”</blockquote><button className="text-button" onClick={e=>openSource(['q-question','q-wait','q-launch','q-work'],e)}>Read the surrounding conversation</button></div></div>
              <fieldset><legend>Record Friday as</legend>{classifications.map(c=><label key={c} className={`option ${choice===c?'selected':''}`}><input type="radio" name="classification" checked={choice===c} onChange={()=>choose(c)}/><span><strong>{c==='Decided'?'Confirmed':c==='Conditional'?'Conditional on the copy review':'Not decided'}</strong><small>{c==='Decided'?'Decided: a firm commitment':c==='Conditional'?'Conditional: keep the requirement attached':'Open: no launch commitment'}</small></span></label>)}</fieldset>
              {choice==='Conditional' && <label className="condition"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setPreview(null);setRejection(null);}}/><span>Include this condition:<strong>The copy review must be finished.</strong></span></label>}
              {choice==='Decided' && snapshot.classification!=='Decided' && <p className="caution">The quote does not confirm an unconditional commitment. This restores the seeded mistake.</p>}
              <p className="scope-note">Only the launch sentence and its 3 related tasks can change. The rest of the recap, research notes, and owners stay as they are.</p>
              <div className="correction-actions"><button className="primary" disabled={!ready} onClick={()=>request()}>Preview related updates</button><button onClick={cancelCorrection}>Cancel correction</button></div><p className="hint">{!ready ? (choice===snapshot.classification?'No change selected.':'Include the source condition to continue.') : 'Saved example in this demo. Nothing changes until you apply it.'}</p>
              {rejection && <section className="rejection"><h3 ref={rejectHeading} tabIndex="-1">Nothing changed. This repair went too far.</h3><p>{rejection.reason}</p><p><strong>Attempted:</strong> “{rejection.text}”</p><button onClick={()=>request()}>Use saved example instead</button></section>}
              <details className="failure-demo"><summary>Demo: try a repair that changes too much</summary><p>This deliberately injected response also changes Jules’s unrelated research task. It is not a live model failure.</p><button disabled={!ready} onClick={()=>request(true)}>Run rejection example</button></details>
            </>}
          </aside>}

        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="announcement">{notice}</p>
      </main>
    </div>
    <footer>Pre Share · A feature experiment by Arman Musaji · Pass 08 <span>No recording, task assignment, or sharing happens in this prototype.</span></footer>
    <dialog ref={dialog} onCancel={e=>{e.preventDefault();closeSource();}} aria-labelledby="source-title"><div className="dialog-head"><h2 id="source-title">From the meeting transcript</h2><button onClick={closeSource}>Close source</button></div>{quotes.filter(q=>source?.includes(q.id)).map(q=><figure key={q.id}><figcaption>{q.speaker} · {q.time}</figcaption><blockquote>“{q.text}”</blockquote></figure>)}<p className="hint">Fictional transcript. Source quotes stay unchanged when you correct the draft.</p></dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
