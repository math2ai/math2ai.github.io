# Mathematical notation

KaTeX formats all 128 main formula fields and the mathematical expressions in definitions, worked examples, notes, questions, options, and both feedback stages. This is presentation only: the canonical curriculum, question IDs, answer positions, course version, and saved-answer data are unchanged.

## Authoring

`math-notation.json` contains explicit, reviewed formatting keyed by stable concept or question ID. A field is an ordered array of ordinary text and mathematical spans:

```json
"c:112:formulaNote": [
  {"plain": "Fₘ₋₁", "tex": "F_{m-1}"},
  " is the current predictor."
]
```

This is an abbreviated example. The complete field must reconstruct its original source text exactly when ordinary text and each span's `plain` value are joined. `build_math.mjs` rejects stale or orphaned entries instead of silently displaying incorrect math after a content edit. Update the corresponding annotation whenever you edit an annotated field. Unannotated matrix-only fields can still use the original numeric-matrix renderer.

Use grouped TeX indices (`F_{m-1}`, `A_{ij}`), powers (`x^{n-1}`), and limits (`\sum_{i=1}^{n}`). Use `\text{...}` for descriptive labels, `\operatorname{...}` for named functions, and explicit fractions and radicals where their scope matters. Standalone formula spans set `display: true`; inline math uses text style. Keep semicolons, paragraph breaks, and surrounding explanations outside a mathematical span where appropriate.

Do not infer TeX from arbitrary visitor text. The published page receives prebuilt HTML/MathML, CSS, and bundled fonts; it contains neither a TeX parser nor a runtime scan of lesson text. KaTeX remains pinned and verified at build time, with strict parsing and trusted commands disabled.

## Reading and fallback

- Original text remains visible until every required font loads. Missing, blocked, or failed fonts leave the plain version usable.
- Screen readers receive MathML; quiz control labels retain readable source notation and explicit matrix row descriptions.
- Formulas stay inside their container. Long expressions scroll horizontally by touch or keyboard, without making the whole page wider. Short expressions suppress rounding-induced scrollbars.
- Fractions and indices have enough vertical padding to avoid clipped glyphs. Surrounding explanations keep ordinary text styling.

## Verification

Build with `python build_site.py`, then run `node verify_math.mjs` from `source`. The checks cover every teaching and question field, all main formulas, grouped subscripts and superscripts, sums and integrals, numerical-constant preservation, exact matrix cells, equal notation styles for rectangularity choices, stale annotations, accessible output, and the plain-text fallback.

Also run the course, question-bank, lesson-clarity, quiz-feedback, review, state, progress, and bookmark checks listed in the README. Test the actual page at desktop and narrow phone widths. Useful visual cases are summation, matrix multiplication, derivative, integral, gradient boosting, attention, return, and variograms. Safari and native mobile browser behavior should be checked on those devices before release; local browser viewport tests do not substitute for that.
