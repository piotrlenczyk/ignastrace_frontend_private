# 0003 — Tailwind class linting returns, and class merging is taught the project's own tokens

**Status:** Accepted — August 2026. Closes the tooling gap recorded by the Tailwind v3 → v4 migration.

## Context

The v4 migration removed the Tailwind ESLint plugin rather than upgrade it, because that plugin
cannot parse v4 and would have errored on every custom class in the codebase. Three rules went with
it: typo detection in utility names, canonical class ordering, and shorthand enforcement. The
migration notes recorded the loss as temporary and accepted, and asked for it to be revisited. This
is that revisit.

The practical cost of having no class linter is that a misspelled utility fails silently. It does
not error, it does not warn, it simply compiles to nothing and the element renders unstyled. There
is no signal in the editor, in CI, or at build time — only, eventually, a screen that looks wrong.
The audit that opened this work found three such defects sitting in the tree: a missing space that
had fused a size utility to its own breakpoint variant, a class that named a CSS keyword rather than
the utility that sets it, and a colour on the false branch of a ternary that had never existed. Two
of the three were invisible even to a class-aware linter, because they sat inside expressions no
linter can statically read.

Separately, the shared class-merging helper — the single entry point this codebase uses for
combining class names, and the one the component library's generator is pointed at — wrapped an
unconfigured merge instance. A merge instance knows the utilities the framework ships. It does not
know utilities this project invents, whether those come from theme tokens or from hand-written
utility definitions. Where it cannot classify two classes, it cannot see them as conflicting, so it
emits both and lets stylesheet order decide the winner. That is precisely the opposite of what the
helper exists to guarantee: that the caller's override wins over a component's default.

The merge library was also a major version behind, still modelling the framework's previous major.

## Decision

Adopt a class linter that parses the current major of the framework, and configure the existing
class-merging helper with the class groups this project defines for itself.

The helper keeps its module, its export name and its import path; only its internals change.
Everything that imports it, and the component generator's alias, are untouched.

The linter is pointed at the stylesheet entry point rather than at a configuration file, because
this project is CSS-first and has no configuration file to point at. Enforced: canonical class
ordering, line wrapping at the same width as the general line-length rule, duplicate classes,
directly conflicting classes, and unregistered classes. The generated component directory stays
outside linting.

Where classes were being combined outside the helper — by template interpolation, by a second
joining library reached through a transitive dependency, or by a conditional assigned to a variable
before reaching the attribute — those sites now go through the helper. That is partly for
consistency and mainly for visibility: a class string assembled in a form the linter cannot read is
a class string the linter cannot check.

## Alternatives considered

**Enumerate every semantic colour token in the merge configuration.** This was the original plan and
it was dropped on measurement. The merge library's current major already treats any unrecognised
name in a colour position as a theme colour, so the project's colour tokens — and the hand-written
colour utilities alongside them — already resolve correctly without being listed. Enumerating them
would have produced roughly a hundred lines of configuration whose presence and whose absence are
behaviourally identical for every class that actually exists. The one case where they differ is a
misspelled token, which an explicit list would decline to merge and the catch-all merges anyway —
and that case is already caught, as an error, by the unregistered-class rule adopted in the same
change. So the list buys nothing that is not bought elsewhere, and it cannot be tested, meaning it
would drift from the stylesheet with nothing able to detect the drift while reading as load-bearing.
This is the same argument the change already accepts for the framework's built-in palette. What
is registered instead is the set of declarations that demonstrably change behaviour — the one custom
font size, and the hand-written utilities that form mutually exclusive sets over a single CSS
property. Every one of those is pinned by a test that fails if the registration is removed.

**Derive the registration from the stylesheet at build time.** The repository has precedent for
generating artefacts from token definitions, so this was a real option. Rejected because the list
that survived the previous decision is short enough to read at a glance, and generation would add a
build step and an indirection to maintain in exchange for removing about a dozen lines.

**Group the hand-written non-utility classes by prefix in the linter's ignore list.** The page
structure, component hook and heading classes this project defines by hand are not framework
utilities and never will be, so the linter has to be told about them. Prefix patterns would have
been shorter. Rejected because a prefix pattern waves through misspellings within its own family,
and catching misspellings is the entire reason the rule is being adopted. The classes are listed
exactly.

**Let the wrapping rule use its own default.** Its default breaks a class list onto one line per
variant regardless of how long the line is, which rewrote every short static class attribute in the
codebase — a large diff buying nothing. Configured instead to keep a class list on one line until it
would breach the project's line-length limit, so the rule that wraps the line and the rule that
measures it agree.

**Bring the generated component directory into linting.** Measured before deciding: it adds several
hundred failures, mostly long-line violations on generated icon files whose contents are overwritten
by the generation script, so any fix would be discarded on the next run. Linting the directory while
excluding the generated icons was also considered and set aside — whether generated components are
project code is a separate decision, and answering it inside this change would blur both.

**Take the newest release of the linter plugin.** Its current major declares an optional peer on a
second linting toolchain, which the package manager resolves into a conflicting version of the test
runner. Resolving that conflict by relaxing peer resolution drops a package the test suite needs.
The newest release that predates that peer is used instead; it carries every rule this decision
relies on.

## Consequences

- A misspelled utility is now an error in the editor and in CI, at the moment it is typed.
- Class attributes have a canonical order and a consistent wrapping, so a diff that touches one
  reflects a change in behaviour rather than a change in habit. Ordering within an attribute does not
  affect rendering — the cascade is decided by the compiled stylesheet — so the sorting pass is safe
  by construction.
- An override passed to a component now displaces the component's default for the registered groups,
  where previously both survived. This is the one part of the change that can alter what renders, and
  it is where review and visual verification should concentrate.
- The pointer at the stylesheet entry point is a single point of failure. If it stops resolving, the
  unregistered-class rule does not fail — it goes quiet. Anyone moving or renaming that entry point
  has to update it. A test guarding this was considered and declined, to keep the change to one seam.
- The list of hand-written non-utility classes is maintained by hand. A class deleted from the
  stylesheets should be deleted from the list too; nothing enforces that.
- The wrapping rule and the JSX formatting rules can disagree, because wrapping a class attribute can
  turn a single-line element into a multi-line one and bring a second set of rules into play. It
  happened in two files and was resolved by hand. It will happen again.
- The pre-existing lint backlog came out four errors *smaller* rather than unchanged. This change set
  out not to touch it, and did not: the four are long-line and quote-style violations that the
  wrapping rule resolved as a by-product, which it cannot avoid doing, since shortening over-long
  lines is the rule's purpose. Nothing was fixed deliberately and nothing else in the backlog moved.
- One rewrite is only conditionally equivalent. Replacing the framework's deprecated bare corner
  radius with the named step from this project's scale renders identically at the default root font
  size, where both resolve to the same number of pixels, but the two are expressed in different units
  and would diverge if that root size were ever changed. Nothing in the project changes it today.

## What was found and deliberately not acted on

Eleven classes are defined in the stylesheets with no reference anywhere in the sources. That is four
more than the count this work was commissioned with; the two audits were run by different methods and
the discrepancy was not chased, since the outcome — record, do not delete — is the same either way.
Nine look
like ordinary leftovers: two wide container variants, an anchor helper, a login button, a full
progress-bar step, an animated-border reset, and a three-class carousel set. The remaining two form a
single rule targeting markup injected by the payment provider's SDK, where absence from this
repository's sources is not evidence of disuse.

They are recorded rather than removed. Deleting them is a stylesheet change with its own risk, and
grep-based absence is not proof — a class can reach the document through injected or externally
authored HTML. One of the hand-written column utilities also sets a value that disagrees with its own
name; that is a bug in the stylesheet, not in this tooling, and is left for a change that can verify
the visual result.

## What would make this worth revisiting

- The linter plugin's newer majors becoming installable without dragging in a conflicting toolchain,
  at which point the pin should be lifted.
- The merge library narrowing its catch-all handling of unrecognised colour names. That would make an
  explicit token list load-bearing, and the decision above would flip.
- The hand-written non-utility classes being expressed as real utilities, which would let the linter
  resolve them from the stylesheet and retire the maintained list entirely.
- A formatter taking ownership of class ordering. The linter owns it today precisely so that only one
  tool does; introducing a second would need the two reconciled, not merely both enabled.
