# 0005 — Two colour systems ship side by side for the length of the redesign

**Status:** Accepted — August 2026.

## Context

Record 0004 settled what the design-token export emits and then deliberately stopped
short: whether those stylesheets join the application's import chain, and how their names
reconcile with the older theme's, was left open, because the older theme clears the colour
namespace before repopulating it and the answer depended on an ordering question and a
name-by-name comparison nobody had done. This record does that comparison and answers the
question.

The comparison is the surprise. The older theme names a hundred and fourteen colours; the
export names a hundred and ninety-seven. The two sets have **no name in common at all**.
The old vocabulary is bare — a colour is asked for by what it is or by a loose role. The
new one is prefixed by the role the design system assigns it, so what would collide is
always separated by a leading segment naming the surface. Nothing overrides anything.

That fact removes the problem everyone expects here and replaces it with a different one.
There is no clash to resolve, so both systems can be present at once and every existing
page keeps rendering exactly as it did. But by the same token there is no switch to build
either: no flag can flip an application between two vocabularies that share no names,
because the markup naming one of them simply does not name the other. Anything that looks
like a theme toggle would have to be an aliasing layer underneath, and that is a different
decision with a different cost.

The work these tokens are for is a redesign rather than a recolouring. Pages are being
rebuilt against new design-file layouts one at a time, not repainted in place, and the old
system is to be gone before any of this reaches production. So the transition is long,
entirely pre-release, and ends in a deletion rather than in a steady state.

## Decision

Both colour systems ship, from the same stylesheet, for the whole redesign. There is no
switch, no aliasing in either direction, and no shared vocabulary.

The generated export joins the import chain **after** the older theme. This ordering is
load-bearing rather than cosmetic: the older theme opens by clearing the colour namespace
in order to keep the framework's default palette out, and anything declared above that
line is erased by it. The erasure is silent in the worst way — the custom properties still
resolve, the utility classes simply never come into existence, and the markup renders
unstyled with nothing reported anywhere.

The old vocabulary is frozen. Nothing is added to it, redesigned pages are written
entirely in the new one, and when the last page lands the old system is deleted whole.

Three things follow from wanting that deletion to be safe rather than careful.

The old theme is **split in two** ahead of time. What everyone calls "the old theme" was
never only colours: the same block also carried the breakpoints, the radius scale, the
animations, and the namespace resets that keep the framework's defaults suppressed. Those
outlive the palette. Separating them now turns the final step into removing one file
whose entire contents are known to be disposable, instead of correctly identifying six
blocks inside a long file under the impression that the job is a cleanup. The reset lines
are the dangerous ones: removing them does not merely drop the old palette, it restores
the framework's own, and out-of-system colour names silently begin to render.

Deletion is gated by **tooling rather than vigilance**, and the gates already existed. The
class linter resolves the set of legal classes from the stylesheet itself, so the moment
the old theme is deleted every surviving old class becomes an unregistered one and cannot
be merged. The compiler does the same job for components: deleting the old shared
components turns every remaining import of them into a type error. Neither gate had to be
built, and neither can be forgotten.

Between now and then, a **restriction list** stops redesigned areas from regressing. It is
scoped to directories that have already been rebuilt, because everywhere else the old
names are still the only ones the page is written in and a global restriction would be a
backlog rather than a signal. Its contents are read out of the stylesheet rather than
restated in the linter's configuration — a list of that size, maintained by hand in a
second place, drifts silently, which is the same objection record 0004 raised when it
turned down a hand-maintained token bridge.

Finally, the export is emitted so that **every** token reaches the document, not only those
some class already uses. See the correction below for why that is not the default.

## Alternatives considered

**Alias the new palette onto the old names.** Keep the old vocabulary as the application's
own, and give each of its names a new-system value. Markup is untouched and the whole
application changes appearance at once, which is by far the most satisfying option to
demonstrate. Rejected because it inverts the point of the exercise: the new system's
distinctions are finer than the old one's, so mapping onto the coarser set discards them,
and the tokens that carry them stay permanently unreachable. The mapping is also a hundred
and fourteen judgement calls made once and then relied on forever, several of them
genuinely ambiguous — the two systems use several of the same words for different ideas,
and the most-used name in the old vocabulary means a brand colour there and ordinary body
text in the new one. Nothing about the resulting appearance would reveal such a mistake as
a mistake.

**Alias in the other direction: rewrite the markup onto the new names, and define those
names in terms of old values to keep the old appearance available.** More honest, since
the scaffolding is the part that gets deleted rather than the part that survives, and it
would have produced a genuine before-and-after comparison. Rejected because it only pays
off if the pages are otherwise unchanged, and they are not — they are being rebuilt.
Substituting tokens in markup that is about to be replaced is work performed on its way to
the bin.

**A real runtime switch, with both systems reachable under one vocabulary.** Rejected as
solving a problem nobody has. A switch earns its keep when both states are wanted at once
— two brands, a dark mode, a per-user preference. Here the old state is wanted only until
it is finished with, and nothing is released while both exist, so the switch would be built
and deleted without ever being used in anger.

**Deleting the old system in one pass instead.** Briefly attractive because the transition
period is the expensive part. Not viable at this size: it is every page of the application
at once, with no intermediate state that runs.

## Consequences

- The application is visibly mixed for the whole transition, and no mechanism exists to
  make it otherwise. This is affordable only because nothing is released until the last
  page lands. Should that stop being true, this record's central assumption goes with it.
- The compiled stylesheet carries both palettes — a temporary cost of roughly the same
  order as the export itself, in a build that is never released in this state.
- Shared components keep the old palette until they are rebuilt in their own right, so a
  redesigned page can render an old-palette control inside new-palette surroundings. The
  restriction is per file and says nothing about what a file imports, which is deliberate:
  the alternative is blocking page work behind component work.
- The type scale has no automatic gate. Four of the five retiring size names are also
  framework defaults, so deleting the old theme does not make them unregistered — the
  framework quietly supplies them again and the only symptom is that line height shifts on
  a hundred call sites. They are guarded by the restriction list during the transition and
  by clearing the size namespace at the end, and that clearing is the one step of the final
  sweep with no tooling behind it.
- The radius scale could not be handled this way. It is the single namespace where the two
  systems use the same names for different values, so coexistence was not available and the
  values were simply swapped. Pages not yet redesigned changed with it.
- One family name is not a design token at all but the document's default, which the
  framework's preflight resolves through. It stays with the surviving half of the theme
  precisely because that dependency is invisible: the whole application would otherwise
  fall off its typeface, at deletion time, with nothing reported.

### A correction to record 0004

Record 0004 states, among its consequences, that intent tokens exist as runtime custom
properties because their theme block is not written in the inline form, and that rules
which cannot be expressed as utilities may therefore refer to a colour by its intent name.
That is not true as written, and the error is worth recording because the behaviour is
invisible until relied upon.

A theme variable only reaches the document if some utility built from it survives the
source scan. A token no markup has used as a class yet is not merely unused — it does not
exist at runtime, cannot be inspected, and cannot be referenced. During a redesign this is
exactly backwards: the tokens are least used at the moment they most need to be legible.
The export is therefore emitted in the form that declares every token unconditionally,
which costs a few kilobytes before compression and makes 0004's stated consequence
actually hold. The decision 0004 records is unaffected; only that consequence was wrong.

## What would make this worth revisiting

- A second brand, or a dark mode. Either turns the coexistence machinery into something
  that has to become a real switch, and a switch needs a shared vocabulary — which is the
  one thing this arrangement deliberately does without.
- Intermediate states having to ship. Everything here rests on the transition being
  invisible to users; if it stops being, the mixed appearance becomes a product problem and
  the old system needs to survive per-page rather than globally.
- The redesign turning out to be a recolouring for some part of the application. Routes
  that keep their layout have nothing to rebuild against, and for those the mapping table
  rejected above stops being a liability and becomes the missing artifact.
- The transition outlasting the assumption that it ends. A frozen vocabulary that is still
  frozen a year from now is not a migration in progress, and at that point the honest move
  is to alias after all rather than keep two systems alive by inertia.
