# Question alignment review

Editorial pass: 16 September 2026.

The course contains 128 concepts and 1,280 questions. A screen of every lesson and every question prompt/intended answer flagged 163 questions. This pass addresses those flags with 130 revised question records and short additions to 22 lessons. It does not claim that an automated test can certify instructional quality.

## Authoring standard

- Test the concept of the lesson, including applications and misconceptions.
- Use knowledge taught in this or earlier lessons, ordinary arithmetic, or information supplied before the first attempt.
- Keep random questions independent of one another. Include necessary numbers, conventions, and formulas in the prompt so Review works without the lesson body.
- A first-mistake hint, another random question, or optional reading is not prerequisite instruction.
- Check all four options, the first-mistake hint, and the final explanation together. Supply one supported answer and avoid introducing new technical labels as a substitute for reasoning.
- Keep brief lessons brief: prefer replacing an off-topic question or adding a short premise over expanding the course to justify it.

## Content decisions

Tensor remains after Matrix. Its lesson now explicitly teaches axes, shape, entry counts, index order, and the scalar/vector/matrix progression. Questions use stacks of tables; introductory image-channel and reshape questions were replaced.

Short teaching additions supply missing rules such as coordinatewise vector arithmetic, independence, the power rule, residuals, bootstrap sampling, stride/padding, and exploration over all actions. Other questions give their own needed premises or were replaced with applications of the current concept. Rate-distortion, Q-learning, policy gradient, and cluster questions now state their numerical inputs independently.

The borehole lesson distinguishes detection capability from quantification or proof of absence, consistent with the [IUPAC definition of limit of detection](https://goldbook.iupac.org/terms/view/L03540).

## Existing progress

This is an editorial correction within the existing concepts and question slots. Course version, concept IDs/order, question IDs, and correct-option positions are unchanged. Existing practice credit, first/latest results, and attempt counts are retained; they remain historical practice records, not a claim that a learner attempted the revised wording. Authentication, database schema, sync, and storage code are unchanged.

## Validation

The existing course, worked-example, bank, feedback, review, auth, and progress checks apply. `verify_alignment.py` independently calculates revised numerical/structured answers and checks required standalone inputs. A separate compatibility run loads pre-edit records for all 1,280 questions through the actual persistence/UI handlers and checks retained history and checkmarks across reloads. These checks use synthetic local data, not real accounts.

## Resolved audit queue

Each ID below corresponds to a flagged question. “Lesson” means the prerequisite is now taught before assessment; “Question” includes rewritten tasks, supplied context, or updated hints. Some questions use teaching added to an earlier lesson.

| Concept | Question corrections | Teaching/context corrections |
| --- | --- | --- |
| Scalar | `1-08` |  |
| Function | `3-10` |  |
| Vector | `5-08`, `5-09` | `5-02`, `5-06`, `5-07` |
| Tensor | `7-01`, `7-04`, `7-07`, `7-08`, `7-10` | `7-06` |
| Dot product | `9-05` |  |
| Matrix multiplication | `10-05` |  |
| Transpose | `11-06`, `11-08` |  |
| Linear transformation | `12-06` |  |
| Eigenvalues and eigenvectors | `103-08`, `103-10` |  |
| Singular value decomposition | `104-10` | `104-04`, `104-06`, `104-08` |
| Conditional probability |  | `15-05`, `15-10` |
| Expected value | `16-06` |  |
| Covariance and correlation | `102-07` | `102-03`, `102-10` |
| Monte Carlo estimation |  | `106-06` |
| Exponential and logarithm | `18-10` | `18-05` |
| Derivative |  | `19-10` |
| Integral | `22-07`, `22-10` |  |
| Gradient |  | `20-05` |
| Hessian and curvature | `108-06`, `108-08`, `108-10` | `108-03`, `108-04` |
| Chain rule | `21-05`, `21-07`, `21-08` | `21-10` |
| Lagrange multipliers | `107-09` |  |
| Gradient descent | `24-08` |  |
| Dataset and features | `25-09` |  |
| Linear regression | `30-07` | `30-09` |
| Mean squared error | `31-07`, `31-09` |  |
| Supervised learning |  | `29-07` |
| Parameter and hyperparameter | `32-03`, `32-05`, `32-06`, `32-09` |  |
| Training, validation and test | `27-06`, `27-07` |  |
| Normalization | `26-06` |  |
| Decision trees | `110-04`, `110-06` |  |
| Overfitting | `41-02` | `41-04`, `41-05` |
| Regularization |  | `42-04` |
| Random forests | `111-08` | `111-03`, `111-07` |
| Gradient boosting | `112-08` | `112-02`, `112-10` |
| Class imbalance, precision and recall | `113-06`, `113-10` |  |
| Probability calibration | `114-05`, `114-08` |  |
| Causal inference | `120-08` |  |
| Domain shift and adaptation | `118-03` |  |
| Active learning | `119-02` |  |
| Forward pass | `37-09`, `37-10` |  |
| Backpropagation | `38-08` | `38-06` |
| Epoch | `40-09` |  |
| Convolutional neural networks | `115-08`, `115-10` | `115-04`, `115-05` |
| Softmax | `43-06` |  |
| Cross-entropy | `44-02`, `44-05`, `44-10` |  |
| KL divergence | `105-06`, `105-07`, `105-08`, `105-09` |  |
| Self-supervised learning | `45-02`, `45-06`, `45-08` |  |
| Cosine similarity |  | `47-04` |
| Principal component analysis | `48-03`, `48-10` |  |
| Autoencoder | `49-06` |  |
| Latent space and bottleneck | `50-04` |  |
| Bit and byte | `79-09` |  |
| Numerical precision | `80-04` |  |
| Rate-distortion tradeoff | `51-01` |  |
| Token and vocabulary | `54-07`, `54-08` |  |
| Vector-quantized autoencoder | `53-05`, `53-07` |  |
| Sequence and autocorrelation | `55-10` |  |
| Scaled dot-product attention |  | `57-04` |
| Multi-head attention | `58-10` |  |
| Causal mask | `60-06` |  |
| Fine-tuning | `62-09` |  |
| Retrieval-augmented generation | `63-03` |  |
| API and SDK | `94-r2-03`, `94-r2-07`, `94-r2-09` |  |
| Tool calling | `64-08` |  |
| State, observation and action | `66-07` |  |
| Dynamical system | `65-08` |  |
| Markov decision process | `67-02`, `67-06`, `67-07` |  |
| Reward and return | `68-10` |  |
| Bellman equation | `71-07` |  |
| Exploration and exploitation |  | `73-06` |
| Q-learning | `72-01`, `72-07`, `72-08` |  |
| Policy gradient | `74-01`, `74-09` |  |
| Model predictive control | `77-02` |  |
| CPU | `81-09` |  |
| GPU | `82-03`, `82-06`, `82-07`, `82-08` |  |
| CUDA | `84-09`, `84-10` |  |
| Memory capacity | `85-04` |  |
| Context windows and KV caching | `123-10` |  |
| H100 | `87-07` |  |
| Compute cluster | `88-07` | `88-03`, `88-08` |
| TSMC and chip fabrication | `89-09` |  |
| Borehole logs and assays | `90-r2-04`, `90-r2-06`, `90-r2-10` |  |
| Assay quality control |  | `125-10` |
| Provenance and uncertainty | `92-r2-04`, `92-r2-08` |  |
| Variograms and kriging | `127-05`, `127-06`, `127-09` |  |
| Mineral processing and recovery | `128-07` |  |
| Representation alignment | `97-05` |  |
| Open source and reproducibility |  | `95-09` |
| Grounded model conversation | `100-r2-10` |  |
