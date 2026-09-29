# Content depth review — 29 September 2026

All 128 existing lessons were reviewed and revised. The course still contains
128 concepts and the same 1,280 questions, in the same order, with the same stable
identifiers. This pass changes teaching content and the autoencoder calculation;
it does not expand the curriculum to 256 or alter answer storage.

## Editorial approach

Each lesson now connects its definition to a purpose, explains the mechanism or
interpretation of its calculation, and states an important assumption or limit.
Small existing examples are retained where useful and extended with intermediate
steps, comparisons or a second input. Learning methods distinguish supplied
weights from learned weights, training from prediction, and fitting from testing.

The amount of explanation varies with the concept. Basic concepts retain small
examples; methods that require a process receive more steps. No extra tabs,
disclosures or reading modes were introduced.

Representative changes:

- Matrix multiplication explains how one input produces several weighted outputs.
- SVD explains the information lost by retaining only one direction.
- Trees show a four-row dataset, its unsplit error, and how a split removes it.
- Boosting fits a correction across four rows instead of just adding a number.
- Backpropagation closes the loop with an update and a new forward-pass loss.
- PCA constructs the covariance of its points and compares retained and discarded
  directions.
- Autoencoder uses four training inputs, a 2→1→2 linear network, an explicit first
  gradient update, 40 repeated updates and a held-out input. Both encoder and
  decoder weights learn. Two plots show loss and reconstruction geometry.
- Attention varies the query to show why the mixture depends on the input.
- Transformer continues through a second residual/normalization stage, identifying
  which sublayer outputs are supplied for illustration.
- Language modeling connects next-token targets, loss, training and generation.
- Bellman and Q-learning distinguish an update target from an established value.
- Hardware examples separate arithmetic, data movement, storage and coordination.
- Mineral examples show interval alignment, weighted grade and closed mass
  balances rather than percentages without a physical interpretation.

## Validation

- `content-depth-review.json` records a separate review entry and teaching hash
  for every lesson, plus a fingerprint of the unchanged question bank.
- `verify_content_depth.py` checks those snapshots and 53 numerical claims,
  including an independent scalar calculation of the first autoencoder update.
- `verify_neural_playgrounds.mjs` checks both autoencoder gradients by finite
  differences, repeated training against independent row-by-row arithmetic,
  multiple datasets and dimensions, zero/excessive learning rates, row order,
  and exclusion of the test input from training.
- All 35 supplied editable examples, their outputs, and plots pass their existing
  numerical and worker/controller checks. New plot checks cover the autoencoder
  learning curve and reconstruction points.
- Course, question bank, prerequisite, notation, cross-link, navigation, review,
  progress-state and feedback regression checks pass. A stale regression-example
  text assertion was updated to its existing three-prediction wording while
  retaining the independent numerical assertion.
- All 128 lessons were navigated in the actual browser at its normal viewport
  and at 375 pixels wide: no page-level horizontal overflow or KaTeX error nodes.
  The actual worker produced the expected 40-update output; editing to one update
  produced MSE 0.465625, and Reset example restored the default.

The arithmetic/snapshot tests do not establish pedagogical quality. The editorial
review is a separate judgment; learner testing remains valuable. Narrow-viewport
testing is not a claim of a native Safari or phone-device test.

## Suggested local review

1. Open Autoencoder (display 069, stable link `#lesson-49`). Follow the first
   update, then compare it with `steps = 1` in the code. Reset and see 40 updates.
2. Change `probe` to `[[3, 1]]`: trained weights should remain identical, while
   reconstruction shows what the one-number code cannot preserve.
3. Change the training rows or learning rate. Check the loss curve and both plots.
4. Read Decision trees, Gradient boosting, PCA, Transformer, Q-learning and
   Mineral processing and recovery for representative changes across chapters.
5. Check simpler lessons such as Scalar, Tensor and Dot product for whether the
   added explanation is useful without becoming excessive.

## Primary references used for mechanism checks

- [Deep Learning: Autoencoders](https://www.deeplearningbook.org/contents/autoencoders.html)
- [scikit-learn: PCA](https://scikit-learn.org/stable/modules/decomposition.html#pca)
- [scikit-learn: Ensembles](https://scikit-learn.org/stable/modules/ensemble.html)
- [scikit-learn: Calibration](https://scikit-learn.org/stable/modules/calibration.html)
- [scikit-learn: Common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html)
- [Graph convolutional networks](https://arxiv.org/abs/1609.02907)
- [Contrastive representation learning](https://arxiv.org/abs/2002.05709)
- [Vector-quantized representations](https://arxiv.org/abs/1711.00937)
- [Denoising diffusion](https://arxiv.org/abs/2006.11239)
- [CUDA programming guide](https://docs.nvidia.com/cuda/cuda-programming-guide/)
- [H100 variant specifications](https://www.nvidia.com/en-us/data-center/h100/)
