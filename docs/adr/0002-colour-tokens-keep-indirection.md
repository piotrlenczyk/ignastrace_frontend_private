# 0002 — Colour tokens keep their custom-property indirection instead of being flattened

**Status:** Accepted — Tailwind v3 → v4 migration, August 2026.

## Context

The palette is not stored as colours. It is stored as a little over a hundred custom
properties in a single root block, each holding bare HSL _channels_ — hue, saturation,
lightness and, for the translucent variants, an alpha — with no colour function wrapped
around them. The theme then names each Tailwind colour as an HSL function applied to one
of those properties. So a utility does not carry a colour value; it carries a reference to
a channel triple that resolves at use.

This arrangement predates the migration. It came over from the v3 configuration
essentially unchanged, and moving the theme from JavaScript into CSS was a natural moment
to ask whether it should survive. Under v4 the theme is written in the stylesheet, right
next to the root block it points at, and the indirection now looks like a pointless hop:
two declarations to express one colour, in the same file, in a language that would happily
take the literal. Flattening was seriously considered.

It survives because the channel properties have a second consumer. Hand-written CSS — the
component and utility layers this project maintains by hand, alongside Tailwind's
generated output — reads those channel properties directly at fifteen sites, across eleven
distinct tokens, applying its own colour functions to them. Those rules exist because they
do things the utility vocabulary cannot express: conic gradients, layered shadows,
composite borders. They are not going away, and they cannot be written in terms of a
flattened theme, because a flattened theme would have thrown away the channels they
consume.

So flattening does not remove the indirection. It removes it from _one_ of the two places
that use it, and leaves the root block standing for the other. The palette would then be
stated twice — literal colours in the theme, channel triples in the root block — with
nothing connecting them and nothing detecting drift. Editing one and not the other is a
silent divergence between a utility and the hand-written rule beside it, which is the
single most tedious class of styling bug to track down.

There is a second, independent reason the theme is written in the inline form, and it is
worth recording because it is the sort of thing that gets "cleaned up" by someone who does
not know it. When a theme token is given the same name as a custom property that the font
loader injects onto the document element — which is exactly what happens for the display
face — the non-inline form emits a self-referential declaration for it. The loader's
definition wins the cascade, and the carefully specified fallback stack behind the webfont
is silently discarded. Measured in a browser: the non-inline form yields the loader's two
families and nothing else, while the inline form preserves the full stack. Where the names
happen to differ this does not bite, which is what makes it a trap rather than a bug — it
breaks one font and not the other.

## Decision

Colour tokens keep their custom-property indirection. The theme names colours by pointing
at the channel properties; the root block remains the single place any palette value is
written down. The theme is declared in the inline form, so utilities carry the reference
rather than an alias to it.

## Alternatives considered

**Flatten the palette to literal colour values in the theme.** Rejected on the argument
above: it does not eliminate the indirection, it duplicates the palette. The apparent
simplification is a fork.

**Flatten, and rewrite the hand-written rules to stop reading channels.** This would make
flattening honest — one home for the palette, literal values, no root block. Rejected as
disproportionate. It means reworking every hand-written rule that composes a colour, each
of which exists precisely because it is doing something a utility cannot, during a
migration whose entire premise is visual parity. It also trades a working arrangement for
one whose benefit is aesthetic.

**Put colours in a separate non-inline theme block, keeping only the fonts inline.** The
mixed form was tried and does compile, with identical utility coverage, so the font
requirement does not by itself dictate how colours are declared. Rejected anyway: it emits
seventy-odd alias properties whose only job is to forward to the channel properties, and
it creates two equally valid ways to name a colour in hand-written CSS — through the alias
or through the channel — with no principle for choosing. That is the same fork the
decision is trying to avoid, arriving by a different route. Keeping one theme block in one
form also means "the theme is inline" is a single fact to know, rather than a
per-namespace split whose reason is invisible at the call site.

## Consequences

- The palette has exactly one home. A colour changes in one place and both the utilities
  and the hand-written rules follow.
- Because the theme is inline, its tokens are **not** emitted as custom properties at
  runtime. Hand-written CSS cannot refer to a colour by its Tailwind name; it must read
  the underlying channel property, as the existing rules do. This surprises people, and
  the failure is an unresolved reference rather than an error.
- Every colour is two hops to read: find the utility's token, then find that token's
  channels. Navigating the palette is slower than it would be with literals.
- Utilities in the compiled output name the palette token they resolve to rather than an
  opaque alias, which makes compiled-CSS diffing legible as a review tool.
- The channel-triple storage form means a colour is only usable through a colour function.
  Anything consuming the palette has to know that.

## What would make this worth revisiting

- The hand-written rules that read channel properties disappearing — absorbed into
  components, or expressible in the utility vocabulary as it grows. With that consumer
  gone, flattening becomes a genuine simplification rather than a duplication, and this
  record should be superseded.
- Adopting a runtime theme switch, such as a dark mode that reassigns the palette on the
  fly. That makes the indirection load-bearing in a second way and settles the question in
  the other direction; today nothing overrides the root block, so that argument is not
  available.
- Tailwind gaining a first-class way to expose theme tokens to hand-written CSS without
  the alias layer, which would remove the main cost recorded above.
- The font trap being fixed upstream, or the display face being renamed so no collision
  exists. That releases the independent constraint on the inline form, though not the
  reasoning about colours.
