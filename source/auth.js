(() => {
 'use strict';
 const el = id => document.getElementById(id);
 const config = JSON.parse(el('auth-config').textContent);
 // Empty configuration leaves the course fully usable as a standalone file.
 if (!config.supabaseUrl || !config.publishableKey) return;

 const panel = el('account'), signIn = el('auth-signin'), signOut = el('auth-signout');
 const accountName = el('auth-account'), status = el('auth-status');
 const url = new URL(location.href);
 const fragment = new URLSearchParams(url.hash.slice(1));
 const code = url.searchParams.get('code');
 const authError = url.searchParams.get('error') || fragment.get('error');
 // Capture OAuth parameters before the course canonicalizes the lesson fragment.
 if (code || authError) {
  for (const name of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(name);
  if (fragment.has('error')) url.hash = '';
  history.replaceState(null, '', url.pathname + url.search + url.hash);
 }
 let client, session = null, busy = true;
 let authRevision = 0, resolvingCallback = !!code;
 function applySession(next) {
  session = next;
  window.math2aiProgress.setSession(client,next);
  render();
 }
 panel.hidden = false;
 function render() {
  const user = session?.user;
  signIn.hidden = !!user;
  signOut.hidden = !user;
  accountName.hidden = !user;
  accountName.textContent = user?.email || (user ? 'Signed in' : '');
  signIn.disabled = busy;
  signOut.disabled = busy;
  panel.setAttribute('aria-busy', String(busy));
 }
 function message(text) { status.textContent = text; }
 function storageAvailable() {
  const probe = 'math2ai-auth-storage-check';
  try {
   localStorage.setItem(probe, '1');
   const available = localStorage.getItem(probe) === '1';
   localStorage.removeItem(probe);
   return available;
  } catch { return false; }
 }
 render();
 if (!['https:', 'http:'].includes(location.protocol)) {
  window.math2aiProgress.setSession(null,null);
  message('Open the website to sign in. Practice works here without an account.');
  panel.setAttribute('aria-busy', 'false');
  return;
 }
 if (!storageAvailable()) {
  window.math2aiProgress.setSession(null,null);
  message('Sign-in needs browser storage. You can still practice without an account.');
  panel.setAttribute('aria-busy', 'false');
  return;
 }
 try {
  client = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
   auth: {
    flowType: 'pkce', detectSessionInUrl: false,
    persistSession: true, autoRefreshToken: true,
    storageKey: 'math2ai-auth-' + new URL(config.supabaseUrl).hostname
   }
  });
 } catch {
  window.math2aiProgress.setSession(null,null);
  message('Sign-in is unavailable. You can still practice without an account.');
  panel.setAttribute('aria-busy', 'false');
  return;
 }
 // Keep this callback synchronous: calling Auth methods here can deadlock the SDK.
 client.auth.onAuthStateChange((event, nextSession) => {
  if (resolvingCallback && event === 'INITIAL_SESSION' && !nextSession) return;
  authRevision++;
  applySession(nextSession);
 });

 signIn.onclick = async () => {
  if (busy) return;
  busy = true; message('Opening Google…'); render();
  try {
   if (!storageAvailable()) throw new Error('Storage unavailable');
   const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
     redirectTo: location.origin + location.pathname,
     skipBrowserRedirect: true,
     queryParams: { prompt: 'select_account' }
    }
   });
   if (error || !data?.url) throw error || new Error('Missing sign-in URL');
   location.assign(data.url);
  } catch {
   busy = false; render();
   message('Could not open Google sign-in. Please try again.');
  }
 };
 signOut.onclick = async () => {
  if (busy) return;
  busy = true; message('Signing out…'); render();
  try {
   // Sign out this browser session; other devices can remain signed in.
   const { error } = await client.auth.signOut({ scope: 'local' });
   if (error) throw error;
   applySession(null); message('Signed out.');
  } catch {
   message('Could not sign out. Check your connection and try again.');
  } finally {
   busy = false; render();
   (session ? signOut : signIn).focus();
  }
 };
 // The browser may restore a busy page when Back is used on Google's screen.
 window.addEventListener('pageshow', event => {
  if (event.persisted) { busy = false; message(''); render(); }
 });
 async function initialize() {
  try {
   if (authError) {
    message(authError === 'access_denied' ? 'Sign-in cancelled.' : 'Sign-in did not finish. Please try again.');
   } else if (code) {
    message('Finishing sign-in…');
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data?.session) throw error || new Error('Missing session');
    applySession(data.session);
    message('');
   }
   const revision = authRevision;
   const { data, error } = await client.auth.getSession();
   if (error) throw error;
   if (revision === authRevision) applySession(data.session);
  } catch {
   if (!authRevision) applySession(null);
   message('Sign-in did not finish. Please try again. Your saved answers are unchanged.');
  } finally { resolvingCallback = false; busy = false; render(); }
 }
 void initialize();
})();
