# 0004 — The design-token export meets Tailwind's theme at the semantic boundary

**Status:** Accepted — August 2026. The decision stands; one of the consequences below does
not. Record 0005 answers the question this one parks about joining the import chain, and
corrects the claim that intent tokens exist as runtime custom properties — they do so only
in the emission form 0005 adopts, not in the one described here.

## Context

The design file is exported to JSON and a generator turns that JSON into stylesheets. The
export arrives in layers that the design system already distinguishes: a palette of roughly
two hundred raw colours, an intent layer of about the same size whose values are mostly the
_names_ of palette entries rather than colours, and twenty-six named text styles that
reference a scale of loose typographic variables. The layering is the point of the system —
a component is meant to ask for the foreground colour of a brand element, not for a
particular green.

Until now the generator wrote all of this into plain root blocks. That made every token a
runtime custom property and none of them a utility class: Tailwind v4 decides what
utilities exist from the theme block, and a custom property is invisible to it no matter
what the property is called. Naming a token in the colour namespace without putting it in
the theme generates nothing at all, which is a quiet failure — the property resolves, the
class does not exist, and the markup silently renders unstyled.

So the export has to decide which layers cross into the theme. The decision is hard to
walk back because it determines the vocabulary of class names that markup will be written
against, and because the two colour layers overlap in meaning: putting both in means every
intent token has a palette-level synonym, and any component may be written against either.

Text styles raise the same question in a different shape. The framework's font-size
namespace accepts a token plus modifiers for line height, letter spacing and weight — but
there is no family modifier among them. A text style in the design file has five axes and
the namespace has room for four, so either the family travels separately or text styles
stop being single tokens.

## Decision

The intent layer and the text styles enter the theme. The palette does not.

Concretely: intent tokens are emitted into the theme's colour namespace, so each one
becomes a set of colour utilities. The palette stays in a plain root block, keeping its
bare names, so it remains readable as custom properties and generates no utilities at all.
Because the two layers now live in different namespaces, an intent token that aliases
another intent token has to name it with the colour prefix, while one that aliases the
palette names it bare — the generator branches on which side of the line the target sits.

Text styles are emitted as single font-size tokens carrying line height, weight and
letter-spacing modifiers, so one class applies a whole style and any single axis can still
be overridden alongside it. Letter spacing is omitted where the design file says zero. The
underlying typographic scale is resolved into literal values rather than emitted, and the
font families are emitted separately into the family namespace, so a text style is applied
as two classes: the family and the style.

Family tokens point at the custom property the font loader exposes, not at the family name
the design file records. The loader registers the face under a generated name, so the
design name would miss it and fall through to whatever copy the reader happens to have
installed.

These theme blocks are declared in the ordinary, non-inline form. Neither of the two
reasons the older hand-written theme is inline applies here: none of these token names
collide with a property the font loader injects, and no hand-written rule reads their
underlying values.

This record covers what the generator emits. Whether these stylesheets join the
application's import chain, and how their names reconcile with the older theme's, is a
separate decision — the older theme clears the colour namespace before repopulating it, so
the answer depends on ordering and on a name-by-name comparison that has not been done.

## Alternatives considered

**Put the whole export in the theme, palette included.** The cheapest option by far: one
rule in the generator, no branch when resolving aliases, every token uniformly prefixed.
Rejected because it makes the palette addressable from markup, and a palette that is
addressable will be addressed. The intent layer's only enforcement mechanism is that the
alternative does not exist; give a component author both a brand-foreground token and the
green behind it and the choice gets made on whichever name they remember. The layering
would survive as documentation and erode in practice.

**Leave the generator alone and maintain a hand-written bridge that lifts chosen tokens
into the theme.** Attractive because it makes exposure explicit and per-token, which is
stricter than exposing the whole intent layer. Rejected because the bridge is a third place
the token names are written down, updated by hand after every re-export, with nothing
detecting that a renamed token has silently stopped being exposed. It buys curation at the
cost of drift, and curation is available more cheaply by not naming a token in the design
file in the first place.

**Emit text styles as ready-made utility classes rather than tokens.** The generated CSS
reads more plainly — each style is a rule with four declarations, no namespace conventions
to know. Rejected because a class that sets every axis cannot have one axis overridden
beside it; the result depends on rule order rather than on what the markup says. Tokens
keep the composition that makes a design system usable at the edges, where a heading is the
standard style with tighter leading.

**Also expose the typographic scale as single-axis tokens.** This would add a class per
font size, line height and weight on top of the twenty-six styles. Rejected as an
invitation to assemble combinations the design file does not contain: the value of shipping
named styles is that the set is closed. Resolving the scale into literals also means the
generated file can be read straight through, rather than by chasing a reference into a
second block.

## Consequences

- The palette cannot be reached from markup. Using a colour requires it to have been given
  a name in the intent layer first, which pushes the naming work back into the design file
  where it belongs — and blocks anyone in a hurry.
- Intent tokens exist as runtime custom properties, because the theme is not inline. Rules
  that cannot be expressed as utilities can refer to a colour by its intent name, which the
  older theme's tokens do not allow.
- A text style needs two classes, and the second one is easy to forget. Forgetting it is
  not visible as an error: the text inherits whatever family is in scope, which today is
  the same face, so the omission only surfaces when a second face is introduced.
- The family tokens encode knowledge of how the application loads fonts. This is the one
  place the export stops being a pure mirror of the design file, and it depends on a
  mapping from design font names to loader properties that has to be extended by hand when
  a face is added. An unmapped face falls back to its plain name with a warning rather than
  failing.
- The framework's own font-size scale is untouched, so its default size classes coexist
  with the generated styles. Two vocabularies for the same idea are available; which one
  wins is currently no one's decision.
- The generated text styles are in rem while the design file is in pixels. Every current
  value converts exactly, so this costs nothing today, but a half-pixel size in the design
  file would round.

## What would make this worth revisiting

- The font-size namespace gaining a family modifier, which would collapse the two-class
  application into one and remove the most error-prone consequence above.
- A second typeface entering the design system. The family mapping stops being a formality
  at that point, and the silent-inheritance failure mode starts to bite.
- A runtime theme switch such as a dark mode. The intent layer would then need to be
  reassigned rather than resolved once, which changes whether the theme can stay
  non-inline.
- The palette acquiring a legitimate consumer in markup — a chart or an illustration that
  genuinely needs a scale rather than an intent. That is an argument for exposing the
  palette under a separate namespace, not for dissolving the boundary, and it should
  supersede this record rather than amend it.
