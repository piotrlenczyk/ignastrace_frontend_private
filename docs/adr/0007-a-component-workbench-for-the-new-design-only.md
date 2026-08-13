# 0007 — A component workbench, catalogued for the new design only

**Status:** Accepted — August 2026.

## Context

The redesign builds a second component vocabulary next to the inherited one: new colour
intent tokens, a named type scale, and components modelled on the design file's own
variant properties rather than on whatever the screens happened to need. Until a screen is
rebuilt, none of that is visible anywhere except inside the screens already rebuilt — the
button's six hierarchies exist because the component set defines them, but only three of
them appear on any page, and a token nobody has used yet is a line in a generated
stylesheet.

That has two costs. A designer cannot check an implemented variant against the file
without a route that happens to use it, and an implementer reaching for a colour has to
read a generated stylesheet to find out what exists. Both are the ordinary case for a
design system without a catalogue.

The inherited components are a different matter. They are frozen, they are deleted with
the old theme, and every one of them is scheduled to be replaced.

## Decision

A component workbench is added, and it catalogues the new design only. Nothing frozen gets
a story: a catalogue entry for a component with a scheduled deletion date is work that
gets thrown away twice, once when the component is rebuilt and once when the entry is
removed.

Its builder is the one already in the repository for the test runner, not the workbench's
default. Two bundlers with two module resolutions and two stylesheet pipelines for one
codebase is a maintenance surface that buys nothing here — the framework integration is
supported on both.

The stylesheet the workbench loads is the application's own, unmodified, so what it renders
is what ships. Three things the application layout supplies at request time are supplied by
the workbench's own configuration instead: the web fonts, which the framework's font
pipeline only produces from a layout; the client providers the new components read; and the
one action that crosses the server boundary, which is aliased to a stub so that a form can
be submitted in a browser without a server behind it. Everything else is the real component.

The token catalogue is **derived from the generated stylesheets, not written down**. The
palette and the type scale are read as text at build time and the pages are generated from
what they contain. A second hand-maintained list of tokens is a list that goes stale the
first time the design file changes and nobody thinks to update it — and the whole point of
generating the stylesheets from the design file was to stop keeping colour lists by hand.

## Consequences

Every colour and text style in the export appears in the catalogue the moment it is
exported, including ones no screen uses yet. Tokens are shown by resolving the custom
property rather than by applying a utility class, because a class name assembled at runtime
is invisible to the utility framework's scanner and would compile to nothing.

Story files live next to what they document and are scanned for classes like any other
source file, so a class written only in a story reaches the production stylesheet. The
alternative — excluding stories from the scan — would leave the catalogue rendering
unstyled, which is worse than a few hundred bytes.

**The workbench is not a test.** It renders components; it asserts nothing about them. The
existing test runner and the class ratchet keep their jobs. Whether stories should also run
as interaction or accessibility tests is a separate decision, and this record does not make
it.

**A stubbed server boundary is a divergence.** A form submitted in the workbench takes the
component's real validation path and then stops at a stub. That is the intended trade —
without it the module cannot load in a browser at all — but it means the workbench can show
a form working and the same form can still fail against the server.
