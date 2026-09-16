# math2ai

128 concept pages and 1,280 understanding checks for curious learners, with ten varied questions per concept.

Try it at [math2ai.github.io](https://math2ai.github.io/).

## Use the course

Open `index.html` in a browser. Everything needed is included in that file. It works offline, except for optional links to source readings. There are no packages to install or network requests needed for guest practice. Optional Google sign-in uses Supabase when configured; the course remains usable without an account. There are no analytics.

Read a concept and try a randomly selected question. After the first wrong answer, a question-specific explanation helps you reason through the problem without naming the correct option. **Try again** gives one more attempt, with that explanation still visible. A correct answer or a second mistake finishes the round and shows the full explanation; after the second mistake, the correct answer is also identified. **Reset question** starts a fresh practice round without deleting answer history or earned checkmarks.

**Another question** rotates through all ten questions in random order before starting a new cycle, with no immediate repeat at the cycle boundary. Each new appearance starts a fresh round. You can skip a question or use **Next concept** and the menu at any time. Small Wikipedia and relevant paper, textbook or documentation links beneath each concept offer further reading without expanding the lesson.

Lessons are numbered 001–128 in pedagogical order in the concept menu. A plain checkmark appears beside a concept's title and menu entry once any question has been answered correctly. Unanswered concepts have no marker. Answer counts stay in browser storage without being displayed, and there are no navigation gates.

**Review**, beside the concept menu, opens a topic chooser grouped into the existing chapters. Search or filter the list, select individual concepts or the matching concepts in a chapter, then start a review. Every topic shows distinct questions tried, correct first answers, and correct latest answers; untried topics have no accuracy result. **Looking solid** requires three distinct questions answered correctly on both their first and latest attempts, with no latest incorrect answers; **Worth revisiting** highlights a latest incorrect answer. These are practice signals, not mastery scores. Suggested topics prioritize concepts with latest mistakes, then practiced concepts, then the current lesson for a new learner. Untried topics are always selectable.

Review draws exclusively from the selected concepts, prioritizes latest mistakes, and varies concepts and questions. **Change topics** returns to current stats; **Resume review** keeps the question and draft if the selection is unchanged. Filters never alter the selection. Selected topic IDs are saved locally per project, course and account (or guest), separately from answers; incoming answer updates do not change the set. **Back to lesson** restores the lesson question, deck and unfinished choice. Review answers use the existing guest/account saving and sync. There is no time-based review schedule: the aggregate history does not retain review dates.

Guest progress stays in this browser's **local storage** until sign-in. Signing in automatically merges those answers into the Google account, keeps the current question and feedback, and preserves any existing account progress. Account answers are saved in Supabase, with live updates across open tabs and devices. Signing out hides the account's checkmarks and allows fresh guest practice; signing back in restores the account's answers. Guest answers already transferred to one account are not copied into another account. There are no analytics.

Answers are written individually, so an older tab cannot replace the account's newer progress. Pending answers survive offline reloads and retry with the same operation ID to avoid double counting. The active lesson, question, randomized order and two-attempt practice round remain local preferences and survive lesson navigation and reloads. Remote answers update history and checkmarks without replacing another tab's current choice or feedback. Review rounds remain temporary, like review drafts. **Clear saved answers** resets the current account across devices, or just guest practice when signed out, after confirmation. Old offline writes cannot undo a reset. Site updates, browser storage failures, or incompatible course versions may reset progress; this is a convenience feature, not a durable learning record.

## Optional Google sign-in and account progress

Follow [the setup and live test checklist](source/AUTH_SETUP.md) to configure Supabase and Google. Account saving also requires the checked-in [database migration](supabase/migrations/202609140001_account_progress.sql). Apply it once in Supabase's SQL Editor before testing the new website. It creates private progress tables, restricted synchronization functions, and Realtime revision notifications. Google client secrets and privileged Supabase keys belong in the service dashboards, never in this repository.

The public settings in `source/auth-config.json`, pinned SDK, and Google button are embedded in the website. Blank settings hide account controls and preserve offline guest practice. Until an account's answers can be loaded or a local account cache is available, its answer controls stay disabled; a failed load cannot upload an empty replacement. Signing out still allows guest practice.

On the first load of this version, the previous shared browser save is assigned once to the resolved account, or to guest practice if signed out. The original record and an import recovery copy are retained. New guest answers transfer automatically on sign-in. Each transfer is assigned to one account, keeps the original operation IDs, and retains a recovery record until the server acknowledges it. Interrupted transfers resume for that account; they are not imported repeatedly or claimed by another account. Refresh all old tabs when updating the website.

## Print and present

Use the accompanying **Mathematics-to-Model-Conversations.pdf** for printing. It contains exactly 100 A4 landscape pages, one concept per page, with embedded fonts. Print landscape, one page per sheet, single-sided, at actual size or fit to the printable area. A3 printing increases the text size. The PDF has chapter and concept bookmarks.

The accompanying editable **Mathematics-to-Model-Conversations.pptx** uses the same content and layout. The original questions, answers, nuances, and source links are in slide notes. The PDF and PowerPoint remain the original printable/presentation editions; the 128-lesson course and expanded question bank are on the website. The typeface is DejaVu Sans; PDF is the most reliable choice for exact printing if that font is not installed.

## Learning sequence

| Concepts | Chapter | What it builds |
| --- | --- | --- |
| 1–15 | Numbers and linear algebra | Numbers, vectors, matrices, transformations, eigenvectors, SVD |
| 16–31 | Probability and calculus | Probability, uncertainty, derivatives, constrained optimization |
| 32–50 | Learning from data | Prediction, validation, neighbors, trees, ensembles, calibration, causality, adaptation |
| 51–77 | Neural networks and representations | Neurons, training, CNNs, graphs, embeddings, compression, diffusion |
| 78–90 | Language models | Sequences, attention, Transformers, experts, fine-tuning, distillation, retrieval, tools |
| 91–104 | Reinforcement learning and control | States, returns, policies, values, learning, planning, RLHF |
| 105–114 | Computing hardware | CPU, GPU, memory, KV caching, clusters, fabrication |
| 115–128 | Applied AI: Mineral Resource Extraction | Assays and QC, integration, grade estimation, kriging, spatial validation, processing, delivery |

Start with the worked numbers, retell the metaphor, then explain where the metaphor stops being exact. A correct answer is an understanding check, not evidence of durable mastery.

## Scientific scope

The course is an educational synthesis with constructed numerical examples. The final chapter applies AI concepts to mineral resource extraction: borehole logs and assays, compatible geoscience data, grade estimation, evaluation, and grounded calculations. Grade estimates are distinct from sample measurements; contained metal is distinct from metal recovered through processing.

Representations can organize patterns, but assigning an ID does not give it scientific meaning. Alignment, defined tool interfaces, and held-out evaluation connect representations to useful tasks. Reconstruction quality, geological interpretation, and downstream performance need separate evaluation. Primary readings are linked from the relevant lessons.

## Edit and rebuild

The `source/` directory contains the editable course and site source. Rebuilding requires Python 3 and Node.js 22 or newer. The renderer is bundled; no npm installation or network access is needed:

```sh
cd source
python build_content.py
python build_site.py
```

The result is `source/dist/index.html`. Copy it to the repository root to publish the revision. `curriculum-source.txt` is one record per concept, with pipe-separated fields and tilde-separated options. A literal `\n` inside a field starts a new displayed line. Its first option is the correct answer; the builder shuffles displayed positions deterministically. `concept-ids.json` keeps a stable original ID for each concept, including source links and original answer positions. Each question has an ID formed from that concept ID, an optional bank revision, and its number within the bank.

`question-bank.txt` adds nine authored questions per concept to the original one. Each `## Concept title` section has nine records in `question|correct answer ~ distractor ~ distractor ~ distractor|explanation` format. The builder combines them into each concept's `questions` array and deterministically shuffles answer positions. Runtime question order is independently randomized. The original single-question fields remain available to the presentation builders.

`retry-feedback.txt` supplies ten first-mistake explanations per concept, in original-question-then-bank order. Explain the reasoning or misconception without naming the correct option or evaluating the final numerical result. Full solutions remain in the original question records. `reading-links.json` maps every concept to a Wikipedia article or section; existing primary sources are retained alongside it. Source labels are compact, with full titles available on hover and to screen readers. These additions preserve the course version and all existing question IDs and answer positions.

Questions should assess the current concept using this lesson, earlier teaching, or information supplied in the prompt. Each question must stand alone in random order and in Review; a retry hint is not prerequisite instruction. The [question alignment review](source/ALIGNMENT_REVIEW.md) records the 163 flagged questions addressed in the September 2026 editorial pass and the decision to retain existing practice credit.

Matrices in lessons, quiz choices, hints and solutions are typeset by the bundled KaTeX renderer **during the build**. The published page contains prebuilt HTML and accessible MathML, plus embedded CSS and fonts; it never loads KaTeX JavaScript or a font CDN. A small display helper leaves the original readable notation visible until the required fonts load. Missing styles, failed fonts, or unsupported notation keep that fallback. Wide matrices scroll within their own container; answer controls also have spoken row descriptions.

`build_math.mjs` recognizes numeric nested arrays such as `[[1, 2], [3, 4]]` and basic arithmetic cells. Course data stays in its original plain notation. Uneven or empty rows are preserved as row lists, and all options in a rectangularity question share that style so formatting does not reveal the answer. Unsupported cells remain plain text. Formatting does not change the course version, question IDs, answer positions, or saved-progress format. `verify_math.mjs` checks matrix cell fidelity, irregular rows, bundled assets, accessible labels and fallback behavior.

`source/assets/math2ai-logo.png` is the existing math2ai GitHub profile logo. The site builder embeds it directly into the header, so the generated page still works as a single offline file.

Version 2.0 starts fresh practice progress rather than migrating the old one-question records, and tells returning users about this update. The saved format includes per-question first/latest selections, attempts, whether it has ever been answered correctly, and the active question and remaining random cycle for each concept. Rewritten question banks use a fresh revision in their question IDs; obsolete answers are discarded while other banks retain progress. The 128-lesson expansion keeps question identities and answer history for existing content. Saved positions and new links use stable concept IDs; `previous-order.json` maps positions and links from the previous 100-lesson site. Change the course version for broader incompatible changes; progress is not a durable or versioned learning record.

`source/dist/curriculum.json` is the canonical structured course. Verify a build with Python 3 and Node.js:

```sh
cd source
python build_content.py
python build_site.py
python verify_course.py
python verify_examples.py
python verify_bank.py
python verify_expansion.py
python verify_alignment.py
python verify_feedback.py
node verify_math.mjs
node verify_state.mjs
node verify_review.mjs
node verify_feedback.mjs
python verify_auth_build.py
node verify_auth.mjs
node verify_progress.mjs
```

The checks cover all 1,280 question records, independent numerical calculations, original worked examples, prerequisite order, embedded assets, and actual app event handlers. Feedback checks exercise the first explanation, single retry, finished round and history-preserving question reset for every question, plus lesson reloads, review and account transitions. State checks cover every question, random cycles, repeat attempts, correct-answer indicators, unrestricted navigation, reloads, reset, deep links, incompatible/corrupt saves, and unavailable storage. Authentication checks cover Google redirects, PKCE callbacks, cancellation, session restoration and sign-out, including the pinned SDK against simulated Auth endpoints. Progress checks run the real UI and persistence handlers with controllable storage, account, network and Realtime events: stale tabs, concurrent answers, account isolation, lost replies, offline retries, reset epochs, late responses after sign-out, and the complete guest-to-account signup flow (including a fresh OAuth return page, failed transfers, repeat logins, multiple upload batches and retained question state). These checks need no packages.

`source/verify_progress_sql.mjs` also executes the actual migration and access-control tests in PostgreSQL using the optional test-only `@electric-sql/pglite` package (tested with 0.3.14). Install it outside the deployed website, then run `node source/verify_progress_sql.mjs /absolute/path/to/pglite/dist/index.js`. It tests owner-only reads, denied guest and cross-account access, restricted writes, duplicate-operation handling, and idempotent resets. PGlite is not a runtime website dependency. A real Google/Supabase multi-device test still requires the manual checklist in `source/AUTH_SETUP.md`.

Presentation builders are included for reuse; rebuilding the PPTX requires the OpenAI artifact-tool runtime. The already generated PDF and PowerPoint do not need that runtime to use.

## License

The original course source and website code in this package are offered under the included MIT license. The vendored Supabase SDK and KaTeX have their own included MIT licenses; the official Google sign-in button follows Google branding guidelines. Linked papers, documentation, data, company names, and third-party materials retain their own rights.
