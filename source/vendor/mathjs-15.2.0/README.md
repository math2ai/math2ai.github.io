# math.js 15.2.0

Pinned browser distribution, downloaded from https://cdn.jsdelivr.net/npm/mathjs@15.2.0/lib/browser/math.js on 2026-09-28. The matching Apache-2.0 license is included as `LICENSE`.

SHA-256 of `math.js`: `b4de1e31da7797c3daaf7b8dae3b1d8bb0a7296c9cc8590f9359ac0250f8ddd6`.

The site builder embeds this as inert text. Opening a lesson with a code cell creates a disposable worker; the library does not run on the page or make a CDN request. This preserves the site's single-file, offline behavior at the cost of approximately 650 kB of additional uncompressed HTML. It defers evaluation, not the initial download bytes.

Expressions now run through the native math.js evaluator with its default configuration and parser protections, without an application function whitelist. Each run uses a fresh scope. The full expression language is available, including custom functions, indexing, complex numbers, units, and symbolic operations. This is math.js syntax, not arbitrary JavaScript execution. Rich results are converted to plain text or matrix-cell strings before crossing the worker boundary and are never rendered as HTML. Display previews are capped and labeled when shortened; calculation values are unchanged. The main page terminates workers after 3.5 seconds, on edits, and on lesson changes. Editing code schedules a fresh calculation after a 300-millisecond pause. A worker deadline is not a hard memory quota: expressions that allocate excessive memory can still exhaust the browser's resources.

References: https://mathjs.org/docs/expressions/syntax.html and https://mathjs.org/docs/expressions/security.html.
