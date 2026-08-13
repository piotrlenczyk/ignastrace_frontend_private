# 0006 — Lint follows the framework; a formatter owns formatting

**Status:** Accepted — August 2026.

## Context

The lint configuration this project inherited was a single third-party opinion bundle that
owned formatting, TypeScript rules, React rules and stylistic rules simultaneously. Its
rules carried short namespaced names that exist nowhere else in the ecosystem, so a
developer meeting one of them could not look it up in any framework's documentation — only
in that one author's config. Alongside it sat a second linter for stylesheets, and a
formatter that was configured but never actually run, because autofix did the formatting.

None of that was working. The baseline was two hundred and seventy errors and had never
been green, which makes every rule in it advisory in practice: a lint run that always
fails cannot fail _more_.

Two things in that setup were load-bearing and unrelated to the rest. Record 0003 put the
Tailwind class linter in place and record 0005 built a ratchet on top of it that stops a
route already rebuilt against the new design from reaching for a token that is on its way
out. Both live inside the bundle's configuration but owe it nothing.

The framework the application is built on ships its own supported lint configuration,
covering the framework's rules, React, hooks and accessibility, and re-exporting the
TypeScript ruleset everyone else uses under the names everyone else uses.

## Decision

The opinion bundle goes. The framework's own configuration replaces it, in the combination
that pairs the framework's recommended rules with the TypeScript ruleset. Prettier becomes
the formatter, in a dotfile rather than a package manifest key, and formats stylesheets
too — so the stylesheet linter goes with the bundle rather than being replaced.

The Tailwind class linter stays and moves to its current major. Its class allowlist, its
stylesheet entry point, its ratchet and the function that derives the retiring class
patterns carry over with their meaning intact and with the prose explaining each of them
unchanged. Where the plugin renamed a rule, the new spelling is adopted; where it added
rules that would rewrite how the codebase is written, they stay off.

ESLint stays one major behind the current release, because the accessibility plugin the
framework config depends on declares no support for the newer one and installing it would
need a peer-dependency override. TypeScript stays one major behind for the same shape of
reason: the TypeScript ruleset the framework config depends on refuses the newer compiler.
Both are followed rather than overridden — a version this project cannot fully install is
not a version it is on.

Type-aware linting stays off. It would open a large backlog across the whole tree and slow
every run, and neither is a good trade for a codebase about to be rewritten route by
route.

**The bar for this change is zero errors. Warnings are permitted.** With no gate in
continuous integration, a pre-commit hook running the formatter and autofix over staged
files only is the compensating control.

### Rules deliberately not at error

A rule demoted rather than satisfied is named here, with its reason. That is the whole
point of writing them down: a severity that drifts quietly is indistinguishable from a
rule nobody chose.

**Explicit `any`, demoted to a warning.** Fifty-nine sites, every one of them inherited.
Typing them properly is a typing project with its own review — several are public
component props, and giving them real types changes what callers may pass. Doing it inside
a toolchain migration would bury a behavioural change in a diff nobody can read. Demoting
rather than adding fifty-nine disable directives keeps the count visible and countable.

**The hooks plugin's three compiler analyses — purity, state set inside an effect, and
components declared inside components — demoted to warnings.** These arrived with the
plugin's new major and each finding is real. But every fix is a change to how a component
behaves, the compiler that makes them matter is deliberately not switched on here, and
the routes they sit in are scheduled to be rebuilt. They are advice on this codebase, not
a gate.

The plugin's rule against calling hooks outside a component is **not** demoted. It reported
thirty-four call sites, all tracing to three plain server-side functions wearing a `use`
prefix while touching no React API. They were renamed. That is a rule doing its job.

**The Tailwind plugin's four new rules stay off.** One of them rewrites every physical
margin and padding utility in the codebase to its logical equivalent; two more rewrite
class names and variant order. Each is a change to how the codebase is written, which is a
decision for whoever wants that change — not a side effect of moving a config file.

**Consistent type definitions is off in the two files that augment a module.** Only
interfaces merge across declarations, so a type alias there is a duplicate identifier
rather than a style choice. It is stated as a scoped override rather than an inline
directive because the rule's own fixer rewrites the declaration and drops the directive in
the same pass.

**The Tailwind class rules are off in test files.** A class list inside a test is a
fixture. The class-order fixer will happily reorder the input of a test that asserts what
the class merger does with a particular order — turning a passing assertion into a failing
one, or worse, into a meaningless one that still passes.

## Consequences

Every rule a developer meets now has documentation they can find. Formatting is done by
the tool every JavaScript project has, in an editor, on save, rather than by a linter's
autofix. The formatter's line width matches the width configured for wrapping Tailwind
class attributes, so the two do not take turns undoing each other; they were run
alternately until both stopped changing anything.

Both generators — design tokens and icons — now write through the formatter, so
regenerating either never produces a diff made entirely of whitespace. The icon generator
bundles a formatter of its own with different defaults; that one is switched off in favour
of the project's.

**Hand-written stylesheets lose their linter.** This is the real cost of the change and it
is accepted, not overlooked. The formatter will keep them consistently formatted and will
refuse to parse a file that is syntactically broken, but nothing now catches an unknown
property, a duplicate selector or a specificity mistake. No replacement is introduced. If
that turns out to matter, it is a new decision with a new record.

**The ratchet gets a test.** Record 0003 warns that this machinery fails quietly rather
than loudly — if the stylesheet entry point stops resolving, or a rule stops being
attached, the rules report nothing and everything looks green. A configuration rewrite is
exactly the occasion for that to happen unnoticed, so the ratchet is now exercised by
running the linter over a fixture and reading what it reports: a retiring colour and a
retiring text size are reported inside a rebuilt path, variants and modifiers and the
important marker do not slip past the anchors, the new intent tokens are not reported, and
a file outside a rebuilt path is left alone. Testing the pattern-building function
directly was considered and rejected — it would pass while the rule sat disconnected,
which is the failure being guarded against.
