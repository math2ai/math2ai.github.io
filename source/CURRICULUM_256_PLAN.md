# Course expansion to 256 concepts

Review checkpoint: 28 September 2026. This is the authoring outline, not a change to the live teaching order. The website now has 138 concepts and 1,380 questions after the ten-lesson pilot. Existing stable lesson and question IDs remain unchanged; 129–256 below reserve IDs for proposed lessons, independently of their future display position.

29 September update: the first ten linear-algebra bridges are implemented. Gaussian elimination and matrix inverse remain proposed. See EXPANSION_PILOT_REVIEW.md for the local test checklist and required bookmark migration. Previous work added and reviewed code examples within the original 128 concepts. See PLAYGROUND_REVIEW.md for current coverage and PLAYGROUND_ENGINE_REVIEW.md for the math.js/Python assessment. The delivery sequence below remains a proposal.

1 October update: Limits (ID 162) is implemented ahead of its foundations batch, directly before Derivative, because Derivative and Integral are both defined through a limit. Tensor now follows Dot product, so the first vector calculations come before arrays with more axes. The website has 139 concepts and 1,390 questions; 51 foundational lessons remain in step 3. The Limits lesson is an author draft with independent numerical checks in `verify_limits.py` and has not yet had the editorial review given to the pilot.

## Delivery order

1. Review this outline and the three Explore prototypes on Vector, Dot product, and Linear transformation.
2. Review the ten-lesson pilot (138 concepts). Add the remaining two linear-algebra bridges only after review, eventually reaching 140. All additions include ten questions, retry explanations, and editable examples.
3. Add the other 52 foundational lessons in batches of roughly 8–12. Reach 192 concepts. Limits, one of the 52, is already live.
4. Add the remaining 64 lessons, with suitable playgrounds. Reach 256 concepts and 2,560 questions.
5. Complete the cross-course consistency review. Every earlier batch also gets editorial and functional review before handoff.

The delivery order is not the teaching order: new lessons are inserted at their prerequisite positions. Adaptive assessment is deferred. No calculator engine or account changes are required to read the outline.

## Editorial rules

- One main idea per lesson; explain symbols, indices, units, assumptions, and dimensions locally.
- Use small hand calculations. Repeat the needed data even when an example continues from another lesson.
- Give each lesson ten independent questions spanning interpretation, calculation, application, and a useful boundary or misconception. Do not ask for a solved example's answer or assume the other nine questions were read.
- Supply both an actionable first-mistake hint and a complete final explanation. Independently calculate numeric answers and inspect distractors for ambiguity.
- Preserve IDs when moving lessons. Decide deliberately whether a substantively replaced question needs a new identity; never change the course version just to reorder it.
- Keep short prerequisite and application links. A link does not replace defining an unfamiliar term.
- Add Explore only where changing something illuminates the concept. Do not make running code a prerequisite for reading or quiz credit.

## Examples and playgrounds

Use a small set of recurring examples, with all inputs restated: two-dimensional arrows; three measurements; four unlabeled points; six scored predictions; three possible tokens; a two-state decision problem; and four signal samples. No domain selector is planned.

The first three Explore boxes extend their actual worked examples. Later candidates include projection, fitting three points, one gradient step, classification thresholds, attention weights, complex rotation, and a four-point DFT. Use math.js expressions first. Python/Pyodide remains a later choice for experiments that need it.

The approved playground is an always-visible code/output box below the worked example, with a subtle documentation link and Reset example control. Edits recalculate automatically. It has no disclosure, prediction prompt, Run toolbar, or extra diagram. Resetting an experiment must not reset answers. Expression errors or worker failures leave the lesson and quiz usable.

## Changes needed in existing lessons as new prerequisites arrive

- SVD: concentrate on decomposing a map after orthogonality and rank have been taught. Move detailed truncation/error questions into Low-rank approximation, which follows SVD. Explain that each retained component contributes one input/output direction; do not introduce an unexplained optimality theorem.
- Derivative/Gradient/Lagrange multipliers: use the new rate-of-change, multivariable-function, partial-derivative, and constraint lessons. Still identify the input vector, objective, and constraint locally.
- Sigmoid: teach it as a scalar function before logistic regression. Neural-network applications remain linked; backpropagation-specific claims belong later.
- Cross-entropy/KL: teach probability distributions and entropy first, with a tiny probability table repeated locally.
- CNNs: build on the separate Convolution lesson and state the filter/boundary convention. Do not silently equate all software cross-correlation operations with the mathematical reversal convention.
- Transformer: build on residual connections, layer normalization, feed-forward blocks, positions, and attention. Then explain how an LLM uses the architecture. Keep detailed RLHF after the policy-learning foundations, with a forward application link from LLMs.
- FFT: distinguish the representation (DFT) from the algorithm that computes it. Introduce operation-count growth immediately before the FFT and cross-link it later to hardware cost.
- Hardware and mineral-resource examples are applications, not required foundations for understanding a neural network.

## Planned teaching order

“New” means proposed, not written or editorially approved. Hand activities are authoring seeds, not finished worked examples or quiz questions. The sequence checks in `curriculum-plan.json` protect the named learning chains; they are not a complete validated prerequisite DAG or an assessment policy.

### Numbers, notation and functions

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 001 | Scalar | 1 | Existing |
| 002 | Variable | 2 | Existing |
| 003 | Order of operations | 133 | New |
| 004 | Fractions and ratios | 129 | New |
| 005 | Percentages and percentage points | 130 | New |
| 006 | Powers and roots | 131 | New |
| 007 | Absolute value | 132 | New |
| 008 | Substitution and evaluating expressions | 134 | New |
| 009 | Summation | 8 | Existing |
| 010 | Solving an equation | 135 | New |
| 011 | Inequalities and intervals | 136 | New |
| 012 | Sets and membership | 137 | New |
| 013 | Units | 4 | Existing |
| 014 | Coordinates and graphs | 138 | New |
| 015 | Function | 3 | Existing |
| 016 | Domain and range | 141 | New |
| 017 | Slope and intercept | 139 | New |
| 018 | Function composition | 142 | New |
| 019 | Inverse functions | 143 | New |
| 020 | Piecewise functions | 144 | New |
| 021 | Polynomials | 145 | New |
| 022 | Means and weighted averages | 140 | New |
| 023 | Angles and radians | 146 | New |
| 024 | Sine and cosine | 147 | New |
| 025 | Polar coordinates | 148 | New |

### Vectors and matrices

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 026 | Vector | 5 | Existing |
| 027 | Matrix | 6 | Existing |
| 028 | Linear combinations | 150 | Existing |
| 029 | Dot product | 9 | Existing |
| 030 | Tensor | 7 | Existing |
| 031 | Norms and unit vectors | 149 | Existing |
| 032 | Euclidean distance | 13 | Existing |
| 033 | Orthogonality | 154 | Existing |
| 034 | Vector projection | 155 | Existing |
| 035 | Span | 151 | Existing |
| 036 | Linear independence | 152 | Existing |
| 037 | Basis and dimension | 153 | Existing |
| 038 | Matrix multiplication | 10 | Existing |
| 039 | Transpose | 11 | Existing |
| 040 | Linear transformation | 12 | Existing |
| 041 | Systems of linear equations | 156 | Existing |
| 042 | Gaussian elimination | 157 | New |
| 043 | Matrix inverse | 158 | New |
| 044 | Matrix rank | 159 | Existing |
| 045 | Eigenvalues and eigenvectors | 103 | Existing |
| 046 | Singular value decomposition | 104 | Existing |
| 047 | Low-rank approximation | 160 | Existing |

### Change and optimization

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 048 | Exponential and logarithm | 18 | Existing |
| 049 | Average rate of change | 161 | New |
| 050 | Limits | 162 | Existing |
| 051 | Derivative | 19 | Existing |
| 052 | Finite differences | 165 | New |
| 053 | Local linear approximation | 166 | New |
| 054 | Integral | 22 | Existing |
| 055 | Functions of several variables | 163 | New |
| 056 | Partial derivatives | 164 | New |
| 057 | Gradient | 20 | Existing |
| 058 | Jacobian | 167 | New |
| 059 | Chain rule | 21 | Existing |
| 060 | Optimization | 23 | Existing |
| 061 | Convexity | 168 | New |
| 062 | Hessian and curvature | 108 | Existing |
| 063 | Constraints and feasible regions | 170 | New |
| 064 | Lagrange multipliers | 107 | Existing |
| 065 | Gradient descent | 24 | Existing |
| 066 | Learning rate and convergence | 169 | New |

### Probability and evidence

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 067 | Probability | 14 | Existing |
| 068 | Random variables | 171 | New |
| 069 | Discrete probability distributions | 172 | New |
| 070 | Bernoulli distribution | 173 | New |
| 071 | Binomial distribution | 174 | New |
| 072 | Joint probability | 178 | New |
| 073 | Marginalization | 179 | New |
| 074 | Conditional probability | 15 | Existing |
| 075 | Independence | 180 | New |
| 076 | Conditional independence | 181 | New |
| 077 | Likelihood | 182 | New |
| 078 | Bayes’ theorem | 101 | Existing |
| 079 | Expected value | 16 | Existing |
| 080 | Variance | 17 | Existing |
| 081 | Probability density | 175 | New |
| 082 | Normal distribution | 176 | New |
| 083 | Cumulative probability | 177 | New |
| 084 | Covariance and correlation | 102 | Existing |
| 085 | Populations and samples | 183 | New |
| 086 | Median and quantiles | 184 | New |
| 087 | Sample variance | 185 | New |
| 088 | Sampling and selection bias | 186 | New |
| 089 | Law of large numbers | 187 | New |
| 090 | Central limit theorem | 188 | New |
| 091 | Standard error | 189 | New |
| 092 | Confidence intervals | 190 | New |
| 093 | Bootstrap resampling | 191 | New |
| 094 | Randomized experiments | 192 | New |
| 095 | Monte Carlo estimation | 106 | Existing |

### Learning from data

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 096 | Dataset and features | 25 | Existing |
| 097 | Supervised learning | 29 | Existing |
| 098 | Parameter and hyperparameter | 32 | Existing |
| 099 | Baseline models | 205 | New |
| 100 | Training, validation and test | 27 | Existing |
| 101 | Data leakage | 28 | Existing |
| 102 | Cross-validation | 211 | New |
| 103 | One-hot encoding | 200 | New |
| 104 | Feature engineering | 201 | New |
| 105 | Linear regression | 30 | Existing |
| 106 | Mean squared error | 31 | Existing |
| 107 | Mean absolute error | 210 | New |
| 108 | Polynomial regression | 202 | New |
| 109 | Normalization | 26 | Existing |
| 110 | k-nearest neighbors | 109 | Existing |
| 111 | Decision trees | 110 | Existing |
| 112 | Overfitting | 41 | Existing |
| 113 | Regularization | 42 | Existing |
| 114 | Random forests | 111 | Existing |
| 115 | Gradient boosting | 112 | Existing |
| 116 | Hyperparameter search | 212 | New |
| 117 | Learning curves | 213 | New |
| 118 | Bias–variance tradeoff | 214 | New |
| 119 | Unsupervised learning | 197 | New |
| 120 | k-means clustering | 198 | New |
| 121 | Causal inference | 120 | Existing |
| 122 | Domain shift and adaptation | 118 | Existing |
| 123 | Active learning | 119 | Existing |

### Probabilistic models and evaluation

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 124 | Entropy | 193 | New |
| 125 | Mutual information | 194 | New |
| 126 | Maximum likelihood estimation | 195 | New |
| 127 | Maximum a posteriori estimation | 196 | New |
| 128 | Sigmoid | 34 | Existing |
| 129 | Logistic regression | 199 | New |
| 130 | Naive Bayes | 204 | New |
| 131 | Kernel methods | 203 | New |
| 132 | Confusion matrix | 206 | New |
| 133 | Class imbalance, precision and recall | 113 | Existing |
| 134 | Decision thresholds | 207 | New |
| 135 | Precision–recall curves | 208 | New |
| 136 | ROC curves and AUC | 209 | New |
| 137 | Probability calibration | 114 | Existing |
| 138 | Softmax | 43 | Existing |
| 139 | Cross-entropy | 44 | Existing |
| 140 | KL divergence | 105 | Existing |

### Signals and complex numbers

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 141 | Complex numbers | 215 | New |
| 142 | Complex multiplication and rotation | 216 | New |
| 143 | Euler's formula | 217 | New |
| 144 | Amplitude and phase | 219 | New |
| 145 | Superposition of signals | 220 | New |
| 146 | Sequence and autocorrelation | 55 | Existing |
| 147 | Sampling and aliasing | 218 | New |
| 148 | Fourier transform and the DFT | 221 | New |
| 149 | Algorithmic complexity | 253 | New |
| 150 | Fast Fourier Transform | 222 | New |
| 151 | Convolution | 223 | New |
| 152 | Spectrograms | 224 | New |

### Neural networks and training

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 153 | Artificial neuron | 33 | Existing |
| 154 | ReLU | 35 | Existing |
| 155 | Computation graphs | 225 | New |
| 156 | Forward pass | 37 | Existing |
| 157 | Tensor reshaping | 226 | New |
| 158 | Broadcasting | 227 | New |
| 159 | Deep neural network | 36 | Existing |
| 160 | Backpropagation | 38 | Existing |
| 161 | Mini-batch gradient descent | 39 | Existing |
| 162 | Epoch | 40 | Existing |
| 163 | Weight initialization | 228 | New |
| 164 | Vanishing and exploding gradients | 229 | New |
| 165 | Gradient clipping | 230 | New |
| 166 | Momentum | 231 | New |
| 167 | Adam | 232 | New |
| 168 | Dropout | 233 | New |
| 169 | Batch normalization | 234 | New |
| 170 | Layer normalization | 235 | New |
| 171 | Residual connections | 236 | New |
| 172 | Convolutional neural networks | 115 | Existing |
| 173 | Graphs and adjacency matrices | 247 | New |
| 174 | Graph neural networks | 116 | Existing |

### Representations and compression

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 175 | Self-supervised learning | 45 | Existing |
| 176 | Embedding | 46 | Existing |
| 177 | Cosine similarity | 47 | Existing |
| 178 | Contrastive learning | 117 | Existing |
| 179 | Principal component analysis | 48 | Existing |
| 180 | Autoencoder | 49 | Existing |
| 181 | Latent space and bottleneck | 50 | Existing |
| 182 | Bit and byte | 79 | Existing |
| 183 | Numerical precision | 80 | Existing |
| 184 | Rate-distortion tradeoff | 51 | Existing |
| 185 | Vector quantization | 52 | Existing |
| 186 | Token and vocabulary | 54 | Existing |
| 187 | Vector-quantized autoencoder | 53 | Existing |
| 188 | Diffusion models | 121 | Existing |

### Attention and language models

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 189 | Byte-pair tokenization | 237 | New |
| 190 | Positional encoding | 56 | Existing |
| 191 | Rotary positional embeddings | 240 | New |
| 192 | Scaled dot-product attention | 57 | Existing |
| 193 | Multi-head attention | 58 | Existing |
| 194 | Causal mask | 60 | Existing |
| 195 | Feed-forward blocks | 238 | New |
| 196 | Transformer | 59 | Existing |
| 197 | Encoder and decoder architectures | 239 | New |
| 198 | Large language models and next-token prediction | 61 | Existing |
| 199 | Temperature and sampling | 241 | New |
| 200 | Top-k and top-p sampling | 242 | New |
| 201 | Perplexity | 243 | New |
| 202 | Mixture of experts | 122 | Existing |
| 203 | Fine-tuning | 62 | Existing |
| 204 | Low-rank adaptation (LoRA) | 244 | New |
| 205 | In-context learning | 246 | New |
| 206 | Model distillation | 124 | Existing |
| 207 | Retrieval-augmented generation | 63 | Existing |
| 208 | Retrieval ranking and reranking | 245 | New |
| 209 | API and SDK | 94 | Existing |
| 210 | Tool calling | 64 | Existing |

### Decisions, learning and control

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 211 | State, observation and action | 66 | Existing |
| 212 | Dynamical system | 65 | Existing |
| 213 | Markov chains | 248 | New |
| 214 | Markov decision process | 67 | Existing |
| 215 | Reward and return | 68 | Existing |
| 216 | Policy | 69 | Existing |
| 217 | Value function | 70 | Existing |
| 218 | Bellman equation | 71 | Existing |
| 219 | Dynamic programming | 250 | New |
| 220 | Value iteration | 252 | New |
| 221 | Exploration and exploitation | 73 | Existing |
| 222 | Multi-armed bandits | 249 | New |
| 223 | Q-learning | 72 | Existing |
| 224 | Temporal-difference learning | 251 | New |
| 225 | Policy gradient | 74 | Existing |
| 226 | Model-based RL | 76 | Existing |
| 227 | Safety constraint | 78 | Existing |
| 228 | Model predictive control | 77 | Existing |
| 229 | RLHF | 75 | Existing |

### Computing and deployment

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 230 | CPU | 81 | Existing |
| 231 | FLOPs and matrix-operation cost | 254 | New |
| 232 | GPU | 82 | Existing |
| 233 | Tensor core | 83 | Existing |
| 234 | CUDA | 84 | Existing |
| 235 | Memory capacity | 85 | Existing |
| 236 | Weight quantization | 256 | New |
| 237 | Context windows and KV caching | 123 | Existing |
| 238 | Memory bandwidth | 86 | Existing |
| 239 | Latency and throughput | 255 | New |
| 240 | H100 | 87 | Existing |
| 241 | Compute cluster | 88 | Existing |
| 242 | TSMC and chip fabrication | 89 | Existing |

### Applied AI: mineral resource extraction

| Position | Concept | Stable ID | Status |
| --- | --- | --- | --- |
| 243 | Borehole logs and assays | 90 | Existing |
| 244 | Assay quality control | 125 | Existing |
| 245 | Provenance and uncertainty | 92 | Existing |
| 246 | Geoscience data integration | 93 | Existing |
| 247 | Windowing and missing data | 91 | Existing |
| 248 | Ore grade estimation | 96 | Existing |
| 249 | Variograms and kriging | 127 | Existing |
| 250 | Spatial cross-validation | 126 | Existing |
| 251 | Mineral processing and recovery | 128 | Existing |
| 252 | Representation alignment | 97 | Existing |
| 253 | Benchmark and ablation | 98 | Existing |
| 254 | Open source and reproducibility | 95 | Existing |
| 255 | Forward-deployed engineering | 99 | Existing |
| 256 | Grounded model conversation | 100 | Existing |

## Hand-calculation seeds for the 128 additions

### Numbers, notation and functions

- **Order of operations:** Compare 2 + 3 × 4 with (2 + 3) × 4.
- **Fractions and ratios:** Simplify 6/8 and compare 3:4 with 6:8.
- **Percentages and percentage points:** Distinguish a rise from 40% to 50% from a 10% relative increase.
- **Powers and roots:** Calculate 3² and √9; distinguish √9 from solving x² = 9.
- **Absolute value:** Compare signed error −3 with its magnitude 3.
- **Substitution and evaluating expressions:** Evaluate 2x + y at x = 3, y = −1.
- **Solving an equation:** Undo the operations in 2x + 3 = 11.
- **Inequalities and intervals:** Mark the inputs satisfying −1 ≤ x < 2.
- **Sets and membership:** Find the intersection of {1, 2, 3} and {2, 4}.
- **Coordinates and graphs:** Plot (1, 2), (2, 4), (3, 6), naming both axes.
- **Domain and range:** Find the allowed inputs and possible outputs of √x over real numbers.
- **Slope and intercept:** Find the slope between (1, 3) and (3, 7), then the intercept.
- **Function composition:** For f(x) = 2x and g(x) = x + 1, compare f(g(3)) and g(f(3)).
- **Inverse functions:** Undo f(x) = 3x + 2; explain why an inverse needs a suitable domain.
- **Piecewise functions:** Evaluate a rule using one formula below zero and another above it.
- **Polynomials:** Evaluate x² + 2x + 1 at three inputs and identify its degree.
- **Means and weighted averages:** Compare an equal average of 2 and 8 with weights 3/4 and 1/4.
- **Angles and radians:** Relate a quarter turn to 90° and π/2 radians.
- **Sine and cosine:** Read the coordinates of a point on the unit circle at quarter turns.
- **Polar coordinates:** Represent (0, 2) using a length and an angle.

### Vectors and matrices

- **Linear combinations:** Form 2(1, 0) + 3(0, 1).
- **Norms and unit vectors:** Turn (3, 4) into a unit vector; distinguish length from direction.
- **Orthogonality:** Check that (1, 1) and (1, −1) have zero dot product.
- **Vector projection:** Project (3, 4) onto the horizontal axis and calculate the residual.
- **Span:** Identify which points multiples of (1, 2) can reach.
- **Linear independence:** Decide whether (1, 2) and (2, 4) provide two independent directions.
- **Basis and dimension:** Express (3, 2) using the basis (1, 1), (1, −1).
- **Systems of linear equations:** Solve x + y = 5 and x − y = 1.
- **Gaussian elimination:** Remove one variable by subtracting rows in a two-equation system.
- **Matrix inverse:** Undo a diagonal scaling; contrast it with a transformation that discards a coordinate. Define the identity matrix explicitly here.
- **Matrix rank:** Compare the independent columns of [[1, 2], [2, 4]] and the identity matrix.
- **Low-rank approximation:** Replace diag(4, 1) with diag(4, 0) and measure squared entrywise error.

### Change and optimization

- **Average rate of change:** Compute the slope of x² between x = 1 and x = 2.
- **Limits:** Examine (x² − 1)/(x − 1) near x = 1, distinguishing its limit from its undefined value there.
- **Finite differences:** Approximate the derivative of x² at x = 2 with two different step sizes.
- **Local linear approximation:** Use the slope of x² at 2 to estimate 2.1² and compare with the exact answer.
- **Functions of several variables:** Evaluate f(x, y) = x² + 3y at two input pairs.
- **Partial derivatives:** For x² + 3y², vary x while holding y fixed, then reverse the roles.
- **Jacobian:** Build the derivative matrix for F(x, y) = (2x + y, x − y).
- **Convexity:** Compare a bowl-shaped objective with a two-valley objective.
- **Constraints and feasible regions:** Draw the allowed region x ≥ 0, y ≥ 0, x + y ≤ 4.
- **Learning rate and convergence:** Take one gradient step on (x − 3)² with step sizes 0.25, 0.5 and 1.

### Probability and evidence

- **Random variables:** Map two coin tosses to the number of heads.
- **Discrete probability distributions:** Build the probability table for that head count and check its total.
- **Bernoulli distribution:** Represent a single success/failure trial with success probability 1/4.
- **Binomial distribution:** Enumerate three fair tosses and find the probability of exactly two heads.
- **Joint probability:** Fill a 2 × 2 table for two binary outcomes.
- **Marginalization:** Sum that table's rows and columns to recover individual distributions.
- **Independence:** Test whether a joint probability equals the product of its marginals.
- **Conditional independence:** Use a small supplied table to see whether two variables are independent within each group.
- **Likelihood:** Compare how well coin biases 1/2 and 3/4 explain two heads and one tail.
- **Probability density:** Use a uniform density over [0, 2] to calculate probability from area.
- **Normal distribution:** Locate values one standard deviation from a stated mean; use supplied areas rather than unexplained tables.
- **Cumulative probability:** Add a discrete table's probabilities up to a chosen threshold.
- **Populations and samples:** Enumerate all size-two samples from a four-item population.
- **Median and quantiles:** Sort five values and compare the median with the mean after adding an outlier.
- **Sample variance:** Calculate squared deviations for three readings; explain the estimator and denominator being used.
- **Sampling and selection bias:** Compare an average from all four readings with an average after selecting only high readings.
- **Law of large numbers:** Follow the running head fraction in a supplied sequence of coin tosses.
- **Central limit theorem:** Build the distribution of sample means from a small population; explain the conditions and approximation limits.
- **Standard error:** Distinguish spread of observations from spread of sample means using enumerated samples.
- **Confidence intervals:** Interpret intervals from repeated supplied samples without claiming a frequentist interval assigns probability to a fixed parameter.
- **Bootstrap resampling:** Resample a three-value dataset with replacement and compare resulting means.
- **Randomized experiments:** Compare group mean outcomes and explain why random assignment matters.

### Learning from data

- **Baseline models:** Compare always predicting the majority class or training mean with a learned model.
- **Cross-validation:** Rotate three held-out folds while fitting preprocessing only on each training fold.
- **One-hot encoding:** Encode three categories without inventing an ordinal relationship.
- **Feature engineering:** Add area = width × height to a tiny table and state when each input is available.
- **Mean absolute error:** Compare absolute and squared losses on errors 1, 1 and 4.
- **Polynomial regression:** Fit a curved relationship using features x and x² while remaining linear in the fitted weights.
- **Hyperparameter search:** Choose among a supplied validation-results table while leaving test results untouched.
- **Learning curves:** Read training and validation errors as the number of examples grows.
- **Bias–variance tradeoff:** Compare predictions from several fits across repeated supplied training sets.
- **Unsupervised learning:** Group unlabeled points, then distinguish the grouping from known target labels.
- **k-means clustering:** Assign four one-dimensional points to two centers and update their means once.

### Probabilistic models and evaluation

- **Entropy:** Compare uncertainty in a fair binary outcome with a certain outcome, using base-two logarithms.
- **Mutual information:** Compare independent bits with two identical bits using tiny probability tables.
- **Maximum likelihood estimation:** Find the coin bias maximizing the likelihood of two heads in three tosses.
- **Maximum a posteriori estimation:** Combine a supplied likelihood and prior table over three candidate parameters.
- **Logistic regression:** Convert a linear score into a probability, then distinguish the probability from the chosen class.
- **Naive Bayes:** Classify one example from two binary features using supplied probabilities and a stated conditional-independence assumption.
- **Kernel methods:** Compare an explicit small feature map with the dot products it produces.
- **Confusion matrix:** Classify six predictions into true/false positives and negatives.
- **Decision thresholds:** Move a threshold across those six scores and recount mistakes.
- **Precision–recall curves:** Compute precision and recall at three thresholds.
- **ROC curves and AUC:** Count how often a positive example ranks above a negative, handling ties explicitly.

### Signals and complex numbers

- **Complex numbers:** Add 2 + 3i and 1 − i; plot the result in the complex plane.
- **Complex multiplication and rotation:** Multiply 3 + 4i by i and compare lengths and directions.
- **Euler's formula:** Relate e^(iθ) to quarter turns using cosine and sine.
- **Amplitude and phase:** Compare two waves of equal frequency with different heights or horizontal shifts.
- **Superposition of signals:** Add two short sampled waves entry by entry.
- **Sampling and aliasing:** Sample two different waves at the same four times and observe identical samples.
- **Fourier transform and the DFT:** Transform the four samples [1, 0, −1, 0], with the transform convention stated.
- **Algorithmic complexity:** Count operations as a small input doubles; distinguish growth rates from measured runtime.
- **Fast Fourier Transform:** Split a four-point DFT into even and odd parts and count reused calculations.
- **Convolution:** Slide a two-entry filter over a four-entry signal, explicitly defining reversal and boundary handling.
- **Spectrograms:** Compare frequency summaries of two short windows and explain the time/frequency tradeoff.

### Neural networks and training

- **Computation graphs:** Draw the operations for (wx + b)² and identify reused intermediate values.
- **Tensor reshaping:** Reshape six entries into 2 × 3 and 3 × 2 arrays without changing their sequence.
- **Broadcasting:** Add a three-entry bias vector to each row of a 2 × 3 matrix; distinguish this from matrix multiplication.
- **Weight initialization:** Show why two identically initialized hidden neurons can receive identical updates.
- **Vanishing and exploding gradients:** Multiply four local derivatives of 1/2 or 2 and inspect the resulting sensitivity.
- **Gradient clipping:** Clip a two-dimensional gradient to a stated maximum norm.
- **Momentum:** Apply a stated recurrence to three supplied gradients.
- **Adam:** Compute its first update from a scalar gradient with all conventions and bias corrections supplied.
- **Dropout:** Apply a stated mask to four activations, including the chosen rescaling convention.
- **Batch normalization:** Normalize one feature over a tiny batch and distinguish training from inference statistics.
- **Layer normalization:** Normalize the features of one token and contrast the normalization axis with batch normalization.
- **Residual connections:** Compute x + F(x) for two coordinates and trace the direct path.
- **Graphs and adjacency matrices:** Convert a three-node drawing into a matrix and count neighbors.

### Attention and language models

- **Byte-pair tokenization:** Apply a few explicitly supplied merge rules to a short string.
- **Rotary positional embeddings:** Rotate a pair of coordinates at two positions and examine their relative angle.
- **Feed-forward blocks:** Apply two small linear maps with a nonlinearity between them to one token vector.
- **Encoder and decoder architectures:** Draw which tokens can see which other tokens in small bidirectional, causal and encoder–decoder examples.
- **Temperature and sampling:** Convert two logits into probabilities at two temperatures, then distinguish sampling from choosing the maximum.
- **Top-k and top-p sampling:** Keep and renormalize entries from a four-token probability table.
- **Perplexity:** Compare two models' probabilities for a three-token sequence.
- **Low-rank adaptation (LoRA):** Multiply a 2 × 1 and a 1 × 2 matrix to create a small weight update.
- **In-context learning:** Contrast supplying examples in the prompt with updating the model's weights. Use a tiny pattern-completion example without claiming guaranteed learning.
- **Retrieval ranking and reranking:** Rank four documents by a supplied score, then rerank the shortlist under a second criterion.

### Decisions, learning and control

- **Markov chains:** Multiply a two-state probability vector by a transition matrix.
- **Dynamic programming:** Reuse solutions to shorter paths in a small acyclic decision graph.
- **Value iteration:** Perform one Bellman optimality update on two states with two actions.
- **Multi-armed bandits:** Compare two actions' estimated rewards and identify the value of another observation.
- **Temporal-difference learning:** Calculate one reward-plus-next-value prediction error and update a value estimate.

### Computing and deployment

- **FLOPs and matrix-operation cost:** Count multiply/add operations in a 2 × 3 by 3 × 2 product under a stated convention.
- **Weight quantization:** Map four weights onto a small integer grid and measure reconstruction error.
- **Latency and throughput:** Compare time per request with requests per second in a small batching example.
