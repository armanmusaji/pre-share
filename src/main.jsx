import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import './style.css';
import { initial, classifications, quotes, savedPatch, validate, apply, restore } from './model.js';

function App() {
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
  function reset() { setSnapshot(restore(snapshot, initial())); setHistory([]); setChoice('Decided'); setConfirmed(false); setPreview(null); setRejection(null); setNotice('Original example restored.'); heading.current.focus(); }
  const launch = snapshot.items[0];
  return <>
    <a className="skip" href="#workspace">Skip to meeting review</a>
    <header className="intro">
      <div className="topline"><span>Arman Musaji / AI workflow experiment 02</span><button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? 'Light theme' : 'Dark theme'}</button></div>
      <div className="intro-copy"><h1>Before you share<span className="period">.</span></h1><p>A meeting recap turns a possibility into a promise. Correct the claim and see what else needs to change.</p></div>
      <p className="demo-note"><strong>Try it:</strong> inspect “Launch Friday,” change Decided to Conditional, then review the repair. <span>Fictional meeting. Seeded mistake. Saved examples only in this first build.</span></p>
    </header>
    <main id="workspace" className="workspace">
      <div className="workspace-head"><div><p className="eyebrow">Product team / Launch check-in</p><h2 ref={heading} tabIndex="-1">Review before sharing</h2></div><div className="tools"><button disabled={!history.length} onClick={undo}>Undo correction</button><button onClick={reset}>Reset example</button></div></div>
      <div className="review-layout">
        <section className="claim-panel" aria-labelledby="claim-title">
          <p className="eyebrow">The claim</p><h3 id="claim-title">Is Friday a commitment?</h3>
          <p className="current">Recap currently says</p><p className="claim-text">{launch.text}</p>
          <div className="claim-meta"><span className="label">{snapshot.classification}</span><button className="source-button" onClick={e => openSource(launch.sources, e)}>View date source ↗</button></div>
          <fieldset><legend>How should this be classified?</legend>{classifications.map(c => <label key={c} className={`option ${choice === c ? 'selected' : ''}`}><input type="radio" name="classification" value={c} checked={choice === c} onChange={() => choose(c)}/><span><strong>{c}</strong><small>{c === 'Decided' ? 'A commitment has been made' : c === 'Conditional' ? 'It depends on a stated condition' : 'No commitment has been made'}</small></span></label>)}</fieldset>
          {choice === 'Conditional' && <label className="condition"><input type="checkbox" checked={confirmed} onChange={e => {setConfirmed(e.target.checked); setPreview(null); setRejection(null);}}/><span>Confirm the source condition:<br/><strong>The copy review must be finished.</strong></span></label>}
          {choice === 'Decided' && snapshot.classification !== 'Decided' && <p className="caution">The source does not establish an unconditional commitment. This choice restores the seeded mistake. Classification is your judgment, not a verified fact.</p>}
          <button className="primary" disabled={!ready} onClick={() => request()}>Preview saved repair <span aria-hidden="true">→</span></button>
          {!ready && <p className="hint">{choice === snapshot.classification ? 'Choose a different classification to preview a repair.' : 'Confirm the condition to continue.'}</p>}
          <details className="failure-demo"><summary>Test an out-of-scope change</summary><p>This deliberately injected response also tries to delay the unrelated research notes. It is not a live AI failure.</p><button disabled={!ready} onClick={() => request(true)}>Run rejection example</button></details>
        </section>
        <section className="consequences" aria-labelledby="outputs-title">
          <div className="section-title"><h3 id="outputs-title">What depends on this</h3><span>1 recap line + 3 tasks</span></div>
          {rejection && <section className="rejection" aria-labelledby="rejection-title"><p className="eyebrow">Injected response / Rejected</p><h4 id="rejection-title" ref={rejectHeading} tabIndex="-1">The repair reached too far.</h4><p>{rejection.reason}</p>{rejection.text && <p><strong>Attempted change:</strong> “{rejection.text}” · {rejection.state}</p>}<p>None of this response was applied.</p><button onClick={() => request()}>Use saved example instead</button></section>}
          {preview && <div className="preview-head"><p className="eyebrow">Saved example / Not applied</p><h4 ref={previewHeading} tabIndex="-1">Review the linked changes</h4><p>{snapshot.classification} → {choice}. Check the meaning against the source. Scope checks do not prove that the wording is right.</p></div>}
          <div className="output-group"><h4>Recap</h4>{snapshot.items.filter(i => i.kind === 'recap').map(i => <Output key={i.id} item={i} edit={preview?.edits.find(e => e.id === i.id)} onSource={openSource}/>)}</div>
          <div className="output-group"><h4>Tasks</h4><ol className="task-list">{snapshot.items.filter(i => i.kind === 'task').map(i => <li key={i.id}><Output item={i} edit={preview?.edits.find(e => e.id === i.id)} onSource={openSource}/></li>)}</ol></div>
          {preview && <div className="accept-bar"><p>Apply the claim and all four linked items together.</p><div><button className="primary" onClick={accept}>Accept correction</button><button onClick={() => {setPreview(null); setNotice('Preview cancelled. Accepted content has not changed.'); heading.current.focus();}}>Cancel preview</button></div></div>}
        </section>
      </div>
      <p className="announcement" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
    </main>
    <footer><span>Working prototype / Pass 01</span><span>Nothing is sent or shared. Live AI is not connected.</span></footer>
    <dialog ref={dialog} onCancel={e => {e.preventDefault(); closeSource();}} aria-labelledby="source-title"><div className="dialog-head"><div><p className="eyebrow">Fictional transcript</p><h2 id="source-title">What was actually said</h2></div><button onClick={closeSource}>Close source</button></div>{quotes.filter(q => source?.includes(q.id)).map(q => <figure key={q.id}><figcaption>{q.speaker} <span>{q.time}</span></figcaption><blockquote>“{q.text}”</blockquote></figure>)}<p className="hint">These source quotes never change when a repair is accepted.</p></dialog>
  </>;
}
function Output({item, edit, onSource}) {
  const related = item.claims.includes('launch');
  return <article className={`output ${related ? 'linked' : 'unrelated'}`}><div className="output-meta"><span>{related ? 'Linked to launch' : 'Independent · Unchanged'}</span>{item.owner && <span>Owner: {item.owner}</span>}</div>{edit ? <div className="diff"><div><span className="diff-label">Before</span><p>{item.text}</p>{item.state && <span className="task-state">{item.state}</span>}</div><div className="after"><span className="diff-label">After</span><p>{edit.text}</p>{edit.state && <span className="task-state">{edit.state}</span>}</div></div> : <><p className="output-text">{item.text}</p>{item.state && <span className="task-state">{item.state}</span>}</>}<button className="source-button" onClick={e => onSource(item.sources, e)} aria-label={`View source for ${item.text}`}>{item.owner ? 'View owner and task source' : 'View commitment source'} ↗</button></article>;
}
createRoot(document.getElementById('root')).render(<App/>);
