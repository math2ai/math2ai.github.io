(() => {
 'use strict';
 const course = JSON.parse(document.getElementById('course-data').textContent);
 const config = JSON.parse(document.getElementById('auth-config').textContent);
 const questions = new Map(course.concepts.flatMap(c => c.questions.map(q => [q.id, {q, concept:c.legacyId}])));
 const base = 'math2ai-progress-v3:' + (config.supabaseUrl ? new URL(config.supabaseUrl).hostname : 'offline') + ':' + course.version + ':';
 const legacyKey = 'model-conversations-progress-v1';
 const listeners = new Set(), memory = new Map();
 let current = null, storageOK = true, serial = 0;
 const uuid = () => crypto.randomUUID();
 const parse = raw => { try { return JSON.parse(raw); } catch { return null; } };
 function read(key) {
  if (memory.has(key)) return memory.get(key);
  try { return localStorage.getItem(key); }
  catch { storageOK = false; return memory.get(key) ?? null; }
 }
 function write(key, value) {
  try { localStorage.setItem(key, value); memory.delete(key); } catch { storageOK = false; memory.set(key,value); }
 }
 function remove(key) {
  try { localStorage.removeItem(key); memory.delete(key); } catch { storageOK = false; memory.set(key,null); }
 }
 function keys(prefix) {
  const found = new Set([...memory.keys()].filter(k => k.startsWith(prefix)));
  try { for (let i=0; i<localStorage.length; i++) { const k=localStorage.key(i); if (k?.startsWith(prefix)) found.add(k); } }
  catch { storageOK = false; }
  return [...found];
 }
 const keyFor = (ctx, suffix) => base + ctx.owner + ':' + suffix;
 function pending(ctx) {
  return keys(keyFor(ctx, 'attempt:')).map(k => parse(read(k))).filter(op => op && questions.has(op.question_id)
   && Number.isInteger(op.answer) && op.answer >= 0 && op.answer < 4 && typeof op.id === 'string')
   .sort((a,b) => a.time-b.time || a.id.localeCompare(b.id));
 }
 const guest = {owner:'guest',user:null};
 const transferKey = id => base + 'guest-transfer:' + id;
 function transfers() {
  return keys(transferKey('')).map(k => parse(read(k))).filter(t => t && typeof t.id === 'string'
   && typeof t.owner === 'string' && Array.isArray(t.operations));
 }
 function guestAnswers() {
  const claimed = new Set(transfers().flatMap(t => t.operations.map(op => op.id)));
  const epoch = read(keyFor(guest,'epoch')) || '0';
  return pending(guest).filter(op => op.epoch === epoch && !claimed.has(op.id));
 }
 function mergeView(accountView, guestView) {
  if (!guestView || typeof guestView !== 'object') return accountView;
  const concepts = {...accountView?.concepts};
  for (const [id,p] of Object.entries(guestView.concepts || {})) if (p?.active) concepts[id] = p;
  return {...accountView,...guestView,concepts};
 }
 async function claimGuest(ctx) {
  const run = () => {
   if (current !== ctx) return;
   const operations = guestAnswers();
   if (operations.length) {
    const view = parse(read(keyFor(guest,'view')));
    // One durable ownership record protects the originals until the account upload is acknowledged.
    const transfer = {id:uuid(),owner:ctx.owner,epoch:null,operations,view};
    write(transferKey(transfer.id),JSON.stringify(transfer));
    const merged = mergeView(parse(read(keyFor(ctx,'view'))),view);
    if (merged) write(keyFor(ctx,'view'),JSON.stringify(merged));
    ctx.viewRevision++;
   }
   ctx.incoming = []; ctx.incomingView = null;
   notify();
  };
  if (navigator.locks?.request) await navigator.locks.request(base + 'guest-transfer',run); else run();
 }
 function finishTransfers(ctx, ids, discardedEpoch=false) {
  for (const t of transfers()) if (t.owner === ctx.owner) {
   const discard = discardedEpoch && t.epoch !== null && t.epoch !== ctx.snapshot.epoch;
   const completed = t.operations.filter(op => discard || ids.has(op.id));
   for (const op of completed) remove(keyFor(guest,'attempt:' + op.id));
   t.operations = t.operations.filter(op => !completed.includes(op));
   if (t.operations.length) write(transferKey(t.id),JSON.stringify(t));
   else remove(transferKey(t.id));
  }
 }
 function prepareTransfers(ctx) {
  finishTransfers(ctx,new Set(),true);
  for (const t of transfers()) if (t.owner === ctx.owner) {
   // Bind to the server's current epoch once. Rebinding after a reset would resurrect cleared answers.
   if (t.epoch === null) { t.epoch = ctx.snapshot.epoch; write(transferKey(t.id),JSON.stringify(t)); }
   for (const op of t.operations) {
    const key = keyFor(ctx,'attempt:' + op.id);
    if (!read(key)) write(key,JSON.stringify({...op,epoch:t.epoch}));
   }
  }
 }
 function validSnapshot(value) {
  return value && Number.isSafeInteger(value.epoch) && value.epoch >= 0 && Number.isSafeInteger(value.revision)
   && value.revision >= 0 && value.answers && typeof value.answers === 'object' && !Array.isArray(value.answers);
 }
 function cached(ctx) {
  const value = parse(read(keyFor(ctx, 'snapshot')));
  return validSnapshot(value) ? value : null;
 }
 function snapshot(ctx, value) {
  if (!validSnapshot(value)) throw Error('Invalid progress response');
  const stored = cached(ctx);
  const newest = stored && stored.revision > value.revision ? stored : value;
  if (ctx.snapshot && ctx.snapshot.revision > newest.revision) return;
  ctx.snapshot = newest;
  write(keyFor(ctx, 'snapshot'), JSON.stringify(newest));
  const reset = parse(read(keyFor(ctx,'reset-request')));
  if (reset && newest.epoch > reset.epoch) remove(keyFor(ctx,'reset-request'));
  // An explicit clear advances the server epoch. Offline writes to an old epoch cannot resurrect it.
  for (const op of pending(ctx)) if (op.epoch !== newest.epoch) remove(keyFor(ctx, 'attempt:' + op.id));
 }
 function addAnswer(answers, op) {
  const a = answers[op.question_id];
  answers[op.question_id] = {first:a ? a.first : op.answer, last:op.answer,
   attempts:(a?.attempts || 0)+1, choices:(a?.choices || 0) | (1 << op.answer)};
 }
 function answers(ctx) {
  const result = {};
  if (ctx?.snapshot) for (const [id,a] of Object.entries(ctx.snapshot.answers)) {
   if (questions.has(id) && a && [a.first,a.last].every(n => Number.isInteger(n) && n >= 0 && n < 4)
    && Number.isSafeInteger(a.attempts) && a.attempts > 0 && Number.isInteger(a.choices) && a.choices > 0 && a.choices < 16) result[id] = {...a};
  }
  const local = ctx ? (ctx.user ? pending(ctx).filter(op => op.epoch === ctx.snapshot?.epoch) : guestAnswers()) : [];
  const seen = new Set(local.map(op => op.id));
  for (const op of local) addAnswer(result,op);
  if (ctx?.user) {
   const incoming = [...(ctx.incoming || []),...transfers().filter(t => t.owner === ctx.owner && (t.epoch === null || t.epoch === ctx.snapshot?.epoch)).flatMap(t => t.operations)];
   for (const op of incoming) if (!seen.has(op.id)) { seen.add(op.id); addAnswer(result,op); }
  }
  return result;
 }
 function exported(ctx=current) {
  const rawView = mergeView(parse(read(keyFor(ctx, 'view'))),ctx.incomingView);
  const state = rawView && typeof rawView === 'object' && !Array.isArray(rawView) ? rawView : {version:course.version,current:0,concepts:{}};
  state.version = course.version;
  if (!state.concepts || typeof state.concepts !== 'object') state.concepts = {};
  for (const c of course.concepts) {
   const p = state.concepts[c.legacyId];
   state.concepts[c.legacyId] = p && typeof p === 'object' ? {...p,answers:{}} : {active:null,remaining:[],pending:true,answers:{}};
  }
  for (const [id,a] of Object.entries(answers(ctx))) {
   const {q,concept} = questions.get(id);
   state.concepts[concept].answers[id] = {first:a.first,last:a.last,attempts:a.attempts,solved:!!(a.choices & (1 << q.correct))};
  }
  return state;
 }
 function status() {
  const ctx = current;
  let message = ctx?.message || '';
  if (!storageOK) message = ctx?.user ? 'This browser cannot save locally. Keep this page open until answers finish syncing.' : 'This browser cannot save guest answers. Progress will be lost when this page closes.';
  return {owner:ctx?.owner || 'loading',ready:!!ctx?.ready,account:!!ctx?.user,viewRevision:ctx?.viewRevision || 0,message,state:ctx ? exported(ctx) : null};
 }
 function notify() { for (const fn of listeners) fn(status()); }
 function saveView(state) {
  if (!current?.ready) return;
  const view = {version:course.version,current:state.current,currentConceptId:state.currentConceptId,concepts:{}};
  for (const [id,p] of Object.entries(state.concepts)) view.concepts[id] = {active:p.active,remaining:p.remaining,pending:p.pending};
  write(keyFor(current, 'view'), JSON.stringify(view));
 }
 function importLegacy(ctx) {
  // The old unowned save is claimed once, after the initial authentication state is known.
  // Leave the original record untouched as a recovery copy; old pages can no longer overwrite new progress.
  const claimed = read(base + 'legacy-owner');
  if ((claimed && claimed !== ctx.owner) || read(base + 'legacy-imported')) return;
  if (!claimed) {
   write(base + 'legacy-source',read(legacyKey) || '');
   write(base + 'legacy-owner',ctx.owner);
  }
  const raw = read(base + 'legacy-source'), old = parse(raw);
  if (raw && !old) ctx.message = 'Saved progress could not be read. Starting fresh.';
  if (old?.version && old.version !== course.version) ctx.message = 'The question bank has been updated. Practice progress starts fresh with this update.';
  if (!old || old.version !== course.version || !old.concepts || typeof old.concepts !== 'object') { write(base + 'legacy-imported','1'); return; }
  if (!read(keyFor(ctx, 'view'))) {
   const view = {...old,concepts:{}};
   for (const [id,p] of Object.entries(old.concepts)) if (p && typeof p === 'object') view.concepts[id] = {active:p.active,remaining:p.remaining,pending:p.pending};
   write(keyFor(ctx, 'view'), JSON.stringify(view));
  }
  for (const [id,{q,concept}] of questions) {
   const a = old.concepts[concept]?.answers?.[id];
   if (!a || ![a.first,a.last].every(n => Number.isInteger(n) && n >= 0 && n < 4) || !Number.isSafeInteger(a.attempts) || a.attempts <= 0) continue;
   // Preserve selections, attempt totals, and an earlier correct answer from the legacy aggregate.
   const count = Math.min(a.attempts,1000);
   const selections = Array(count).fill(a.last); selections[0] = a.first;
   if (a.solved && !selections.includes(q.correct)) {
    if (count >= 3) selections[1] = q.correct; else selections.splice(Math.max(0,count-1),0,q.correct);
   }
   const parts = id.match(/^(\d+)(?:-r(\d+))?-(\d+)$/);
   for (const [index,answer] of selections.entries()) {
    // Stable import IDs let a reload safely resume an interrupted migration.
    const importId = '00000000-0000-4000-8000-' + parts[1].padStart(3,'0') + (parts[2] || '0').padStart(3,'0') + parts[3].padStart(2,'0') + String(index).padStart(4,'0');
    const op = {id:importId,question_id:id,answer,epoch:ctx.user ? ctx.snapshot.epoch : ctx.epoch,time:index};
    write(keyFor(ctx,'attempt:' + op.id), JSON.stringify(op));
   }
  }
  write(base + 'legacy-imported','1');
 }
 async function migrate(ctx) {
  const run = () => { if (current === ctx) importLegacy(ctx); };
  if (navigator.locks?.request) await navigator.locks.request(base + 'migration',run); else run();
 }
 async function sync(ctx=current) {
  if (!ctx?.user || current !== ctx || ctx.resetting) return;
  if (ctx.running) { ctx.again = true; return; }
  ctx.running = true;
  try {
   do {
    ctx.again = false;
    const epoch = ctx.snapshot?.epoch ?? null;
    const batch = pending(ctx).filter(op => op.epoch === epoch).slice(0,100);
    const {data,error} = await ctx.client.rpc('math2ai_sync',{
     p_user_id:ctx.user,p_course_version:course.version,p_epoch:epoch,
     p_attempts:batch.map(({id,question_id,answer}) => ({id,question_id,answer}))
    });
    if (current !== ctx || ctx.resetting) return;
    if (error) throw error;
    snapshot(ctx,data);
    finishTransfers(ctx,new Set(batch.map(op => op.id)));
    for (const op of batch) remove(keyFor(ctx,'attempt:' + op.id));
    await migrate(ctx);
    if (current !== ctx) return;
    prepareTransfers(ctx);
    ctx.ready = true; ctx.message = '';
    notify();
   } while (current === ctx && (ctx.again || pending(ctx).length));
  } catch (error) {
   if (current !== ctx) return;
   ctx.message = ['PGRST202','42P01','42883'].includes(error?.code) ? 'Account saving needs the Supabase database setup.'
    : ctx.ready ? 'Answers saved on this device. Waiting to sync.' : 'Could not load saved answers. Reconnect, or sign out to practice.';
   notify();
  } finally { ctx.running = false; }
 }
 function connect(ctx, session) {
  // This runs after the Auth callback returns, avoiding SDK lock re-entry.
  if (current !== ctx) return;
  void ctx.client.realtime.setAuth(session.access_token);
  ctx.channel = ctx.client.channel('math2ai-progress-' + ctx.user + '-' + uuid())
   .on('postgres_changes',{event:'*',schema:'public',table:'math2ai_progress',filter:'user_id=eq.' + ctx.user}, payload => {
    if (payload.new?.course_version === course.version) void sync(ctx);
   }).subscribe(state => { if (state === 'SUBSCRIBED') void sync(ctx); });
  void sync(ctx);
 }
 function setSession(client, session) {
  const user = session?.user?.id || null, owner = user ? 'user:' + user : 'guest';
  if (current?.owner === owner) {
   if (user) setTimeout(() => { if (current?.owner === owner) { void client.realtime.setAuth(session.access_token); void sync(); } },0);
   return;
  }
  const old = current;
  const ctx = current = {owner,user,client,ready:false,snapshot:null,message:user ? 'Loading saved answers…' : '',running:false,again:false,viewRevision:0};
  if (old?.channel) setTimeout(() => { void old.client.removeChannel(old.channel); },0);
  if (user) {
   ctx.snapshot = cached(ctx); ctx.ready = !!ctx.snapshot;
   ctx.incoming = guestAnswers();
   if (ctx.incoming.length) ctx.incomingView = parse(read(keyFor(guest,'view')));
  }
  else { ctx.epoch = read(keyFor(ctx,'epoch')) || '0'; }
  notify(); // Clear the previous account immediately, before any network work.
  setTimeout(async () => {
   if (current !== ctx) return;
   if (user) { await claimGuest(ctx); if (current === ctx) connect(ctx,session); }
   else { await migrate(ctx); if (current === ctx) { ctx.ready = true; notify(); } }
  },0);
 }
 function record(questionId, answer) {
  const ctx = current;
  if (!ctx?.ready || !questions.has(questionId) || !Number.isInteger(answer) || answer < 0 || answer > 3) return false;
  const newer = ctx.user ? cached(ctx) : null;
  if (newer && newer.epoch !== ctx.snapshot.epoch) { snapshot(ctx,newer); notify(); return false; }
  if (!ctx.user && (read(keyFor(ctx,'epoch')) || '0') !== ctx.epoch) { ctx.epoch = read(keyFor(ctx,'epoch')) || '0'; notify(); return false; }
  const op = {id:uuid(),question_id:questionId,answer,epoch:ctx.user ? ctx.snapshot.epoch : ctx.epoch,time:Date.now() + serial++/10000};
  write(keyFor(ctx,'attempt:' + op.id), JSON.stringify(op));
  if (ctx.user) { ctx.message = 'Saving answers…'; setTimeout(() => { void sync(ctx); },0); }
  return true;
 }
 async function reset() {
  const ctx = current;
  if (!ctx?.ready) return false;
  if (!ctx.user) {
   ctx.epoch = uuid(); write(keyFor(ctx,'epoch'),ctx.epoch);
   // Delete only old guest operations. A stale tab checks the epoch before accepting an answer.
   const claimed = new Set(transfers().flatMap(t => t.operations.map(op => op.id)));
   for (const op of pending(ctx)) if (op.epoch !== ctx.epoch && !claimed.has(op.id)) remove(keyFor(ctx,'attempt:' + op.id));
   remove(keyFor(ctx,'view')); notify(); return true;
  }
  ctx.resetting = true; ctx.ready = false; ctx.message = 'Clearing saved answers…'; notify();
  const request = parse(read(keyFor(ctx,'reset-request')))?.id || uuid();
  write(keyFor(ctx,'reset-request'),JSON.stringify({id:request,epoch:ctx.snapshot.epoch}));
  try {
   const {data,error} = await ctx.client.rpc('math2ai_reset',{p_user_id:ctx.user,p_course_version:course.version,p_request_id:request});
   if (current !== ctx) return false;
   if (error) throw error;
   snapshot(ctx,data); finishTransfers(ctx,new Set(),true); remove(keyFor(ctx,'reset-request')); remove(keyFor(ctx,'view'));
   ctx.message = ''; return true;
  } catch {
   if (current === ctx) ctx.message = 'Could not confirm the reset. Reconnect and try Clear saved answers again.';
   return false;
  } finally { if (current === ctx) { ctx.resetting = false; ctx.ready = true; notify(); void sync(ctx); } }
 }
 window.math2aiProgress = {subscribe(fn){listeners.add(fn);fn(status());return () => listeners.delete(fn);},
  setSession,record,saveView,reset,status,load:() => current ? exported() : null,sync:() => sync()};
 window.addEventListener('storage',event => {
  const ctx = current;
  const transferChanged = event.key?.startsWith(transferKey(''));
  if (!ctx || (event.key !== null && !event.key.startsWith(keyFor(ctx,'')) && !transferChanged)) return;
  // Do not let a memory fallback shadow a deletion or reset received from another tab.
  if (event.key) memory.delete(event.key); else memory.clear();
  if (ctx.user) { const value = cached(ctx); if (value && (!ctx.snapshot || value.revision >= ctx.snapshot.revision)) ctx.snapshot = value; }
  else ctx.epoch = read(keyFor(ctx,'epoch')) || '0';
  notify();
  if (ctx.user && (event.key === null || event.key.includes(':attempt:'))) void sync(ctx);
 });
 const resume = () => {
  if (document.visibilityState === 'hidden') return;
  if (current && !current.user) { current.epoch = read(keyFor(current,'epoch')) || '0'; notify(); }
  else void sync();
 };
 window.addEventListener('online',resume); window.addEventListener('focus',resume);
 window.addEventListener('pageshow',resume); document.addEventListener('visibilitychange',resume);
 // Realtime is the fast path; this bounded reconciliation also repairs missed events and reconnects.
 setInterval(resume,30000);
 if (!config.supabaseUrl || !config.publishableKey) setSession(null,null);
})();
