# 0001 — Declare Tailwind's content sources explicitly, with automatic detection off

**Status:** Accepted — Tailwind v3 → v4 migration, August 2026.

## Context

Tailwind v4's headline convenience is that it finds your source files by itself: it walks
the project from the repository root, skips anything version control ignores, and treats
every remaining text file as a place class names might appear. There is no content
configuration to maintain. A reader who knows v4 will expect that behaviour, so turning it
off needs an explanation.

Under v3 this project narrowed the scan by extension — only the JavaScript and TypeScript
source families were ever read. Automatic detection widens that to _everything_, and this
repository has three large areas where "everything" is the wrong answer:

- **The translation payloads.** Roughly fifteen locales, ninety files, about six megabytes
  of user-facing prose. This is the largest body of text in the repository by a wide
  margin, and it is machine-generated in the sense that nobody reviews it for
  incidental collisions with utility names.
- **The generated design-token stylesheets.** A frozen export from the design tool. It
  carries its own vocabulary of token names, deliberately kept out of the utility layer.
- **Written documentation**, including the write-up of this very migration, which
  necessarily quotes the utility names it describes.

The translation payloads turn out to be the interesting case, and not for the reason we
expected. The cost argument is real but small: compiling the stylesheet with detection on
measured about twice the wall-clock of compiling it with an explicit allowlist — roughly
24 ms against 11 ms warm, 194 ms against 57 ms cold. That is paid on every edit during
development, which is annoying rather than disqualifying.

The correctness argument is the one that decided it. English prose contains words that are
also Tailwind utility names. Compiling both ways and diffing the emitted class list, the
automatic scan produced thirty utilities the allowlist did not, and lost none. Among them
were rules generated purely because ordinary words — _table_, _visible_, _collapse_,
_filter_, _contents_, _running_ — appear in translated copy. Others came from the frozen
token export, and others from the migration write-up, where the scanner read the names of
the utilities that document says were _removed_ and dutifully re-emitted them.

None of those thirty rules break a page. That is precisely the problem: dead CSS that
nobody asked for, that appears and disappears as copywriters edit prose in languages the
engineer editing the stylesheet does not read, and that makes the compiled output
untrustworthy as a check on whether a utility is genuinely still in use. During a
parity-focused migration whose entire verification strategy rests on diffing compiled
output, an input that changes when a translator changes a noun is unacceptable.

## Decision

Automatic source detection is disabled, and the directories to scan are declared
explicitly, as an allowlist of the application source families.

## Alternatives considered

**Leave detection on and add exclusions.** The obvious option, and the one the framework
steers you toward. Rejected because it is unsafe in the direction that matters. An
exclusion list is a statement about the files that exist today; anything added tomorrow is
included by default. A new locale, a fixture, a data dump, a vendored export — each
silently rejoins the scan, and the failure is quiet, so nobody learns about it until they
are debugging why a rule they never wrote is in the bundle. An allowlist inverts the
default: new material is out until someone opts it in, and opting in is a visible edit.
The cost of the inversion is that a genuinely new source _family_ must be added by hand,
which is a loud, one-line failure the first time a class does not apply — much cheaper to
diagnose than the silent kind.

**Exclude only the translation payloads and accept the rest.** Rejected as a half-measure
that keeps the unsafe default while making it look addressed.

**Accept the phantom utilities as harmless.** Rejected on the verification argument above.
They are individually harmless and collectively corrosive.

## Consequences

- Source files outside the declared families are invisible to Tailwind. A class name that
  only ever appears in a template of a new kind will not be generated, and the symptom is
  an unstyled element rather than an error.
- The compiled stylesheet is a function of application source only. It does not move when
  copy, documentation or the generated token export changes, which is what makes
  compiled-output diffing usable as a review tool.
- The allowlist is one more thing to remember when introducing a new file type, and
  nothing enforces it.

## What would make this worth revisiting

- Tailwind gaining a way to constrain automatic detection by extension, or otherwise
  making the default safe against non-source text. That would remove the reason for the
  allowlist while keeping the convenience.
- The translation payloads moving out of the repository entirely — fetched at build time
  rather than committed. That removes the largest contributor, though not the argument
  about the unsafe default.
- The project growing enough source-file _kinds_ that maintaining the allowlist causes
  more missing-class incidents than automatic detection would cause phantom rules. Count
  them before concluding this; the intuition here is unreliable in both directions.
