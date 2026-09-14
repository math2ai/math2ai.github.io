# Google sign-in and synchronized account answers

Google sign-in is optional. Each account has private answers in Supabase; guest
practice stays in browser storage until signing in automatically merges it into
the account. The course does not require an account.
There are no games, presence displays, or email/password login in this change.

## 1. Supabase project

Create a project at https://supabase.com/dashboard (or use your existing project).
Find its **Project URL** and **publishable key** in the Connect dialog or project
API settings. The publishable key starts with `sb_publishable_` and is intended
for browser code. This implementation intentionally accepts only that key type.

Open **Authentication → Sign In / Providers → Google** and copy the callback URL
shown there. It has this form:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

## 2. Google OAuth application

In https://console.cloud.google.com/, create/select a project and open
**Google Auth Platform**.

1. Set the app name to **math2ai**, choose the support/developer contact email,
   and configure an **External** audience for public learners.
2. While the app is in Testing, add the Google account(s) that will test login.
3. Use only the standard sign-in scopes: `openid`, email and profile.
4. In **Clients**, create an OAuth client with type **Web application**.
5. Add `https://math2ai.github.io` as an authorized JavaScript origin. For local
   testing, also add `http://localhost:8766`.
6. Set the authorized redirect URI to the exact **Supabase callback URL** from
   step 1. The Google redirect URI is not the course website URL.
7. Paste the Google client ID and client secret into the Supabase Google
   provider settings, enable the provider, and save. Keep the client secret in
   the dashboard; it does not belong in this repository.

When ready for public login, update Google's audience/publishing status so the
app is available to users beyond the test list. Optional brand verification may
take additional time. Follow any requirements shown by the Google console.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-google

## 3. Supabase return URLs

In **Authentication → URL Configuration**, set:

- Site URL: `https://math2ai.github.io/`
- Redirect allowlist: `https://math2ai.github.io/`
- Local test redirect: `http://localhost:8766/`

If testing a different port or path (including `/index.html`), add that exact
return URL. The application returns to the current origin and pathname without
query parameters or a fragment; the course restores the saved lesson itself.

## 4. Public website configuration

Fill in `source/auth-config.json`:

```json
{
  "supabaseUrl": "https://YOUR_PROJECT_REF.supabase.co",
  "publishableKey": "sb_publishable_YOUR_PUBLIC_KEY"
}
```

Both values are intentionally public and become part of `index.html`. Never put
a Supabase secret/service-role key or Google client secret in this file.
With both values empty, the account controls are hidden and no authentication
SDK is included in the generated page. Partial or invalid configuration fails
the build rather than generating a broken login.

From `source/`, build and check:

```sh
python build_site.py
python verify_course.py
node verify_state.mjs
python verify_auth_build.py
node verify_auth.mjs
node verify_progress.mjs
python -m http.server 8766 --bind 127.0.0.1 --directory dist
```

Visit `http://localhost:8766/`. Opening an HTML file directly supports guest
practice, but signing in requires a web URL and working browser storage.
Copy `source/dist/index.html` to the repository root after checking the build.

## 5. Apply the progress database migration

This is required before testing signed-in answers. In the existing Supabase project,
open **SQL Editor → New query**, paste the complete contents of
`supabase/migrations/202609140001_account_progress.sql`, and click **Run** once.
The script uses a transaction; successful execution creates three tables, two
restricted functions, and enables Realtime on the progress revision table.
If you already ran the setup manually, no further manual action is needed. The
migration is safe for the GitHub integration to apply again: it retains existing
answers, reset epochs and operation IDs. No additional credentials belong in the
website configuration.

The public publishable key cannot create these objects. Use the SQL Editor while
signed into your project; do not paste a database password or service-role key into
the website or a conversation.

The tables have row-level security. Authenticated clients can read their own
progress and answers, and have no direct write access. The two database functions
verify `auth.uid()` against the expected owner, serialize writes per account/course,
and deduplicate operation IDs. Only the explicit reset function can clear answers.
Realtime streams revision changes; the website then fetches the current private
answer summary through the synchronization function.

## 6. Live acceptance checks

Refresh **every old local tab** at `http://localhost:8766/` after applying the SQL.
The old shared-browser storage record is kept as a recovery copy. On first use,
its answers are assigned once to the resolved account (or guest if signed out).
To move your existing test answers into your account, stay signed in for this update.

1. Sign in as account A. Answer Scalar correctly in one tab. The checkmark should
   appear in a second tab immediately, without refreshing it.
2. Answer Vector in the second tab. Both tabs should show Scalar and Vector.
3. Sign out in either tab. Tabs sharing that browser's login switch to guest
   practice. Account checkmarks disappear. Guest answers already transferred to
   the account do not remain as a second copy in guest practice.
4. Sign back in as A. Both account checkmarks return. Refresh and verify again.
5. Sign in as A in another browser or device. It should receive the same checkmarks.
   Answer another concept there and watch the first browser update.
6. Sign in as account B. A's answers should be absent. B's answers must not appear
   in A. Signing out leaves A and B's remote records intact.
7. After an account has loaded once, disconnect a device, answer a question, and
   reload while offline. Reconnect; its queued answer should synchronize once.
8. With one device offline, clear saved answers from another. Reconnect the old
   device. Pre-reset queued answers must not bring the cleared checkmarks back.
9. Sign out and answer several questions as a guest, then sign in. Keep all guest
   checkmarks, the current question/answer feedback, and the account's existing
   progress. Repeat sign-out/sign-in: attempts must not be imported twice. Sign
   into a different account: the already-transferred guest answers must be absent.
10. Interrupt the network during that guest transfer, then reload and sign back
   into the original account. The pending answers should merge after reconnecting.
11. Cancel a Google sign-in or use Back. Guest practice and another login attempt
   should still work. Check the layout on a narrow screen as well.

The automated browser tests simulate Auth and Realtime. The SQL test executes the
real migration in PostgreSQL, but does not validate the hosted project's settings.
Do not treat passing local tests as a completed live Supabase acceptance test.

## Implementation notes

- `progress.js` owns persistence. `site.js` saves only local navigation preferences;
  it never uploads a whole copy of a learner's progress.
- Each checked answer has a unique, persistent operation ID. Operations are merged
  on the server, retries are idempotent, and stale devices cannot delete new answers.
- A reset advances an account/course epoch. Old offline operations are discarded;
  reset request IDs also make retries safe after an uncertain response.
- Local caches and pending writes are namespaced by project, course and account.
  Account switches detach the old subscription immediately. Late responses cannot
  populate the new account or guest view. RPCs also check the expected account ID.
- Storage events update tabs immediately. Supabase Realtime updates other devices;
  focus, reconnect and visible-page reconciliation every 30 seconds repair missed
  events. Guest answers leave the browser only when signing in transfers them
  to an account.
- Account metadata and checkmarks synchronize; active question/order and lesson
  position are local preferences so another device does not interrupt your reading.
- Google uses the pinned official SDK and PKCE. Callback parameters are captured
  before lesson navigation and then removed from the URL. Session storage remains
  separate at `math2ai-auth-<project hostname>`.
- `signOut({scope:'local'})` signs out this browser and its shared tabs. Other
  browsers/devices stay signed in. Signing out does not delete remote answers.

## Guest-to-account transfer

No additional SQL migration is needed for this behavior. On sign-in (including a
new document after the Google callback), the website claims outstanding guest
attempts for the resolved account. A browser lock prevents simultaneous tabs from
claiming the same work for different accounts. The durable transfer record keeps
the original attempt IDs, ownership and guest question state. Existing account
answers are merged rather than replaced.

The original guest records are retained until the server acknowledges the transfer,
but owned attempts no longer appear in guest practice or another account. Failed
transfers remain recoverable by the original account after refresh or reconnect.
Once a transfer is bound to a server reset epoch, a later clear discards it rather
than rebinding it and resurrecting cleared answers. New guest practice after sign-out
is a new set of attempts and can be transferred at the next sign-in.
