# Clearer worked steps and concept navigation

20 September 2026. This pass responds to learner feedback on SVD, Lagrange multipliers, data leakage, and gradient boosting.

- SVD first shows horizontal and vertical arrows under a diagonal matrix, then shows exactly which coordinate is lost by retaining one direction. Questions focus on scales and retained information; the eigenvalue comparison and recalling V are replaced with basic applications.
- Lagrange uses f(x,y) and g(x,y) consistently, labels their distinct roles, evaluates one input pair, constructs the Lagrangian, and works through each derivative equation. Inequality-constraint trivia is replaced with identifying the equality rule.
- Data leakage explicitly labels the faulty split, explains the inflated score, and gives a corrected split before windowing and preprocessing. Its first question uses a fresh held-out-well scenario.
- Gradient boosting follows one target through the residual, a learned correction, the scaled update, and the remaining error.

All ten questions for each changed example were checked again for copied worked answers and untaught prerequisites. Existing question IDs, correct-answer positions, lesson order and course version are retained; prior practice credit is not revoked. No account data or database changes are involved.

The concept picker enhances the existing native select with a select-only combobox. Opening centers the current option; mouse, touch, arrow keys, Home/End, PageUp/PageDown, type-ahead, Enter/Space, Tab and Escape are supported. Native selection remains available if the enhancement is absent. It retains chapter groups, lesson numbers and completion checks.

Themed learning stories and manual revisit/done markers are proposals only and are not implemented in this pass.

Final question review: the SVD task now asks about retaining a different direction and preserving a task that uses it, rather than repeating the example’s lost-information conclusion. The multiplier-sign exercise uses a new positive solution, instead of asking whether the negative multiplier already shown is possible.

Follow-up: personal revisit bookmarks are now implemented. See LEARNING_CHOICES_TESTING.md for scope, the additive account migration, and release tests.

Preview feedback: removed Done for now and its Review filter. Revisit later remains a single reversible bookmark. Older preview completion markers display as unmarked; their saved revisions remain readable so bookmark syncing can continue.

Later preview feedback: the domain selector and mineral-exploration story were removed. Each lesson again shows only its regular worked example; the Revisit later bookmark remains.
