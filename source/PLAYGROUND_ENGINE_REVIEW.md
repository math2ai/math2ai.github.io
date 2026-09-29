# Choosing an engine for the existing 128 concepts

Reviewed 29 September 2026. This is an implementation assessment, not an expansion of the course. The published curriculum data and saved-answer identities are unchanged. No Python runtime has been added.

## Decision

Keep math.js as the default for small, hand-checkable experiments. Use Python through Pyodide selectively when working with a standard estimator or a data table is itself the learning objective. Do not translate every mathematical formula into Python, and do not recreate a machine-learning library in math.js.

The course now adds a small `plot()` function to the expression scope. It snapshots numeric series in the worker and returns bounded plain data; the page draws SVG paths, markers and labels using DOM APIs. This is a local display extension, not a native math.js plotting API. Twelve existing examples use it, retaining their numerical results. No additional package or network request is required. Plotting alone is therefore not a reason to introduce Python.

The next Python candidate should be a train/test comparison using a fitted estimator and preprocessing pipeline. Regression and the small PCA example already fit their parameters in math.js; both expose the arithmetic that the lesson teaches. A larger data-table workflow would provide a clearer reason to introduce Python than adding it just to repeat these calculations.

## Fit across the course

| Area | math.js fits | When Python would add value |
| --- | --- | --- |
| Numbers and linear algebra | Scalars, units, indexing, vectors, matrices, sums, transpose, transformations, small eigenvalue examples | Numerical decompositions on larger data; NumPy/SciPy workflows |
| Probability and calculus | Small probability tables, expected values, variance, symbolic derivatives, gradients of tiny functions, one optimization step | Simulation studies, many repeated trials, statistical libraries |
| Learning from data | One-feature regression, residuals, squared errors, standardization, hand-computable neighbor distances or tree predictions | Fitting trees/forests, train/test splits, cross-validation, preprocessing pipelines |
| Neural networks and representations | Neuron sums, activations, one forward/backward step, convolution, graph messages, probability losses, cosine similarity, fitting and projecting tiny PCA datasets | Larger PCA/clustering workflows using standard estimators; larger training loops |
| Language models | Tiny softmax/attention calculations, masks, probabilities, a small expert-weighted sum | Tokenizer experiments, dataset processing, more substantial CPU demonstrations |
| Reinforcement learning and control | A small value update or Bellman calculation with explicit numbers | Repeated environment rollouts and comparisons of learning curves |
| Computing hardware | Bits, array shapes, operation counts, floating-point examples | Not automatically useful; these are generally arithmetic or visual explanations |
| Mineral-resource applications | Unit conversions, grade/recovery calculations, small numerical models | Tabular preprocessing and fitted models on a small, included dataset |

Some concepts, such as leakage, licensing, or deployment practice, benefit more from a concrete scenario than a code box. Add a box only when changing an input reveals the concept.

## What was verified

The pinned math.js 15.2.0 bundle already provides matrix arithmetic, statistics, symbolic derivatives, eigenvectors, and FFTs. The regression example and a two-point PCA covariance/eigenvalue calculation were executed with the actual bundled library. PCA directions are not predictions or class labels; eigenvector signs are arbitrary, and the mean must be removed first.

The PCA playground now centers its input rows, computes population covariance and finds the leading eigenvector with the bundled solver. Points (-1,-1) and (1,1) give covariance [[1,1],[1,1]], with eigenvalues 0 and 2. Edited, shifted, constant, tied and three-dimensional datasets are covered by independent checks. math.js's eigenvalue documentation describes limitations of its numerical solver. A larger data-analysis workflow is a stronger case for NumPy/SciPy or scikit-learn than this tiny example.

Pyodide's package inventory includes NumPy, pandas, SciPy, and scikit-learn. scikit-learn offers fitted linear regression and PCA directly; PCA centers input, but does not standardize each feature automatically. Those capabilities make it useful for later applied lessons. Their existence does not make a Python runtime necessary for a two-variable calculation.

## Consequences of adding Pyodide later

- Load the pinned Python runtime and only the needed packages on entry to a Python lesson. Keep math-only lessons independent of that loading step.
- Use a worker so Python does not block navigation. Reusing an initialized worker is likely preferable to the current new-worker-per-edit approach; use a fresh execution namespace and stale-response guards for each run.
- Separate startup/package loading from the execution timeout. Do not impose the current 3.5-second math.js deadline on a first Python download.
- Preserve the same compact code/output box and Reset example control. Show Python documentation on Python lessons; an engine-selection toolbar is unnecessary.
- Decide how to host/cache the runtime and packages. The current math.js page is a single self-contained offline file; a CDN-loaded Python lesson would not share that guarantee on first use.
- Test cold loading, cancellation, offline failure, reset, mobile memory use, and worker isolation from account data before release. A worker is not by itself a security sandbox for arbitrary Python with JavaScript interop.

No Pyodide startup or memory benchmark was run for this change, so there is no measured download-time or mobile-performance claim.

## Regression pilot: what to review

The lesson now starts with observed pairs (1,6), (3,7), (5,14), in kilometres and dollars. It defines residuals and mean squared error locally, before the dedicated MSE lesson. A trial line with slope 2 and intercept 2 predicts (4,8,12); its residuals (2,-1,2) give MSE 3. The first code output exposes those predictions, residuals, and MSE together. Change the trial slope or intercept to see why different lines fit differently.

The second part computes the minimum-MSE slope and intercept with the one-input least-squares shortcut explained in the worked example. Hand check: means are 3 and 9; centered lists are (-2,0,2) and (-3,-2,5). Their dot product is 16 and the squared length of the first is 8. The rate is 2 dollars/km, and the start is 9 - 2 × 3 = 3 dollars. Residuals are (1,-2,1), with squared sum 6 and MSE 2 in squared dollars. This is better than the trial line, even though it misses individual fares. The lesson distinguishes a prediction with given coefficients from fitting those coefficients to data.

Change fares to [6,7,17]: the trial predictions stay (4,8,12), but residuals become (2,-1,5) and MSE becomes 10. The fitted rate becomes 2.75, start 1.75, and MSE 4.5. Reset restores trial MSE 3 and fitted MSE 2. Changing only the trial line does not change the optimum fitted to the same data.

The two data lists must have matching lengths and contain at least two different distances. Repeated distances are fine when others differ. If all distances are identical, the formula cannot identify a unique slope; the cell displays “Use at least two different distances.” instead of reporting NaN as fitted parameters. Mismatched list lengths produce math.js's shape error.

## Next small batches, without adding concepts

1. Review the 35 current boxes: the earlier 20 examples plus all 15 lessons from Backpropagation through Autoencoder, documented in PLAYGROUND_REVIEW.md.
2. Conditional probability/Bayes, normalization, and one gradient-descent update.
3. Neuron, sigmoid, ReLU, and forward pass, with explicit dimensions and numerical conventions.
4. A separate Python/Pyodide checkpoint for a train/test estimator and preprocessing example, only if the learner benefit justifies its loading and execution costs.

The 12-example mathematics batch uses the existing math.js engine. The SVD cell explores the diagonal matrix already taught: its singular values are absolute diagonal entries, and truncation retains the axis with the largest absolute stretch (one axis on a tie). It is not a general decomposition of a dense matrix. Eigenvectors use the library's actual eigs solver. Variance and covariance are calculated as explicit population averages so they agree with the lessons, rather than accidentally taking the library's default n-1 sample normalization. Monte Carlo uses seeded native random draws, and derivative combines finite differences with the native symbolic derivative. No additional runtime or UI controls are needed.

The 15-example neural-network batch also uses math.js. Small vectors make backpropagation, batch gradients, convolution windows, graph messages and reconstruction updates directly inspectable. The autoencoder now trains a 2-to-1-to-2 linear network on four inputs, repeats full-batch gradient updates, and tests a held-out input. It demonstrates learning one shared direction, rather than claiming general-purpose feature discovery. Its encoder and decoder gradients are computed from the same old weights and checked against numerical finite differences. The self-supervised example calls its mean prediction an untrained baseline. Probability losses handle zero terms explicitly, and softmax subtracts the largest score for stability. These calculations fit the existing worker and compact code/output interface without new dependencies.

## Primary references

- [math.js function reference](https://mathjs.org/docs/reference/functions.html)
- [math.js variance normalization](https://mathjs.org/docs/reference/functions/variance.html)
- [math.js random integer bounds](https://mathjs.org/docs/reference/functions/randomInt.html)
- [math.js symbolic derivatives](https://mathjs.org/docs/reference/functions/derivative.html)
- [math.js eigenvalue implementation and limitations](https://mathjs.org/docs/reference/functions/eigs.html)
- [Packages available in Pyodide](https://pyodide.org/en/stable/usage/packages-in-pyodide.html)
- [Loading packages in Pyodide](https://pyodide.org/en/stable/usage/loading-packages.html)
- [Pyodide worker execution](https://pyodide.org/en/stable/usage/webworker.html)
- [scikit-learn LinearRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LinearRegression.html)
- [scikit-learn PCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html)
