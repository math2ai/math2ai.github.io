# Revisit later: release checklist

This change is prepared for local review, not published. Account syncing needs the additive migration below. Automated checks use disposable data; no live answer records are changed.

## Local checks

Refresh http://localhost:8766/ once to load the latest page.

| Action | Expected result |
| --- | --- |
| Open any lesson. | Its regular worked example appears directly, without an example selector, story panel or story navigation. |
| Click the visibly labeled Revisit later toggle to the left of Next concept (the pair stays together when navigation wraps on narrow phones) without answering. | The toggle shows a check; a bookmark appears below the title and in the concept menu, without awarding quiz credit. |
| Click the toggle again. | The check and bookmark disappear. |
| Answer correctly on a bookmarked concept. | The quiz checkmark appears and the deliberate revisit reminder remains. |
| Refresh or open another tab. | Guest bookmarks remain and update across tabs in the same browser. |
| Open Review → My revisit list. | Only saved reminders appear with their existing stats, selected for review. Search and deselection work; an empty list explains how to add a reminder. |
| Click a concept name in Review. | Its lesson opens without toggling the review checkbox or changing answer history. |
| Click Use suggested topics. | Suggestions still use quiz results, independently of the saved bookmark list. |
| Select a quiz option, then toggle the bookmark. | The current question, selected answer and retry allowance remain intact. |
| Clear disposable guest answers. | Confirmation clears answers but keeps bookmarks. Do not clear real account answers merely to test this. |
| Use phone width and keyboard navigation. | Controls fit; the concept menu opens near the current concept; the bookmark can be toggled with the keyboard. |

## Account setup before release

Run `supabase/migrations/202609200001_learning_choices.sql` in the intended Supabase project's SQL Editor, or verify the repository integration has applied it. It adds `math2ai_learning`, owner-only reads, an authenticated sync function and a Realtime publication entry. Existing answer tables/functions are untouched. Reapplying it does not reset bookmarks.

Localhost currently uses the production Supabase project. Applying the migration there changes the shared backend, but the old page does not use the new table. Use a separate Supabase project/configuration if fully isolated end-to-end testing is needed; do not publish test configuration.

Without setup, bookmarks remain on the device and the footer explains that account syncing is unavailable. Quiz-answer syncing continues independently. Local persistence alone is not proof of cross-device syncing.

After setup, test:

- Set a guest bookmark, then sign in. It transfers unless the account already has a saved choice for that concept; the account choice wins a conflict.
- Open separate browsers/devices on the same account. Set bookmarks on different concepts and verify both appear everywhere without reload.
- Sign out: account bookmarks disappear. Sign back in: they return. Another account must not inherit them.
- Queue a change while offline, then remove or change that bookmark on another device. Reconnect: the stale change must not replace the newer saved choice. A notice explains the conflict, and a fresh explicit click can change it.
- Toggle a bookmark several times while offline, with no competing change. The final choice should sync in order.
- Confirm ordinary quiz progress, guest answer transfer, Review practice and sign-out still work.

Automated tests cover these flows and execute the migration/access-control checks in PostgreSQL through PGlite. Live Google/Supabase delivery and Safari/VoiceOver remain manual release checks.

## Compatibility

Bookmarks use a separate journal and server table from quiz answers. Removals retain revisions so stale devices cannot restore old reminders. Failed guest transfers survive reload and belong to one account.

The discarded domain selector and alternate stories are removed. Previously stored domain preferences are ignored and never uploaded by the new page. Older completion markers display as unmarked, while their revisions remain readable so later bookmarks can sync. Question IDs, correct-answer positions and saved quiz credit are retained.
