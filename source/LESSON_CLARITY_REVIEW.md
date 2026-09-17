# Lesson clarity review

17 September 2026. Reviewed the definition and formula fields of all 128 lessons for long prose in equation blocks and unnecessary prerequisite expansion. Read the full question sets for SVD, Monte Carlo, Hessian, Lagrange multipliers, contrastive learning, VQ-VAE, diffusion, Transformer, and variograms/kriging to check the proposed simplifications against assessment.

- Separate equations from ordinary-size explanations in 59 lessons. Notes are explicitly authored, escaped, and rendered through the existing math/fallback path; there is no typography guessing at runtime.
- SVD keeps its factorization, singular-value meaning, rank, and a short low-rank explanation. Remove the expanded component sum and the optimal squared-error result. Two questions now test retaining the largest scale and applying a scale to a unit input. Two more replace the unnecessary term “component” with “singular value”.
- Monte Carlo teaches sampling and averaging first. The two standard-error exercises supply their meaning and rule within the question, instead of expanding the introductory definition.
- Contrastive learning uses the negative-log probability already taught in cross-entropy. Its temperature question supplies the score-division operation rather than requiring a second loss derivation.
- Diffusion explains the noise-mixture symbols and removes an unassessed Gaussian-distribution introduction.
- Transformer avoids repeating component definitions; residual additions and normalization are explained beside the two equations. Lagrange replaces the unexplained phrase “regularity condition” with the actual nonzero-gradient condition for one smooth constraint.
- Variograms/kriging, and six other dense definitions, use short paragraphs to distinguish their closely related ideas. Some lessons legitimately connect several earlier ideas; no new lessons or changes to curriculum order were needed.

The worked examples, stable concept/question IDs, correct-option positions, course version, and progress system are preserved. These editorial checks are not proof that every learner will find every lesson clear. Automated checks validate data consistency, selected prerequisites and calculations, notation fallback, quiz behavior, and persistence; browser checks cover the changed presentation.

Eight question records changed in this pass (including small terminology edits); five of them change the task or add a needed premise. Ordinary kriging no longer uses the incidental term “unbiasedness constraint” in its weights question.
