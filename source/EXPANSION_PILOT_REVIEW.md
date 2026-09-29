# Ten-concept expansion pilot

29 September 2026. Exactly ten new concepts: **138 concepts, 1,380 questions, 45 editable examples**. This work does not implement the remaining 118 proposed concepts, adaptive assessment, Python or a new interface. Six new examples include plots. Existing lessons and their 1,280 questions retain their stable IDs, contents and course version 2.0.

## Read and try locally

Refresh the local page once. Display numbers follow teaching order; URL IDs are stable identities and deliberately differ. The new concepts sit among their prerequisites rather than at the end.

| Position | Lesson | Code edit to test | Expected change |
| --- | --- | --- | --- |
| 009 | [Linear combinations](http://localhost:8766/#lesson-150) | Change b from 3 to −1 | Result (1, −2); second movement reverses |
| 011 | [Norms and unit vectors](http://localhost:8766/#lesson-149) | Set v to [0, −7], then [0, 0] | Length 7 and unit vector (0, −1); zero gets a clear explanation |
| 013 | [Orthogonality](http://localhost:8766/#lesson-154) | Set v to [−2, 2] | Dot product 2; angle no longer perpendicular |
| 014 | [Vector projection](http://localhost:8766/#lesson-155) | Set x to [5, 1]; then set u to [0, 0] | Projection (3, 3), residual (2, −2); zero direction rejected |
| 015 | [Span](http://localhost:8766/#lesson-151) | Set v to [0, 1] | Sampled combinations spread across a plane instead of a line |
| 016 | [Linear independence](http://localhost:8766/#lesson-152) | Set w to [2, 1] | The displayed cancellation no longer holds; code explicitly says this alone does not prove independence |
| 017 | [Basis and dimension](http://localhost:8766/#lesson-153) | Set c to [2, −1], keeping the supplied basis fixed | Usual coordinates (1, 3), recovered coordinates (2, −1), zero reconstruction difference |
| 021 | [Systems of linear equations](http://localhost:8766/#lesson-156) | Set b to [10, 2] | Solution (6, 4); substitution checks both equations |
| 022 | [Matrix rank](http://localhost:8766/#lesson-159) | Change the bottom-right entry to 5, then zero all entries | Rank 2, then rank 0; code is explicitly a two-by-two test |
| 025 | [Low-rank approximation](http://localhost:8766/#lesson-160) | Set s to [1, 7] | Retains the second direction; error 1. Negative values get a message explaining the example's nonnegative-diagonal scope |

For each example, test **Reset example**, previous/next question, a first mistake and retry, and the explanation after finishing. New quiz calculations use different data or implications from their own worked examples. First-error hints explain a method without copying the complete correct option. The 100 questions were read against the lesson definitions and earlier prerequisites, not against information supplied only in another quiz.

Read the chain from span through independence, basis, systems, rank, SVD and low-rank approximation. Check that the distinction between reachability, unique coordinates, number of directions, and discarded information is clear. SVD is now preceded by these missing foundations. “Used in” must move forward; inline prerequisite links must move backward. Browser Back should restore the prior lesson and question.

## Validation

- Independent numeric checks solve all 32 new numerical option sets, including distractors, without using the marked answer to derive a result. Conceptual wording, assumptions and prerequisite alignment were reviewed separately.
- Edited-code tests check geometry against independent dot products and distance comparisons, zero-vector guards, coordinate recovery, equation substitution, rank boundaries, and low-rank error plots. All supplied outputs are tested.
- The built graph is independently reconstructed and checked with topological sorting: 138 nodes, no cycles. The 256-entry inventory remains separate and unpublished for the remaining lessons.
- Original teaching snapshots and question fingerprints remain valid; stable routes and saved positions follow concept identities after reordering. Progress, guest-to-account transfer, concurrent saves, review, bookmarks and quiz navigation run through the existing application test suite.
- All ten new examples render and calculate in the browser at the normal viewport and at 375-pixel phone width with no page overflow. Editing projection data and restoring it with Reset were exercised in the UI. This is Chromium responsive testing, not a claim of a physical Safari-device test.
- The original progress migration and expanded bookmark migration pass an isolated PostgreSQL test runtime, including account isolation, existing-data preservation and idempotent reapplication. No live database was changed.

## Required before production

The earlier bookmark function accepts only concept IDs through 128. Apply **supabase/migrations/202609290001_expand_learning_concepts.sql** in the same Supabase project after its original bookmark setup. It replaces only the function's validation bound with 256; authorization and conflict handling are unchanged, and no saved rows are deleted or rewritten.

Until that migration is applied, guest bookmarks on the new lessons work, but account bookmarks on those lessons cannot sync. Answer syncing already accepts the new question IDs and needs no schema change. After applying it, test a new lesson's Revisit later bookmark in two signed-in browser sessions before pushing the website. This migration has been prepared and tested locally, not applied to production.

No commit or push was made for this pilot.
