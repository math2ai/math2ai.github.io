// Run the real UI handlers with controlled Auth responses; no external accounts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const root = new URL('.', import.meta.url);
const authJs = fs.readFileSync(new URL('auth.js', root), 'utf8');
const siteJs = fs.readFileSync(new URL('site.js', root), 'utf8');
const course = JSON.parse(fs.readFileSync(new URL('dist/curriculum.json', root), 'utf8'));
const config = {supabaseUrl:'https://example.supabase.co', publishableKey:'sb_publishable_test_only'};
const user = {id:'00000000-0000-4000-8000-000000000001',email:'learner@example.test'};
const signedIn = {user,access_token:'test-access-token',refresh_token:'test-refresh-token',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer'};
const progressKey = 'model-conversations-progress-v1';
const flush = async () => { for (let i=0;i<8;i++) await new Promise(resolve=>setImmediate(resolve)); };
function boot({configuration=config, href='https://math2ai.github.io/#lesson-101', session=null,
 storage=new Map(), blocked=false, failures={}, realSdk=false, withCourse=false}={}) {
 let currentUrl = new URL(href), callback, currentSession=session;
 const elements=new Map(), events={}, calls=[], errors=[];
 const get=id=>{
  if (!elements.has(id)) elements.set(id,{id,textContent:'',innerHTML:'',hidden:['account','auth-account','auth-signout'].includes(id),disabled:false,value:'',attributes:{},handlers:{},
   setAttribute(k,v){this.attributes[k]=v;},classList:{toggle(){}},focus(){this.focused=true;},
   addEventListener(name,fn){this.handlers[name]=fn;},querySelector(){return {focus(){}};}});
  return elements.get(id);
 };
 get('auth-config').textContent=JSON.stringify(configuration);
 get('course-data').textContent=JSON.stringify(course);
 const localStorage={getItem(k){if(blocked)throw Error('blocked');return storage.get(k)??null;},
  setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v);},removeItem(k){if(blocked)throw Error('blocked');storage.delete(k);}};
 const location={get href(){return currentUrl.href;},get origin(){return currentUrl.origin;},get pathname(){return currentUrl.pathname;},
  get search(){return currentUrl.search;},get hash(){return currentUrl.hash;},get protocol(){return currentUrl.protocol;},
  assign(value){calls.push(['redirect',value]);}};
 const auth={
  onAuthStateChange(fn){callback=fn;return {data:{subscription:{unsubscribe(){}}}};},
  async getSession(){return {data:{session:currentSession},error:failures.session};},
  async exchangeCodeForSession(code){calls.push(['exchange',code]); if(failures.exchange)throw Error('exchange');currentSession=signedIn;callback('SIGNED_IN',signedIn);return {data:{session:signedIn},error:null};},
  async signInWithOAuth(options){calls.push(['signIn',options]);if(failures.signIn)throw Error('offline');return {data:{url:config.supabaseUrl+'/auth/v1/authorize?provider=google'},error:null};},
  async signOut(options){calls.push(['signOut',options]);if(failures.signOut)return {error:Error('offline')};currentSession=null;callback('SIGNED_OUT',null);return {error:null};}
 };
 const sandbox={URL,URLSearchParams,JSON,Math,Date,Promise,Response,Headers,Request,TextEncoder,TextDecoder,AbortController,
  atob,btoa,crypto:webcrypto,navigator:{},localStorage,location,
  document:{getElementById:get,title:'',visibilityState:'visible',addEventListener(){}},
  history:{replaceState(_a,_b,value){currentUrl=new URL(value,currentUrl);}},
  setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms);id.unref();return id;},clearTimeout,
  setInterval:(fn,ms)=>{const id=setInterval(fn,ms);id.unref();return id;},clearInterval,
  console:{log(){},warn(){},error(...v){errors.push(v);}},
  addEventListener(name,fn){events[name]=fn;},removeEventListener(){},scrollTo(){},confirm:()=>true,
  supabase:{createClient(url,key,options){calls.push(['create',url,key,options]);return {auth};}},
  async fetch(input,options={}) {
   const target=String(input); calls.push(['fetch',target,options]);
   if(target.includes('/token?grant_type=pkce')) {
    const body=JSON.parse(options.body);
    assert.equal(body.auth_code,'accepted-code');
    assert.ok(body.code_verifier?.length>=43,'Real SDK must send the saved PKCE verifier');
    return new Response(JSON.stringify(signedIn),{status:200,headers:{'Content-Type':'application/json'}});
   }
   if(target.includes('/logout?scope=local')) return new Response(null,{status:204});
   throw Error('Unexpected request: '+target);
  }
 };
 sandbox.window=sandbox;sandbox.self=sandbox; sandbox.math2aiProgress={setSession(_client,next){calls.push(['owner',next?.user?.id || null]);}};
 const context=vm.createContext(sandbox);
 if(realSdk)vm.runInContext(fs.readFileSync(new URL('vendor/supabase-2.105.0.js',root),'utf8'),context);
 vm.runInContext(authJs,context);
 if(withCourse)vm.runInContext(siteJs,context);
 return {get,storage,calls,errors,url:()=>currentUrl,events,
  emit(event,next){currentSession=next;callback(event,next);},
  answer(){const c=course.concepts.find(c=>c.title===get('title').textContent);const q=c.questions.find(q=>q.question===get('question').textContent);get('choices').handlers.change({target:{name:'answer',value:String(q.correct)}});get('quiz-form').handlers.submit({preventDefault(){}});},
  reset(){get('reset').onclick();}
 };
}

const guest=boot({configuration:{supabaseUrl:'',publishableKey:''}});await flush();
assert.equal(guest.get('account').hidden,true);assert.equal(guest.calls.length,0);
const a=boot();await flush();
assert.equal(a.get('auth-signin').disabled,false);
await a.get('auth-signin').onclick();
const login=a.calls.find(c=>c[0]==='signIn')[1];
assert.equal(login.provider,'google');assert.equal(login.options.redirectTo,'https://math2ai.github.io/');
assert.equal(login.options.skipBrowserRedirect,true);
a.events.pageshow({persisted:true});assert.equal(a.get('auth-signin').disabled,false);
a.emit('SIGNED_IN',signedIn);assert.equal(a.get('auth-account').textContent,user.email);
assert.equal(a.calls.at(-1)[1],user.id);
await a.get('auth-signout').onclick();
assert.equal(a.calls.find(c=>c[0]==='signOut')[1].scope,'local');
assert.equal(a.calls.at(-1)[1],null);assert.equal(a.get('auth-signin').hidden,false);
const restored=boot({session:signedIn});await flush();
assert.equal(restored.get('auth-account').textContent,user.email);
restored.emit('SIGNED_OUT',null);assert.equal(restored.calls.at(-1)[1],null);
console.log('PASS: Google redirect, browser Back, session events and sign-out switch progress ownership.');
const callback=boot({href:'https://math2ai.github.io/?campaign=hello&code=accepted-code#lesson-101'});await flush();
assert.equal(callback.url().search,'?campaign=hello');assert.equal(callback.url().hash,'#lesson-101');
assert.equal(callback.get('auth-account').textContent,user.email);
for(const href of ['https://math2ai.github.io/?error=access_denied&error_description=untrusted#lesson-101','https://math2ai.github.io/#error=access_denied&error_description=untrusted']){
 const cancelled=boot({href});await flush();assert.equal(cancelled.get('auth-status').textContent,'Sign-in cancelled.');
 assert.ok(!cancelled.url().href.includes('error'));assert.equal(cancelled.get('auth-signin').disabled,false);
}
const badCallback=boot({href:'https://math2ai.github.io/?code=expired#lesson-101',failures:{exchange:true}});await flush();
assert.match(badCallback.get('auth-status').textContent,/did not finish/);assert.equal(badCallback.url().search,'');
for(const failure of ['signIn','signOut']) {
 const app=boot({session:failure==='signOut'?signedIn:null,failures:{[failure]:true}});await flush();
 await app.get(failure==='signIn'?'auth-signin':'auth-signout').onclick();
 assert.match(app.get('auth-status').textContent,/Could not/);
 assert.equal(app.get(failure==='signIn'?'auth-signin':'auth-signout').disabled,false);
}
for(const options of [{blocked:true},{href:'file:///tmp/math2ai/index.html#lesson-101'}]){
 const app=boot(options);await flush();assert.equal(app.get('auth-signin').disabled,true);
 assert.ok(!app.calls.some(c=>c[0]==='create'));assert.equal(app.calls.at(-1)[1],null);
}
const hostileName=boot({session:{user:{id:user.id,email:'<img src=x onerror=alert(1)>'}}});await flush();
assert.equal(hostileName.get('auth-account').innerHTML,'');
console.log('PASS: callback cleanup, cancellation, network/storage errors and safe account text.');
const real=boot({realSdk:true});await flush();await real.get('auth-signin').onclick();
const redirect=new URL(real.calls.find(c=>c[0]==='redirect')[1]);
assert.equal(redirect.searchParams.get('provider'),'google');assert.equal(redirect.searchParams.get('code_challenge_method'),'s256');
const returned=boot({realSdk:true,storage:real.storage,href:'https://math2ai.github.io/?code=accepted-code'});await flush();
assert.equal(returned.get('auth-account').textContent,user.email);
assert.ok(returned.calls.filter(c=>c[0]==='owner').every(c=>c[1]===user.id),'Callback must not claim legacy progress as guest before sign-in resolves');
const authKey='math2ai-auth-example.supabase.co';assert.ok(returned.storage.has(authKey));
const reloaded=boot({realSdk:true,storage:returned.storage});await flush();
assert.equal(reloaded.get('auth-account').textContent,user.email);
await reloaded.get('auth-signout').onclick();await flush();
assert.equal(reloaded.storage.has(authKey),false);assert.equal(reloaded.calls.at(-1)[1],null);
assert.equal(real.errors.length+returned.errors.length+reloaded.errors.length,0);
console.log('PASS: actual pinned SDK PKCE, session persistence and local logout against simulated Auth endpoints.');
