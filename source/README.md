# math2ai maintainer guide

How the course behaves in detail, how progress is saved, and how to edit, rebuild and verify it. For an introduction to the course itself, see the [project README](../README.md).

File paths in commands and prose are written from the repository root unless a command first changes into `source`.

## Use the course

Open `index.html` in a browser. Everything needed is included in that file. It works offline, except for optional links to source readings. There are no packages to install, and an offline or local copy makes no network requests for guest practice. Optional Google sign-in uses Supabase when configured; the course remains usable without an account. The published website also counts usage anonymously; see [Public statistics](#public-statistics).

Read a concept and try a randomly selected question. After the first wrong answer, a question-specific explanation helps you reason through the problem without naming the correct option. **Try again** gives one more attempt, with that explanation still visible. A correct answer or a second mistake finishes the round and shows the full explanation; after the second mistake, the correct answer is also identified. A finished round offers **Next question** beneath its explanation, which takes the same step as the small forward arrow. **Reset question** starts a fresh practice round without deleting answer history or earned checkmarks.

Small arrows beside **Question 1 of 10**, above the prompt, browse a saved, shuffled set of ten questions for each concept, wrapping at either end. Returning to a question restores its draft choice, feedback, and remaining attempt; only **Reset** beside the question number starts a fresh round. You can skip a question or use **Previous concept**, **Next concept** and the menu at any time. Small Wikipedia and relevant paper, textbook or documentation links beneath each concept offer further reading without expanding the lesson.

Lessons are numbered 001–139 in pedagogical order in the concept menu. A plain checkmark appears beside a concept's title and menu entry once any question has been answered correctly. Unanswered concepts have no marker. Answer counts stay in browser storage without being displayed, and there are no navigation gates.

**Review**, beside the concept menu, opens a topic chooser grouped into the existing chapters. Search or filter the list, select individual concepts or the matching concepts in a chapter, then start a review. Every topic shows distinct questions tried, correct first answers, and correct latest answers; untried topics have no accuracy result. **Looking solid** requires three distinct questions answered correctly on both their first and latest attempts, with no latest incorrect answers; **Worth revisiting** highlights a latest incorrect answer. These are practice signals, not mastery scores. Suggested topics prioritize concepts with latest mistakes, then practiced concepts, then the current lesson for a new learner. Untried topics are always selectable.

Review draws exclusively from the selected concepts, prioritizes latest mistakes, and varies concepts and questions. **Change topics** returns to current stats; **Resume review** keeps the question and draft if the selection is unchanged. Filters never alter the selection. Selected topic IDs are saved locally per project, course and account (or guest), separately from answers; incoming answer updates do not change the set. **Back to lesson** restores the lesson question, deck and unfinished choice. Review answers use the existing guest/account saving and sync. There is no time-based review schedule: the aggregate history does not retain review dates.

Guest progress stays in this browser's **local storage** until sign-in. Signing in automatically merges those answers into the Google account, keeps the current question and feedback, and preserves any existing account progress. Account answers are saved in Supabase, with live updates across open tabs and devices. Signing out hides the account's checkmarks and allows fresh guest practice; signing back in restores the account's answers. Guest answers already transferred to one account are not copied into another account. Saved progress is separate from the anonymous [public statistics](#public-statistics), which never carry an account.

Answers are written individually, so an older tab cannot replace the account's newer progress. Pending answers survive offline reloads and retry with the same operation ID to avoid double counting. The active lesson, question, randomized order and two-attempt practice round remain local preferences and survive lesson navigation and reloads. Remote answers update history and checkmarks without replacing another tab's current choice or feedback. Review rounds remain temporary, like review drafts. **Clear saved answers** resets the current account across devices, or just guest practice when signed out, after confirmation. Old offline writes cannot undo a reset. Site updates, browser storage failures, or incompatible course versions may reset progress; this is a convenience feature, not a durable learning record.

## Optional Google sign-in and account progress

Follow [the setup and live test checklist](AUTH_SETUP.md) to configure Supabase and Google. Account saving also requires the checked-in [database migration](../supabase/migrations/202609140001_account_progress.sql). Apply it once in Supabase's SQL Editor before testing the new website. It creates private progress tables, restricted synchronization functions, and Realtime revision notifications. Google client secrets and privileged Supabase keys belong in the service dashboards, never in this repository.

The public settings in `source/auth-config.json`, pinned SDK, and Google button are embedded in the website. Blank settings hide account controls and preserve offline guest practice. Until an account's answers can be loaded or a local account cache is available, its answer controls stay disabled; a failed load cannot upload an empty replacement. Signing out still allows guest practice.

On the first load of this version, the previous shared browser save is assigned once to the resolved account, or to guest practice if signed out. The original record and an import recovery copy are retained. New guest answers transfer automatically on sign-in. Each transfer is assigned to one account, keeps the original operation IDs, and retains a recovery record until the server acknowledges it. Interrupted transfers resume for that account; they are not imported repeatedly or claimed by another account. Refresh all old tabs when updating the website.

## Explore and the 256-concept outline

Forty-six concepts include a small code-and-output box, covering foundational mathematics, limits, regression and MSE, and every lesson from **Backpropagation through Autoencoder**, plus ten new linear-algebra bridges. The supplied code reproduces each worked example and runs automatically. The regression box compares a trial line with a fit to three observed taxi trips; editing those fares changes the fitted rate, starting fare, and MSE. Monte Carlo uses a repeatable seed; change it or the sample count to explore estimates. The neural-network examples expose gradients, batch updates, convolution, graph messages, and probability losses. PCA computes its direction from the data, and the autoencoder trains a one-number bottleneck on four inputs over 40 updates, plots the learning curve and reconstructions, and tests a held-out input. All 128 lesson explanations and worked examples also received a [content-depth review](CONTENT_DEPTH_REVIEW.md). The [playground checklist](PLAYGROUND_REVIEW.md) lists all 35 concepts and concrete edits to test. Editing code updates the output after a short pause in typing. A subtle math.js documentation link sits beside the output; an error appears there if the expression cannot be evaluated. **Reset example** restores the current concept's supplied code and recalculates its output. Draft expressions remain available while navigating within the tab and start fresh on reload. Calculations do not create quiz answers, earn checkmarks, or sync to an account.

The pinned math.js 15.2.0 library is embedded as inert text and starts only inside a disposable worker when a lesson with code opens or its code changes. There is no runtime CDN request; the site remains a single offline file. This adds approximately 650 kB uncompressed to the page. The boxes use the full native [math.js expression language](https://mathjs.org/docs/expressions/syntax.html): transpose, inverses, indexing, ranges, custom functions, complex numbers, units, fractions, big numbers, and symbolic operations. Assignments produce output unless ended with a semicolon, as in math.js; the supplied examples use semicolons to keep their output concise. Rich values are formatted in the worker and inserted as text or bracketed tables, never HTML. Display previews limit matrices to 32 rows/columns, long text to 2,000 characters, and results to 100, with a visible note when shortened. These display limits do not change calculations. Each run has a fresh scope and a 3.5-second timeout. Edits and navigation cancel pending calculations, and stale replies are ignored. A browser that cannot start a worker keeps the lesson and quiz usable. The Apache-2.0 license and exact distribution hash are in `source/vendor/mathjs-15.2.0/`.

Twelve boxes also use the course's `plot()` helper to draw directly in the output: vector scaling, variance, derivative, regression, covariance/correlation, backpropagation, mini-batch descent, deep networks, softmax, cross-entropy, PCA, and autoencoder. These are responsive SVG plots with labeled axes and legends, updated by editing the same code. They need no plotting-library download. The helper is a course extension, not a built-in math.js function. Use `plot(x, y, {xLabel: "Time", yLabel: "Value"})`, or `plot([{x: xs, y: ys, label: "Curve"}, {x: xs, y: targets, label: "Data", style: "points"}], options)` for multiple series. Styles are `line`, `points`, and `bar` (discrete stems from zero); `equal: true` preserves geometric angles by using equal axis scales. Plots accept numeric vectors of up to 1,000 points per series, six series per plot, and six plots per run. Nonfinite y values appear as gaps; unsupported types or larger inputs receive an editing error. A semicolon suppresses a plot like any other output.

[The ordered 256-concept outline](CURRICULUM_256_PLAN.md) is authoring material only. It reserves stable IDs for 256 concepts, with 139 live lessons and 117 proposed additions. The first ten additions are documented in [the pilot review checklist](EXPANSION_PILOT_REVIEW.md). Adaptive assessment is deferred. See [the playground review and test checklist](PLAYGROUND_REVIEW.md) for this first review checkpoint.

[The engine assessment](PLAYGROUND_ENGINE_REVIEW.md) recommends math.js for small mathematical experiments and selective Python/Pyodide use for lessons involving standard estimators or tabular workflows. No Python runtime is loaded yet. The pilot stopped at 138 concepts for review; Limits was then added ahead of its batch, and the other 117 remain unimplemented.

Additional checks:

```sh
python verify_curriculum_plan.py
node verify_playground.mjs
node verify_math_playgrounds.mjs
node verify_neural_playgrounds.mjs
node verify_plots.mjs
node verify_playground_ui.mjs
```

## Print and present

Use the accompanying **Mathematics-to-Model-Conversations.pdf** for printing. It contains exactly 100 A4 landscape pages, one concept per page, with embedded fonts. Print landscape, one page per sheet, single-sided, at actual size or fit to the printable area. A3 printing increases the text size. The PDF has chapter and concept bookmarks.

The accompanying editable **Mathematics-to-Model-Conversations.pptx** uses the same content and layout. The original questions, answers, nuances, and source links are in slide notes. The PDF and PowerPoint remain the original printable/presentation editions; the expanded 138-lesson course and question bank are on the website. The typeface is DejaVu Sans; PDF is the most reliable choice for exact printing if that font is not installed.

## Learning sequence

| Concepts | Chapter | What it builds |
| --- | --- | --- |
| 1–25 | Numbers and linear algebra | Numbers, vectors, matrices, transformations, eigenvectors, SVD |
| 26–42 | Probability and calculus | Probability, uncertainty, limits, derivatives, constrained optimization |
| 43–61 | Learning from data | Prediction, validation, neighbors, trees, ensembles, calibration, causality, adaptation |
| 62–88 | Neural networks and representations | Neurons, training, CNNs, graphs, embeddings, compression, diffusion |
| 89–101 | Language models | Sequences, attention, Transformers, experts, fine-tuning, distillation, retrieval, tools |
| 102–115 | Reinforcement learning and control | States, returns, policies, values, learning, planning, RLHF |
| 116–125 | Computing hardware | CPU, GPU, memory, KV caching, clusters, fabrication |
| 126–139 | Applied AI: Mineral Resource Extraction | Assays and QC, integration, grade estimation, kriging, spatial validation, processing, delivery |

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

The result is `source/dist/index.html`. Copy it to the repository root to publish the revision. `curriculum-source.txt` is one record per concept, with pipe-separated fields and tilde-separated options. A literal `\n` inside a field starts a new displayed line. An optional ninth field holds ordinary-size formula notes, separate from the equation; use it for symbol meanings and conditions. Its first option is the correct answer; the builder shuffles displayed positions deterministically. `concept-ids.json` keeps a stable original ID for each concept, including source links and original answer positions. Each question has an ID formed from that concept ID, an optional bank revision, and its number within the bank.

`question-bank.txt` adds nine authored questions per concept to the original one. Each `## Concept title` section has nine records in `question|correct answer ~ distractor ~ distractor ~ distractor|explanation` format. The builder combines them into each concept's `questions` array and deterministically shuffles answer positions. Runtime question order is independently randomized. The original single-question fields remain available to the presentation builders.

`retry-feedback.txt` supplies ten first-mistake explanations per concept, in original-question-then-bank order. Explain the reasoning or misconception without naming the correct option or evaluating the final numerical result. Full solutions remain in the original question records. `reading-links.json` maps every concept to a Wikipedia article or section; existing primary sources are retained alongside it. Source labels are compact, with full titles available on hover and to screen readers. These additions preserve the course version and all existing question IDs and answer positions.

Questions should assess the current concept using this lesson, earlier teaching, or information supplied in the prompt. Each question must stand alone in random order and in Review; a retry hint is not prerequisite instruction. The [question alignment review](ALIGNMENT_REVIEW.md) records the 163 flagged questions addressed in the September 2026 editorial pass and the decision to retain existing practice credit.

Questions must also require fresh reasoning beyond the worked example, rather than ask for its already solved answer or an intermediate result. The [worked-example review](EXAMPLE_REVIEW.md) records the complete 128-lesson, 1,280-question review and 99 replacements across 70 concepts. Each replacement includes a new first-mistake hint and final explanation; existing question IDs and historical practice credit are retained.

The [prerequisite follow-up](PREREQUISITE_REVIEW.md) corrects missing definitions such as low-rank approximation. Teach technical terms and decision rules before assessing them; naming them in an example or explaining them only after a wrong answer is insufficient. Distractors should use understandable terminology too.

Keep each lesson focused on its main idea. Prefer simplifying an exercise or supplying a short premise over expanding the lesson to teach every incidental term. The [lesson clarity review](LESSON_CLARITY_REVIEW.md) records the follow-up: ordinary-size formula notes, shorter explanations, and removal of unnecessary notation and side topics.

Define mathematical symbols locally, including their role, indices, and any special marks. The [symbol review](symbol-review.json) records the manual check of all 128 lessons. `verify_symbols.py` detects teaching text changed since that review; recheck the affected lesson's notation before updating its review fingerprint. The check tracks review coverage, not pedagogical correctness.

Mathematical notation in lessons, quiz choices, hints and solutions is typeset by the bundled KaTeX renderer **during the build**. This includes matrices, grouped indices and powers, summation limits, fractions, and radicals. The published page contains prebuilt HTML and accessible MathML, plus embedded CSS and fonts; it never loads KaTeX JavaScript or a font CDN. A small display helper leaves the original readable notation visible until the required fonts load. Missing styles or failed fonts keep that fallback. Wide formulas scroll within their own container by touch or keyboard; answer controls also have spoken matrix row descriptions.

`math-notation.json` supplies explicit, reviewed TeX for all 139 main formula fields and mathematical expressions throughout the course and question bank. Its spans must reconstruct the original text exactly; `build_math.mjs` rejects stale annotations after a content edit. The original numeric-array formatter remains available for unannotated matrix fields. Uneven or empty rows are preserved as row lists, and all options in a rectangularity question share that style so formatting does not reveal the answer. Course data, the course version, question IDs, answer positions, and saved-progress format remain unchanged. `verify_math.mjs` checks notation coverage, numerical and matrix-cell fidelity, bundled assets, accessible labels, and fallback behavior. See [mathematical notation](MATH_FORMATTING.md) for authoring and verification details.

`source/assets/math2ai-logo.png` is the existing math2ai GitHub profile logo. The site builder embeds it directly into the header, so the generated page still works as a single offline file.

Version 2.0 starts fresh practice progress rather than migrating the old one-question records, and tells returning users about this update. The saved format includes per-question first/latest selections, attempts, whether it has ever been answered correctly, and the active question, shuffled order, and per-question practice rounds for each concept. Rewritten question banks use a fresh revision in their question IDs; obsolete answers are discarded while other banks retain progress. The 128-lesson expansion keeps question identities and answer history for existing content. Saved positions and new links use stable concept IDs; `previous-order.json` maps positions and links from the previous 100-lesson site. Change the course version for broader incompatible changes; progress is not a durable or versioned learning record.

`source/dist/curriculum.json` is the canonical structured course. Verify a build with Python 3 and Node.js:

```sh
cd source
python build_content.py
python build_site.py
python verify_course.py
python verify_examples.py
python verify_content_depth.py
python verify_bank.py
python verify_expansion.py
python verify_alignment.py
python verify_example_questions.py
python verify_prerequisites.py
python verify_symbols.py
python verify_feedback.py
node verify_math.mjs
node verify_lesson_clarity.mjs
node verify_concept_menu.mjs
node verify_learning.mjs
python verify_teaching_steps.py
node verify_state.mjs
node verify_question_navigation.mjs
node verify_concept_links.mjs
node verify_review.mjs
node verify_feedback.mjs
python verify_auth_build.py
node verify_auth.mjs
node verify_progress.mjs
```

The checks cover all 1,390 question records, independent numerical calculations, original worked examples, prerequisite order, embedded assets, and actual app event handlers. Feedback checks exercise the first explanation, single retry, finished round and history-preserving question reset for every question, plus lesson reloads, review and account transitions. State checks cover every question, stable shuffled question navigation, repeat attempts, correct-answer indicators, unrestricted navigation, reloads, reset, deep links, incompatible/corrupt saves, and unavailable storage. Authentication checks cover Google redirects, PKCE callbacks, cancellation, session restoration and sign-out, including the pinned SDK against simulated Auth endpoints. Progress checks run the real UI and persistence handlers with controllable storage, account, network and Realtime events: stale tabs, concurrent answers, account isolation, lost replies, offline retries, reset epochs, late responses after sign-out, and the complete guest-to-account signup flow (including a fresh OAuth return page, failed transfers, repeat logins, multiple upload batches and retained question state). These checks need no packages.

`source/verify_progress_sql.mjs` also executes the actual migration and access-control tests in PostgreSQL using the optional test-only `@electric-sql/pglite` package (tested with 0.3.14). Install it outside the deployed website, then run `node source/verify_progress_sql.mjs /absolute/path/to/pglite/dist/index.js`. It tests owner-only reads, denied guest and cross-account access, restricted writes, duplicate-operation handling, and idempotent resets. PGlite is not a runtime website dependency. A real Google/Supabase multi-device test still requires the manual checklist in `source/AUTH_SETUP.md`.

Presentation builders are included for reuse; rebuilding the PPTX requires the OpenAI artifact-tool runtime. The already generated PDF and PowerPoint do not need that runtime to use.

## License

The original course source and website code in this package are offered under the included MIT license. The vendored Supabase SDK and KaTeX have their own included MIT licenses; the official Google sign-in button follows Google branding guidelines. Linked papers, documentation, data, company names, and third-party materials retain their own rights.


Concept connections are curated in `source/concept-links.json`, with an explicit entry for all 139 lessons. Each lesson may link up to three earlier prerequisites within its explanation or worked example and up to four selected applications in a small “(used in …)” note beside its title, wrapping naturally on narrow screens. Every application link points to a later lesson. Prerequisite links point backward; reversing those prerequisite links produces the same forward dependency direction. The build exports the resulting acyclic graph to `source/dist/concept-graph.json`. Use stable concept IDs, not display numbers. The content build rejects missing phrases, forward prerequisite links, backward application links, duplicate or self links, and links inside mathematical notation. Quiz text is not linked. Following a connection uses browser history; Back restores the question and reading position while keeping current answer and account state. No schema or course-version change is needed. The [connection review](CONCEPT_CONNECTIONS_REVIEW.md) records the selected applications and explains the expanded Transformer and language-model connections.

## Revisit later

Revisit later is a reversible personal bookmark. It does not grant quiz credit and a correct answer does not remove it. Review provides a personal revisit list; automatic suggestions remain based on answer history. Clear saved answers deliberately keeps these bookmarks.

`source/learning.js` saves bookmarks separately from the answer journal. Guests use browser storage; signed-in users use an operation queue and the additive `supabase/migrations/202609200001_learning_choices.sql` migration. Run that migration before releasing the new page, then test the real account flow. It adds its own private table/RPC/Realtime publication entry without changing existing quiz tables or functions. If setup is missing or the network fails, bookmarks remain queued on the device and the footer says they have not synced.

Each concept has its own revision, including explicit removals. A write based on an older revision cannot overwrite a newer saved choice. Sequential offline changes keep their order; repeated writes are idempotent. Guest bookmarks fill missing account choices on signup; an existing account choice wins a conflict. Sign-out immediately switches to the guest view. Localhost and production share account bookmarks after upload to the same Supabase project and course version; guest bookmarks belong to their browser origin.

See [the release test checklist](LEARNING_CHOICES_TESTING.md) for the UI flows and database setup. PostgreSQL checks use the optional PGlite test dependency:

```sh
node source/verify_learning_sql.mjs /absolute/path/to/pglite/dist/index.js
```

## Ten-concept expansion pilot

The current pilot adds linear combinations, norms and unit vectors, orthogonality, vector projection, span, linear independence, basis and dimension, systems of linear equations, matrix rank, and low-rank approximation. Every addition has a worked example, math.js code, metaphor, ten questions and staged explanations. See [the review checklist](EXPANSION_PILOT_REVIEW.md).

Before release, apply `supabase/migrations/202609290001_expand_learning_concepts.sql` **after the existing bookmark migration**. This widens the bookmark ID bound to the reserved 256-concept range without deleting or rewriting saved rows. Guest bookmarks already work locally; account bookmarks on new IDs need this migration. The live database is not changed by building the website.

Additional checks: `python source/verify_linear_bridges.py` and `node source/verify_linear_playgrounds.mjs`. `verify_learning_sql.mjs` tests both the original bookmark setup and this additive expansion, including preservation and reapplication, using test-only PGlite (also tested with 0.5.8).

## Limits lesson and teaching-order change

Limits (stable ID 162) now sits directly before Derivative. It teaches what a limit is from two-sided tables of nearby outputs: a limit can exist where a function has no value, differs from a value assigned at the point, and fails to exist when the two sides disagree. Derivative and Integral link back to it. Its code box tabulates outputs on both sides of the point and shows that the point itself has no value. Tensor moved from position 7 to position 10, after Summation, Linear combinations and Dot product, so the first vector calculations come before arrays with more axes.

Stable concept IDs, question IDs, answer positions and the course version are unchanged, so saved progress, bookmarks and `#lesson-…` links keep their meaning; only display numbers shift. ID 162 is inside the range the bookmark migration already allows, so no database change is needed. The lesson is an author draft: its numerical answers are independently recomputed, but it has not had the editorial reviews recorded for earlier lessons.

Additional check: `python source/verify_limits.py`.

## Welcome, feedback link and link preview

A new visitor sees a short welcome above the lesson, on whichever lesson they arrive at. It disappears after the first recorded answer or when **Hide** is pressed; Hide is remembered in this browser under `math2ai-welcome-v1`, separately from answers and accounts. Nothing is shown while an account's answers are still loading.

**Something unclear? Send feedback** under the questions opens a new GitHub issue in a new tab, prefilled with the lesson number and title, its link, and the visible question's ID. The link carries no account or answer data, and nothing is sent to GitHub unless the learner follows it. The repository and site addresses are constants at the top of `site.js`.

The page head has Open Graph and Twitter card tags so a shared link shows a title, description and image. The image is `source/assets/readme-lesson.jpg`, served by GitHub Pages from this repository; replace that file, or the tag in `site-template.html`, to change the preview. Sites that cache previews may take a while to pick up a change.

Additional check: `node source/verify_onboarding.mjs`.

## Public statistics

The published website counts how it is used and shows the totals to everyone at [`stats.html`](../stats.html). Only counters are kept. There is no visitor ID, cookie, account, IP address or free text in what the page sends or the database stores.

What is counted:

- **Visit:** one page load. **Visitor:** a browser seen for the first time, remembered by the yes-or-no flag `math2ai-stats-visitor` in that browser's storage.
- **Lesson view:** once per lesson per page load, and only after saved progress has loaded, so a returning learner's saved lesson is counted instead of lesson 1.
- **Answer:** the question ID, the choice (0–3) and whether it was the first answer to that question in this browser or account. The statistics page works out which choice was correct from the course data.
- **Online:** a heartbeat. A browser with the site visible sends one about once a minute, saying only which lesson is on screen. The database counts heartbeats per minute and lesson, and "online" is the busiest of the current and two previous minutes, so it can lag by a minute or two. Tabs of one browser share the time of their last heartbeat (`math2ai-stats-beat`, a time, not an identifier), so reloads and extra tabs do not count twice. Hidden tabs send none.

What is not counted: offline and local copies (the recorder runs only at `https://math2ai.github.io`), builds without account settings, and browsers that send Do Not Track or Global Privacy Control, which can still read the totals.

`stats.js` is the recorder embedded in the page. It uses its own Supabase client with no session, so a signed-in learner's account never reaches the statistics. Events are batched (at most 50 per request) and best effort: a failed request is dropped and not retried in a loop. Everything travels as ordinary requests; there is no live connection, so the number of simultaneous visitors is not limited by Realtime and does not compete with account syncing. The footer shows who is online and the visitor total once the server has answered, and stays hidden otherwise. `stats.html` and `stats-page.js` are a separate static page that reads the totals, the course data and the vendored SDK from this repository.

**Database setup, once:** in the Supabase dashboard open **SQL Editor → New query**, paste the complete contents of [`202610010001_public_stats.sql`](../supabase/migrations/202610010001_public_stats.sql), and click **Run**. It adds four counter tables with no direct access and two functions, `math2ai_stats_count` and `math2ai_stats_read`, that anyone may call. It changes no existing table or function, contains no `drop` or `delete`, and is safe to run again. Until it is applied the site works as before and shows no statistics. The heartbeat table is a ring of eight reused minute slots per lesson, so it never grows and needs no clean-up.

Limits worth knowing: anyone can call the counting function, so the counters can be inflated and should be read as indicative. Each visible browser makes about one small request a minute, plus one shortly after it counts something.

To remove the feature, run `drop function public.math2ai_stats_count(jsonb,boolean,integer); drop function public.math2ai_stats_read(); drop table public.math2ai_stats_days, public.math2ai_stats_lessons, public.math2ai_stats_answers, public.math2ai_stats_minutes;` in the SQL Editor. The SQL check confirms that this, like applying the migration, leaves every other table, function, policy, grant and row identical.

Checks: `node source/verify_stats.mjs`, and `node source/verify_stats_sql.mjs /absolute/path/to/pglite/dist/index.js`, which runs the real migration in PostgreSQL with the optional test-only PGlite package (tested with 0.5.8).
