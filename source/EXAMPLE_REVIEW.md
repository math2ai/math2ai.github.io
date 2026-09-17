# Worked-example and question review

Editorial review: 17 September 2026.

All 128 lessons and all 1,280 question prompts/intended answers were reviewed against their worked examples. The pass replaces 99 question records across 70 concepts, including exact copies, questions asking for an already supplied intermediate result, and closely reused scenarios. It also replaces identified copies of calculations worked in other lessons. Each replacement includes four choices, a first-mistake hint, and a final explanation.

## Standard

A question should require applying the lesson to a fresh case or reasoning beyond what the example has already solved. Rephrasing the same solved numbers, reversing the example's equation, or hiding identical squared errors behind shifted inputs does not create a new exercise. General conceptual questions may assess a taught rule; a coincidentally equal numerical answer alone is not evidence of duplication. A different query on the same objects may require new reasoning, but this pass also refreshes several such scenarios for clearer separation.

The worked examples themselves are retained. New questions supply their own scenario and do not rely on a random previous question or a hint for essential inputs. Negative quantities, different axis positions, competing choices and changed assumptions are used where they help test understanding without adding prerequisites.

## Coverage and validation

[example-review.json](example-review.json) records every reviewed concept, its example, all ten question IDs, and the previous prompt and reason for every replacement. Concepts with no replacements have an empty replacement list. This is an editorial record, not a claim that automated text similarity can certify instructional quality.

The numerical and structural verifiers independently recompute answers, check unique valid choices, preserve all 1,280 question slots, and reject restoration of the recorded copied prompts. Existing quiz, review, authentication and persistence checks still apply. The course version, concept ordering, question IDs and correct-option positions are retained. Earlier answers remain historical practice credit; this edit does not erase them or claim they were answers to the new wording.

## Replaced questions

| Concept | Question IDs |
| --- | --- |
| Variable | `2-04` |
| Function | `3-01` |
| Matrix | `6-02` |
| Tensor | `7-01`, `7-03`, `7-04` |
| Euclidean distance | `13-01`, `13-05`, `13-08` |
| Eigenvalues and eigenvectors | `103-01`, `103-06`, `103-10` |
| Singular value decomposition | `104-01` |
| Bayes’ theorem | `101-01` |
| Variance | `17-01`, `17-07` |
| Covariance and correlation | `102-01` |
| Monte Carlo estimation | `106-01` |
| Exponential and logarithm | `18-08` |
| Integral | `22-02`, `22-06` |
| Hessian and curvature | `108-01` |
| Chain rule | `21-03`, `21-05`, `21-07` |
| Lagrange multipliers | `107-01`, `107-03`, `107-08`, `107-09` |
| Linear regression | `30-01` |
| Mean squared error | `31-08` |
| Parameter and hyperparameter | `32-01`, `32-05` |
| Normalization | `26-01` |
| k-nearest neighbors | `109-01` |
| Decision trees | `110-03` |
| Regularization | `42-02` |
| Random forests | `111-01` |
| Gradient boosting | `112-01` |
| Class imbalance, precision and recall | `113-01`, `113-02` |
| Probability calibration | `114-01` |
| Causal inference | `120-01` |
| Domain shift and adaptation | `118-01` |
| Active learning | `119-01` |
| Sigmoid | `34-01`, `34-05` |
| ReLU | `35-03` |
| Forward pass | `37-02` |
| Backpropagation | `38-01` |
| Mini-batch gradient descent | `39-01`, `39-02` |
| Convolutional neural networks | `115-01` |
| Graph neural networks | `116-01` |
| Cross-entropy | `44-01` |
| KL divergence | `105-01`, `105-03` |
| Cosine similarity | `47-02` |
| Contrastive learning | `117-01` |
| Bit and byte | `79-07` |
| Numerical precision | `80-03` |
| Rate-distortion tradeoff | `51-01`, `51-02` |
| Token and vocabulary | `54-01`, `54-05` |
| Vector-quantized autoencoder | `53-05` |
| Diffusion models | `121-01` |
| Autoregressive language model | `61-03` |
| Scaled dot-product attention | `57-01` |
| Causal mask | `60-08` |
| Mixture of experts | `122-01` |
| Model distillation | `124-01` |
| API and SDK | `94-r2-07` |
| State, observation and action | `66-02`, `66-03` |
| Q-learning | `72-01` |
| Policy gradient | `74-01`, `74-05` |
| Safety constraint | `78-01` |
| Model predictive control | `77-02` |
| GPU | `82-04`, `82-06` |
| Context windows and KV caching | `123-01` |
| Memory bandwidth | `86-01`, `86-02`, `86-08` |
| H100 | `87-07` |
| TSMC and chip fabrication | `89-05` |
| Borehole logs and assays | `90-r2-01`, `90-r2-06` |
| Assay quality control | `125-01` |
| Ore grade estimation | `96-r2-01` |
| Variograms and kriging | `127-01`, `127-08` |
| Spatial cross-validation | `126-01` |
| Mineral processing and recovery | `128-01`, `128-04`, `128-05` |
| Benchmark and ablation | `98-05` |
