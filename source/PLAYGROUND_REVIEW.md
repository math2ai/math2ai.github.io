# First content-expansion review checkpoint

Updated: 2026-09-29. Local review only; no commit, push, database migration, assessment, or change to saved-answer identities.

## Ready to review

- The website now contains 138 concepts and 1,380 questions. Ten new examples bring the total to 45; see EXPANSION_PILOT_REVIEW.md for their test checklist.
- Thirty-five existing concepts include a compact, always-visible code-and-output box below the worked example: the earlier 20 mathematics and regression examples, plus every lesson from Backpropagation through Autoencoder (positions have shifted as prerequisites are inserted). Hash routes use stable IDs; displayed course numbers can differ.
- Each starts with code that reproduces its worked example. Changing the code updates its output automatically, after a 300 ms pause in typing.
- The box contains code, output (including a plot where useful), any necessary calculation error, and small Reset example and math.js documentation controls. Reset example restores the current concept's original code and recalculates, replacing its edited draft. It has no extra title, instructions, variations toolbar, or disclosure link.
- The full native math.js expression language is enabled, including transpose, inverse, indexing, ranges, custom functions, complex numbers, units, fractions, big numbers, and symbolic operations. No application whitelist restricts the available functions or numeric types.
- Existing application links remain beside concept titles.
- The separate CURRICULUM_256_PLAN.md contains the proposed 256-concept order and hand-calculation seeds; it is not loaded into the website. The ten-lesson pilot is implemented; further expansion awaits review. PLAYGROUND_ENGINE_REVIEW.md records the math.js/Python assessment; Python has not been added.

## Supplied examples and independent checks

| Lesson | Initial code | Output | Change to test |
| --- | --- | --- | --- |
| Vector | x = [2, 3]; k = 2; k * x (on separate lines) | [4, 6] | k = -1 gives [-2, -3]; k = 0 gives [0, 0] |
| Matrix | A = [1, 2, 3; 4, 5, 6]; A; A[2, 3] (display lines omit semicolons) | Original matrix, then 6 | A[1, 2] gives 2 |
| Summation | x = [2, 4, 6]; sum(x); mean(x) (display lines omit semicolons) | 12, then 4 | [0, 3, 9] keeps both results; [2, 4, 12] gives 18 and 6 |
| Dot product | x = [2, 3]; w = [4, 5]; dot(x, w) | 23 | w = [3, -2] gives 0 |
| Transpose | A = [[1, 2, 3]]; transpose(A) | A 3 by 1 column | A = [1, 2; 3, 4; 5, 6] becomes [1, 3, 5; 2, 4, 6] |
| Linear transformation | A = [2, 0; 0, 3]; x = [1, 2]; A * x | [2, 6] | A = [1, 0; 0, 0] gives [1, 0] |
| Linear regression | Score a trial line, then minimize MSE for x = [1, 3, 5], y = [6, 7, 14] | Trial predictions [4, 8, 12], residuals [2, -1, 2], MSE 3; fitted rate 2, start 3, MSE 2 | y = [6, 7, 17] gives trial MSE 10; fitted rate 2.75, start 1.75, MSE 4.5 |
| Mean squared error | mean((prediction - target) .^ 2), using [2, 5] and [3, 3] | 2.5 | Prediction [3, 3] gives 0; [1, 7] gives 10 |
| Tensor (#lesson-7) | Count the positions in a 2 by 3 by 4 tensor, then index the smaller stack | Shape [2,3,4], 3 axes, 24 entries; entry 6; smaller shape [2,2,2] | Change ones(2,3,4) to ones(3,3,4): 36 entries, still 3 axes |
| Matrix multiplication (#lesson-10) | Multiply the lesson's matrix and column; inspect the first row-column dot product | [[17],[39]]; 17; shape [2,1] | Change B to [[1],[0]]: [[1],[3]], inspected entry 1 |
| Euclidean distance (#lesson-13) | Square the coordinate differences, sum, then take the square root | [9,16]; distance 5; norm 5 | Change y to [6,8]: [36,64], distance 10 |
| Eigenvalues and eigenvectors (#lesson-103) | Compare Av and lambda v, then use eigs(A) | Matching [2,0], mismatch 0; eigenvalues 2 and 3 with their vectors | Change proposed v to [1,1]: mismatch 1. The solver still reports the actual eigenvectors |
| Singular value decomposition (#lesson-104) | Explore the diagonal example and keep its strongest direction | Arrows [3,0], [0,1]; singular values [3,1]; A1 = [[3,0],[0,0]]; full point [6,5], retained point [6,0] | Change d to [1,3]: keeps the vertical direction and maps the point to [0,15] |
| Probability (#lesson-14) | Count even faces on a fair die; multiply for two independent throws | 0.5; 0.25 | Change sides to 5: 0.4; 0.16. Only displayed results are rounded |
| Expected value (#lesson-16) | Multiply outcomes by their probabilities, then sum | Contributions [0,5], expected value 5 | Change p to [0.8,0.2]: contributions [0,2], expected value 2 |
| Variance (#lesson-17) | Average squared deviations for equally likely values | Deviations [-2,2]; mean 4, variance 4, standard deviation 2 | Change values to [2,10]: mean 6, variance 16, standard deviation 4 |
| Covariance and correlation (#lesson-102) | Average products of paired deviations, then divide by standard deviations | Covariance 2, correlation 1 | Reverse y to [6,2]: covariance -2, correlation -1 |
| Monte Carlo estimation (#lesson-106) | Reproduce the recorded average, then sample equally likely rewards with a seed | Recorded average 3; 1,000 draws estimate 3.1, exact expectation 3 | Change n to 10: estimate 2.4. Change seed for different draws; reset restores 3.1 |
| Exponential and logarithm (#lesson-18) | Raise a base to a power and reverse it; repeat with base e | 8 and 3; approximately 7.389 and 2 | Change exponent to 4: power 16, recovered exponent 4 |
| Derivative (#lesson-19) | Compare a finite interval with the symbolic derivative | Change 0.0601, slope 6.01; derivative 2*x, instantaneous slope 6 | Change h to 0.001: change 0.006001, slope 6.001; derivative remains 6 |
| 55 Backpropagation (#lesson-38) | Multiply local derivatives, then separately take a training step | Prediction 2, loss 16, gradient -16; new weight 2.6, loss 0.64 | Set target = 4: gradient -8, new weight 1.8, loss 0.16 |
| 56 Mini-batch gradient descent (#lesson-39) | Derive each selected row's squared-error gradient and average | Gradients [2,6], mean 4, new weight 0.6; batch MSE 1.625 to 0.425 | Set batch = [1]: gradient 2, new weight 0.8, batch MSE 1 to 0.64 |
| 57 Epoch (#lesson-40) | Count steps for N = 100, B = 20, epochs = 3, keeping a partial final batch | 5 steps/epoch, 15 total steps, final batch 20 | Set N = 103: 6 steps/epoch, 18 total steps, final batch 3 |
| 58 Deep neural network (#lesson-36) | Calculate two ReLU hidden values, then the output; compare removing ReLU | Hidden values 3 and 2, output 6; also 6 without ReLU | Set x = 0: output 0, versus -6 without ReLU |
| 59 Convolutional neural networks (#lesson-115) | Slide the same [1,-1] kernel over [1,2,3]; expose stride, padding and bias | [-1,-1] | Set kernel = [1,1]: [3,5] |
| 60 Graph neural networks (#lesson-116) | Each node adds its neighbors' mean, using simultaneous updates | [1,2,4] becomes [4,3,5], then [8,7,9] | Set h = [1,4,8]: [7,5,9], then [14,12,16]; edit edges to test different neighbors |
| 61 Softmax (#lesson-43) | Convert [0,log(3)] into probabilities using a stable calculation | [0.25,0.75], sum 1 | Set logits = [1000,1000]: [0.5,0.5], without overflow |
| 62 Cross-entropy (#lesson-44) | Compare predictions [0.9,0.1] and [0.1,0.9] against target [1,0] | 0.105361, then 2.302585 | Set the first p = [0.5,0.5]: first loss 0.693147 |
| 63 KL divergence (#lesson-105) | Compare p = [1,0] with q = [0.5,0.5], then with q = p | 0.693147, then 0 | Set first q = [1,0]: both results 0 |
| 64 Self-supervised learning (#lesson-45) | Hide the middle value in [2,4,6]; score prediction 5 and an untrained visible-mean baseline | Visible [2,6], target 4, error 1; baseline 4, error 0 | Set data = [2,10,6]: target 10, errors 25 and 36; baseline prediction stays 4 |
| 65 Embedding (#lesson-46) | Look up a toy word vector; compare distances to dog and rock | Cat [1,0]; distances 0.141421 and 1.414214 | Set query = "dog": distances 0 and 1.272792 |
| 66 Cosine similarity (#lesson-47) | Divide a dot product by both lengths | Dot 2, lengths [1,2], similarity 1 | Set y = [0,2]: dot 0, similarity 0; zero vector gives an explanation |
| 67 Contrastive learning (#lesson-117) | Score the related pair against an alternative; compare reversed scores | Positive probability 0.8, loss 0.223144; reversed probability 0.2, loss 1.609438 | Set scores = [0,0]: both probabilities 0.5 and losses 0.693147 |
| 68 Principal component analysis (#lesson-48) | Center the data, compute covariance, find its leading eigenvector, project | Mean [0,0], covariance [[1,1],[1,1]], direction about [0.707107,0.707107], coordinates [-1.414214,1.414214] | Set data = [9,19;11,21]: mean [10,20], same covariance, direction and centered coordinates |
| 69 Autoencoder (#lesson-49) | Fit a 2-to-1-to-2 network to four rows, repeat full-batch updates, test a held-out input | Initial MSE 1.25; after one update 0.465625; after 40 about 0.000000001216; held-out [3,6] reconstructs near [3,6] | Set steps = 1 or rate = 0; change probe to [[3,1]] without changing training; edit data and compare both plots |

Each cell contains its worked calculation and, where useful, additional calculations that explore the same idea. Comments explain the local syntax and assumptions. Additional expressions produce outputs in order. Native math.js semantics apply: assignments also print their value unless ended with a semicolon. The supplied assignments use semicolons. Vectors and matrices use bracketed tables with spoken row labels; other results use math.js's text formatting. Functions and symbolic expressions can be displayed without attempting to send executable objects to the page.

The SVD cell is intentionally the lesson's two-dimensional diagonal example, not a general SVD routine. It preserves signs while ranking absolute stretches and retains only one axis on a tie. The variance/covariance cells use population averages, matching the equally likely outcomes in the lessons. Expected value rejects invalid probability totals; correlation explains why constant inputs make it undefined. Monte Carlo's same seed repeats the same draws in a fresh worker; increasing the sample count need not improve every individual estimate. Derivative compares finite-interval slopes with a symbolic result; very tiny intervals can lose floating-point precision, and only the displayed differences/slopes are rounded.

The neural-network cells use small, explicit calculations. Backpropagation separates computing the gradient from taking a step. Mini-batch gradients come from actual selected training rows. A large learning rate can increase loss. The autoencoder's two gradients both use the old weights on every update. Four training rows teach a shared direction; a separate probe never enters the gradients. Success on that line does not imply faithful reconstruction of arbitrary two-dimensional inputs. The self-supervised mean is explicitly an untrained baseline; it never reads the hidden value when predicting. Graph nodes update simultaneously, and an isolated node keeps its own value. CNNs use the usual unflipped kernel convention. Cross-entropy and KL use natural logarithms, validate probability lists, and handle zero-probability terms. PCA fits the direction from covariance; its sign and directions within tied eigenspaces are not unique. Only displayed results are rounded; calculations retain full precision.

## Verification

- All supplied examples and edited examples, plus 750 independently computed vector, dot-product, and rectangular-matrix calculations.
- Plot checks independently compare curve samples, tangent slopes, regression predictions, batch losses, softmax probabilities, cross-entropy values, PCA projections and reconstruction coordinates. Renderer checks cover gaps, equal axis scales, singleton/constant/all-zero/negative/large data, accessible descriptions and literal labels. Controller checks ensure edited or stale plots cannot remain on screen. Worker transport includes every supplied plot.
- All 12 plotted examples passed Chromium edit-and-reset tests and 320-pixel page-width checks. Phone axis labels are enlarged; desktop plots remain within the existing output box. Actual Safari/device testing remains outstanding.
- All 15 neural-network additions have independent checks in verify_neural_playgrounds.mjs: numerical finite differences for backpropagation, mini-batch and both autoencoder gradients; partial and empty batches; ReLU gating; convolution loops; simultaneous graph updates including isolated nodes; softmax shift invariance; probability-loss boundaries; hidden-target isolation; embedding distances; cosine geometry; contrastive scores; and PCA covariance, eigenpairs, maximum variance and projections on shifted, constant, tied and three-dimensional data.
- All 15 additions passed Chromium default/edit/Reset example checks and 320-pixel viewport checks without page overflow. PCA and Autoencoder were inspected visually at that width. No browser console errors or warnings were recorded. The original neural-example batch preserved the curriculum JSON and all 20 earlier example definitions. The subsequent 29 September content-depth review revises all lesson explanations and replaces the autoencoder cell; see CONTENT_DEPTH_REVIEW.md for that validation. Course, question-navigation, concept-link, worker and controller checks passed.
- Regression checked against hand answers, two-point data, repeated distances, row permutation, constant targets, unit conversion, and shifted targets. Trial predictions, residuals, and MSE are checked independently for five candidate lines. Independent residual conditions, MSE calculations, and neighboring-line comparisons verify least-squares optimality on six small datasets. Constant-distance data gives an editing instruction; mismatched lengths give a shape error.
- 36 native-language cases covering matrix operations, indexing/mutation, ranges, functions, conditionals, complex numbers, units, exact fractions/big numbers, symbolic expressions, strings, objects, and nonfinite results. Additional checks exercise inputs larger than the former eight-entry, 20-line, and 2,000-character limits.
- Native syntax/shape errors and parser protection against JavaScript globals and prototype access.
- Actual worker messaging for every rich-result case, fresh scopes, errors, and recovery.
- All 12 additional seeds and edits are checked independently: tensor entry counts including zeros, rectangular products, distances in different dimensions, eigenpair residuals, diagonal SVD signs/order/ties, invalid probabilities, population moments, undefined correlation, seeded sampling support and averages, logarithm inverses, and edited symbolic derivatives.
- Chromium checks covered the initial output, one meaningful edit, and Reset example for each of the 12 additions. All 12 also ran successfully at a 320-pixel viewport without page overflow; Tensor and Derivative were inspected visually. No browser console errors or warnings were recorded. Curriculum JSON and all eight earlier example definitions are unchanged by this batch.
- Bounded output previews with explicit truncation notes; calculations retain the full values. Literal string rendering cannot insert HTML.
- UI controller: automatic initial evaluation; debounced edits; immediate keyboard evaluation; stale-result suppression; draft preservation; same-lesson updates; error recovery; timeouts; Review and page-cache restoration; blank inputs; unavailable workers; cancellation and worker URL cleanup. Tests fail if the controller accesses answer storage.
- Concept-link, question-navigation, and Review regression tests passed for the initial playground changes. The MSE refinement changes only regression's definition, formulas, and worked example; its questions and all saved-answer identities remain unchanged. Course, bank, example/question, prerequisite, notation, math-rendering, concept-link, and playground checks pass.
- Earlier browser checks covered all three default results, negative-vector output, Ctrl+Enter, and retained quiz selection. The full-language update was checked in Chromium with rectangular transpose, custom functions, complex numbers, units, a symbolic derivative, syntax-error recovery, Review return, and 320-pixel layout. Wide matrices scroll within the output box without page overflow.
- The five added boxes were checked in Chromium against their expected outputs. Regression was also checked with edited fares, identical distances, Reset example, and navigation back; its code and output remain within the page at a 320-pixel viewport.
- The MSE refinement was checked in Chromium with a changed trial intercept (MSE 2), edited fares (trial MSE 10, fitted MSE 4.5), and Reset example (MSE 3 and 2). The revised formulas and code/output stay within a 320-pixel viewport. No browser console errors or warnings were recorded.
- Safari and a physical phone have not been tested. Worker failure produces a local message while the original worked example and quiz remain available.

## User test

The following existing boxes now include a plot after their numerical results. `plot()` is a local course helper; its syntax and limits are documented in README.md. It returns a display value, so end it without a semicolon to show it. Lines join supplied samples; they are not symbolic graphs, and sampled curves can miss narrow features or discontinuities between samples. Geometric examples use equal scales; other plots auto-scale each axis. Cross-entropy's extra curve explicitly describes the single-correct-class case, while its existing numerical calculation still supports soft targets.

| Concept (stable route) | Plot and edit to test |
| --- | --- |
| Vector (#lesson-5) | Original and scaled first two coordinates; set k = -1 to reverse direction |
| Variance (#lesson-17) | Observations against their mean; replace [2,6] with [2,10] |
| Derivative (#lesson-19) | Function and tangent; move x from 3 to -2 or change the function |
| Regression (#lesson-30) | Observations, original trial line, and fitted line; change the fares |
| Covariance and correlation (#lesson-102) | Scatter of paired values; reverse the y list |
| Backpropagation (#lesson-38) | Loss curve and weights before/after the step; increase rate to see overshooting |
| Mini-batch descent (#lesson-39) | Loss for the selected batch; change batch to [1] |
| Deep neural network (#lesson-36) | Input-output curves with/without ReLU; change w3 or a bias |
| Softmax (#lesson-43) | Discrete class probabilities; change logits to [0,0,0] |
| Cross-entropy (#lesson-44) | Single-class loss against the probability assigned to that class |
| PCA (#lesson-48) | Centered points, principal direction and projected points; use data = [-2,-1;0,1;2,0] so projection visibly moves points. Only the first two features are drawn for higher-dimensional inputs |
| Autoencoder (#lesson-49) | Training loss over 40 updates and input/reconstruction points before and after learning; set steps = 1 or rate = 0 |

1. Open Vector: the box should immediately show the example code and [4, 6], without clicking a disclosure or Run.
2. Change k to -1 and then 0. Confirm the output updates after typing pauses.
3. Enter 1+, then fix it to 1+2. The error should disappear and the result recover. Native math.js treats 1/0 as Infinity and sqrt(-1) as i.
4. Visit another concept or Review and come back. Your edited code and any unsubmitted quiz choice should survive.
5. Check Dot product and Linear transformation against the table above. Try the box on your phone.
6. Replace the code with A = [1, 2, 3; 4, 5, 6]; followed by transpose(A). The output should have rows [1, 4], [2, 5], and [3, 6].
7. Try f(x) = x^2 + 1; followed by map(1:4, f), or derivative("x^3", "x"). Follow the small documentation link for syntax and functions.
8. Click Reset example after editing or clearing the code, or after an error. The current concept's supplied code and output should return. Navigate away and back to confirm the restored code remains; other concepts' drafts should be unchanged.
9. Open Linear regression (#lesson-30). The trial line has MSE 3; the fitted line has rate 2, start 3, MSE 2. Change the trial intercept from 2 to 3: both MSE values should be 2. Reset, then change only y from [6, 7, 14] to [6, 7, 17]: trial MSE becomes 10; the fitted result becomes rate 2.75, start 1.75, MSE 4.5. Reset should restore the original data and both original results.
10. Try x = [2, 2, 2] in the regression fit: it should ask for different distances instead of displaying an invented slope. Then reset. Check the other four new boxes against the table above.

Code drafts stay in the current tab and start fresh on reload. Calculations do not affect saved answers, checkmarks, or account synchronization. The bundled library adds about 650 kB uncompressed; it runs in a disposable worker with a 3.5-second deadline. Output previews are limited to 32 rows/columns, 2,000 characters per text value/cell, and 100 outputs, with a visible note when shortened. The calculation itself retains its full values. The deadline is not a memory quota; excessive allocations can still exhaust browser resources.

## Reproduce the focused checks

From source/, after building the page:

- node verify_playground.mjs
- node verify_math_playgrounds.mjs
- node verify_neural_playgrounds.mjs
- node verify_plots.mjs
- node verify_playground_ui.mjs
- node verify_concept_links.mjs
- node verify_question_navigation.mjs
- node verify_review.mjs
