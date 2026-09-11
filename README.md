Try it at [math2ai.github.io
](https://math2ai.github.io/)
# Mathematics to AI Model Conversations

100 concept pages and 100 understanding checks for curious learners.

## Use the course

Open `index.html` in a browser. Everything needed is included in that file. It works offline, except for optional links to source readings. There are no packages to install, network requests to run the course, accounts, analytics, or server components.

Read a concept, choose one of four answers, press **Check answer**, read the explanation, then press **Next concept**. The menu jumps to any concept. **Try again** preserves the first-attempt record while updating the latest answer. Progress stays in this browser's local storage, when available. It does not sync between browsers or devices. Opening a downloaded file and visiting its hosted version may use different saved progress.

## Print and present

Use the accompanying **Mathematics-to-Model-Conversations.pdf** for printing. It contains exactly 100 A4 landscape pages, one concept per page, with embedded fonts. Print landscape, one page per sheet, single-sided, at actual size or fit to the printable area. A3 printing increases the text size. The PDF has chapter and concept bookmarks.

The accompanying editable **Mathematics-to-Model-Conversations.pptx** uses the same content and layout. Questions, answers, nuances, and source links are in slide notes. The typeface is DejaVu Sans; PDF is the most reliable choice for exact printing if that font is not installed.

## Learning sequence

| Concepts | Chapter | What it builds |
| --- | --- | --- |
| 1–24 | Mathematics | Numbers, vectors, matrices, probability, calculus, optimization |
| 25–45 | Learning from data | Prediction, loss, validation, neurons, backpropagation, deep networks |
| 46–67 | Representations and language | Embeddings, compression, tokens, sequence prediction, attention, model tools |
| 68–81 | Reinforcement learning and control | States, dynamics, returns, policies, values, learning, planning, RLHF |
| 82–90 | Computing hardware | CPU, GPU, CUDA, memory, clusters, fabrication |
| 91–100 | The well-log application | LAS, provenance, OSDU, alignment, Sememe.ai, benchmarks, delivery |

Start with the worked numbers, retell the metaphor, then explain where the metaphor stops being exact. The website's correct-answer count is an understanding check, not evidence of durable mastery.

## Scientific scope

The course is an educational synthesis, not a report of experimental findings. Small numerical examples are constructed teaching examples. Sememe.ai's proposed Australian well-log workflow follows Danny Castonguay's description and available prior context. The full earlier Australian autoencoder chat was not recovered. The exact dataset, implementation, SDK methods, training choices, and performance were not independently verified.

The VQ-VAE route is a candidate way to turn continuous representations into discrete codes. Giving a code an ID does not make an LLM understand it. Language alignment, retrieval or tool interfaces, and held-out evaluation are separate requirements. Reconstruction, geological meaning, and downstream task quality are distinct objectives. Well-log question answering and physical control are distinct applications.

Shie Mannor coauthored *Reinforcement Learning: Foundations* with Yishay Mansour and Aviv Tamar. The Transformer paper's title is *Attention Is All You Need*. Links to these and other primary readings are in the website and PowerPoint notes. Citation does not imply endorsement.

## Edit and rebuild

The `source/` directory contains the editable course and site source. Python 3's standard library suffices to rebuild the website:

```sh
cd source
python build_content.py
python build_site.py
```

The result is `source/dist/index.html`. Copy it to the repository root to publish the revision. `curriculum-source.txt` is one record per concept, with pipe-separated fields and tilde-separated options. A literal `\n` inside a field starts a new displayed line. Its first option is the correct answer; the builder shuffles displayed positions deterministically. `concept-ids.json` keeps a stable original ID for each concept so reordering preserves source links, answer positions, and saved quiz progress. Version 1.2 migrates earlier progress when opened at the same browser origin. Rewritten questions 7 (Tensor) and 77 (Policy gradient) need new answers; other saved answers remain. Page numbers follow the revised teaching sequence.

`source/dist/curriculum.json` is the canonical structured course. `source/verify_course.py`, `source/verify_examples.py`, and `source/verify_state.mjs` check numerical answers, worked calculations, and quiz state. Presentation builders are also included for reuse; rebuilding the PPTX requires the OpenAI artifact-tool runtime. The already generated PDF and PowerPoint do not need that runtime to use.

## License

The original course source and website code in this package are offered under the included MIT license. Linked papers, documentation, data, company names, and third-party materials retain their own rights. 
