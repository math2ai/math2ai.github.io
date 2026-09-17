# Prerequisite review follow-up

17 September 2026. The earlier alignment pass missed the fact that the SVD lesson used “low-rank approximation” without explaining it. A worked example naming an operation is not sufficient instruction in its meaning or limits.

## Scope

Reviewed the definitions, formulas, examples, and question prompts/intended answers of all 128 lessons in curriculum order. Checked all four answer choices in the first 32 lessons and screened later choices for forward references to technical terms. This pass clarifies 33 lessons and revises 78 question records, including distractor-only edits. It keeps all worked examples and the lesson order.

## Decisions

- SVD defines rank, low-rank approximation, and the keep-largest rule. The subsequent clarity pass removes the component-sum notation and error-minimization theorem; its questions now assess the simpler scaling and retention rules. The information-loss question uses a concrete later task rather than undefined terminology.
- An example, an optional reading, another random question, and answer feedback do not count as the first teaching of an assessed prerequisite. Definitions and necessary premises must be available before an answer is attempted.
- Add brief teaching where the term belongs to the concept: independence, Bayesian prior/likelihood/posterior, classification counts, receptive fields, straight-through estimation, residual connections, and related terms.
- Use ordinary descriptions when the extra terminology is incidental: fine-tuning before its lesson, calibration bins, rollout, tabular, and deep Q-networks. Define unfamiliar operations or notation directly in numerical prompts where useful.
- A wrong answer should also be understandable. Remove early distractors such as “complex phase,” “permutation,” and later token/activation terminology.
- Distinguish a learner deriving a consequence of a taught rule from needing an untaught theorem or a new technical definition. Ordinary arithmetic and reasoning remain part of the exercises.

## Validation and limits

`prerequisite-review.json` records coverage and the changed lessons/questions. `verify_prerequisites.py` checks selected explicit prerequisite links against curriculum order and teaching text, along with independent calculations for the revised applications. The existing content, math-display, quiz, review and persistence tests also apply. Automated checks cannot establish that every explanation is sufficiently clear for every learner; this remains an editorial responsibility.

Course version, stable concept/question IDs, correct-option positions and existing practice history are retained. Changes revise the teaching and assessment wording, not authentication, sync or the database.

## Teaching corrections

| Lesson | Reason |
| --- | --- |
| Singular value decomposition | Explain singular values and low-rank approximation without adding the later error-minimization objective. |
| Matrix | Teach matrix arithmetic and diagonal terminology before questions use them. |
| Linear transformation | Define affine before it is used in answers and later network/Hessian questions. |
| Probability | Independence was first explained in the following lesson, after its first question use. |
| Bayes’ theorem | Define prior, likelihood and posterior explicitly. |
| Monte Carlo estimation | The formula named standard error without explaining what it measures. |
| Exponential and logarithm | State the logarithm domain before asking for an invalid input. |
| Derivative | Explain local/global extrema before derivative and Hessian questions, rather than waiting for Optimization. |
| Hessian and curvature | State the limit of the stationary-point test rather than assume advanced calculus. |
| Lagrange multipliers | Explain the scope and limitations of the displayed method before assessment. |
| Supervised learning | Introduce classification and generalization as concepts, not only as answer labels. |
| Data leakage | Windowing is assessed long before its dedicated lesson. |
| Decision trees | Define root and axis-aligned split before asking their roles. |
| Class imbalance, precision and recall | Explicitly define the classification counts and accuracy used by the questions. |
| Causal inference | Explain potential outcomes and why randomization helps before testing them. |
| Epoch | Define ceiling and the partial-batch convention. |
| Convolutional neural networks | Name and define receptive field before asking what it means. |
| Graph neural networks | Define hop before questions about one- and two-hop propagation. |
| Cosine similarity | Define unit vectors and unit normalization before cosine/contrastive questions. |
| Contrastive learning | Define augmentation rather than introduce it only in a question. |
| Principal component analysis | Explain projection operationally instead of assuming prior geometric vocabulary. |
| Numerical precision | Define overflow before asking for its meaning. |
| Vector-quantized autoencoder | Explain why the gradient estimator is needed and what it does, beyond naming its formula. |
| Diffusion models | Explain the supplied noise term; the clarity pass removes the unneeded Gaussian-distribution prerequisite. |
| Positional encoding | Remove an unnecessary forward reference to attention. |
| Multi-head attention | Define projection and concatenation as used here; a learned projection is not necessarily an orthogonal PCA projection. |
| Transformer | Define the architecture components and avoid implying the displayed ordering is universal. |
| CPU | Define CPU core before asking its meaning. |
| Memory capacity | Explain the memory categories required by the training-memory questions. |
| Memory bandwidth | Define memory-bound before the terminology question. |
| Assay quality control | Explain the distinct roles of reference materials, blanks and duplicates before assessing them. |
| Geoscience data integration | Introduce coordinate reference systems before the map-overlay question. |
| Spatial cross-validation | Define folds and the repeating evaluation process before using those labels. |
