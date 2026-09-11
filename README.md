# math2ai

128 concept pages and 1,280 understanding checks for curious learners, with ten varied questions per concept.

## Use the course

Open `index.html` in a browser. Everything needed is included in that file. It works offline, except for optional links to source readings. There are no packages to install, network requests to run the course, accounts, analytics, or server components.

Read a concept and try a randomly selected question. Choose one of four answers, press **Check answer**, and read its explanation. **Another question** rotates through all ten questions in random order before starting a new cycle, with no immediate repeat at the cycle boundary. You can skip a question, retry an incorrect answer, or use **Next concept** and the menu at any time.

Lessons are numbered 001–128 in pedagogical order in the concept menu. A plain checkmark appears beside a concept's title and menu entry once any question has been answered correctly. Unanswered concepts have no marker. Answer counts stay in browser storage without being displayed, and there are no navigation gates.

Progress stays in this browser's **local storage**, when available; the site does not use cookies, accounts, analytics, or a server to track answers. Ordinary refreshes retain saved answers, the current question, and the remaining random order. Storage is only a convenience: site updates, clearing browser data, or unavailable storage can reset progress. It does not sync between browsers or devices. Opening a downloaded file and visiting its hosted version may use different saved progress. The small **Clear saved answers** button beside the storage note resets only this course after confirmation.

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

The `source/` directory contains the editable course and site source. Python 3's standard library suffices to rebuild the website:

```sh
cd source
python build_content.py
python build_site.py
```

The result is `source/dist/index.html`. Copy it to the repository root to publish the revision. `curriculum-source.txt` is one record per concept, with pipe-separated fields and tilde-separated options. A literal `\n` inside a field starts a new displayed line. Its first option is the correct answer; the builder shuffles displayed positions deterministically. `concept-ids.json` keeps a stable original ID for each concept, including source links and original answer positions. Each question has an ID formed from that concept ID, an optional bank revision, and its number within the bank.

`question-bank.txt` adds nine authored questions per concept to the original one. Each `## Concept title` section has nine records in `question|correct answer ~ distractor ~ distractor ~ distractor|explanation` format. The builder combines them into each concept's `questions` array and deterministically shuffles answer positions. Runtime question order is independently randomized. The original single-question fields remain available to the presentation builders.

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
node verify_state.mjs
```

The checks cover all 1,280 question records, independent numerical calculations, original worked examples, prerequisite order, embedded assets, and actual app event handlers. State checks cover every question, random cycles, repeat attempts, correct-answer indicators, unrestricted navigation, reloads, reset, deep links, incompatible/corrupt saves, and unavailable storage. No packages are required for these checks.

Presentation builders are included for reuse; rebuilding the PPTX requires the OpenAI artifact-tool runtime. The already generated PDF and PowerPoint do not need that runtime to use.

## License

The original course source and website code in this package are offered under the included MIT license. Linked papers, documentation, data, company names, and third-party materials retain their own rights. 
