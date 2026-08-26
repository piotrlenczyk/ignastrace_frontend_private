# 0035 — The public cancellation follows onto payments, through a server action

**Status:** Accepted — August 2026. **Reverses the last standing line of**
[0025](0025-the-subscription-writes-follow-the-read-onto-payments.md): "the public cancellation form is
out of scope and stays on legacy." It does not remove the obstacle that record named — the payments
proxy still refuses the `internal` family, by design and unchanged — it goes around it, which is why
this is a record and not a commit message. It changes nothing in
[0009](0009-one-proxy-for-every-browser-call.md), and is the first call on the retirement track where
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md)'s cost does **not** apply. It takes
the browser-side legacy surface from three call sites to two, after
[0034](0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md) took it to three.

## Context

**One cancellation moved and one did not, and the two are the same act.** 0025 took the billing
screen's cancel and reactivate onto the payments service and deleted their legacy wrappers. It left
`/cancellation` — the public form that cancels by e-mail with no session — where it was, on
`POST /public/subscriptions/cancel` through the legacy browser proxy. The stated reasons were that
payments publishes no unauthenticated cancellation and that `/internal/subscriptions/cancel` is in a
path family the proxy refuses.

**Both reasons are still true, and neither is an obstacle once the call stops being a browser call.**
The payments proxy refuses `admin`, `internal`, `bot`, `webhook`, `price-configurator` and
`chargeback-expert` by first-segment prefix, before it consults the published-path list — so no
regeneration upstream can make one briefly reachable. That refusal is about what a **page script** may
reach. It says nothing about the server-side client, which serves any path the specification declares.
The call therefore moves by becoming a server action, not by an exception in that list.

**The endpoints do not match on their subject, which is the whole difficulty.** The legacy call takes
`{ email }` and nothing else. `POST /internal/subscriptions/cancel` takes `{ id }` — a user id —
optionally with `cancellationSource` and `cancellationReason`, and answers `{ message }`. A public page
holds no user id and no session from which to derive one.

**The API publishes the missing half, and publishes it to nobody but this application's server.**
`POST /api/v1/auth/get-user-by-email` declares `security: []` — no bearer, no key — and answers
`{ id, email }` or a 404. It is on the API proxy's `REFUSED_PATHS`, for a reason that record states
plainly: "it answers whether an address has an account, which from a page script is an account
enumerator". Server-side it is fully available. So the two calls compose in exactly one place: a server
action, which is also the only place the second one is reachable from.

**This endpoint is the first on this track that does not pay 0023's price.** Every payments call so far
is raised as one shared technical account, which is why 0025 records that a member's cancellation
cancels _that account's_ subscription. `/internal/subscriptions/cancel` declares no security at all and
acts on the user named in its body. The credential is irrelevant to it, and the subscription cancelled
is the one asked for. This is the only respect in which the public form now behaves _better_ than the
redesigned billing screen.

**The service publishes a source for exactly this screen, and does not say what it does.**
`AllowedCancellationSources` has four values. Two are documented as "cancel subscription & delete
user" (`app_dashboard`, `admin_panel`), one as a chatbot's, and `public_cancellation` carries no
description at all. The field is optional, so omitting it is legal — and then the default is the
service's to choose, undocumented, among values half of which delete an account.

## Decision

**The write moves to `POST /internal/subscriptions/cancel`, through a server action, and the legacy
wrapper is deleted.** `actionCancelSubscriptionByEmail` lives in `src/server/actions/subscription.actions.ts`
beside the screen's other action, its input schema in a sibling `subscription.schemas.ts` for the reason
`account.schemas.ts` gives. `src/app/[locale]/cancellation/_hooks/` is gone, and with it the screen's
last use of `useApi()`.

**The address is resolved, not guessed.** The action calls
`POST /api/v1/auth/get-user-by-email` first and cancels the id that comes back. A failure to resolve
ends the action: the cancel call is never made. That ordering is the one thing about this change that
cannot fail visibly — both calls type-check with any id at all — so it is what the unit tests are
about.

**No placeholder id.** The work was framed as sending an arbitrary id with a `TODO: [refactor]` against
it, and that was rejected before it was written: a constant id makes every submission cancel one
particular account regardless of what was typed, which is not a smaller version of the feature but a
different and harmful one, untestable end to end and indistinguishable from correct in review.

**`cancellationSource: 'public_cancellation'` is sent; no `cancellationReason` is.** The source is the
channel the service publishes for telling its two cancellation surfaces apart — the thing 0025 wanted
and correctly refused to fake through the reason field, which `/subscriptions/cancel` offers instead. It
is also the only one of the four values not documented as deleting the user, so stating it is narrower
than leaving the service to pick. The reason stays absent because the form asks for none.

**A refusal is read by code where a code exists, and by upstream where none does. No status is read.**
The screen keeps its three outcomes and its three existing keys under `pages.cancellation.form`. The
lookup's refusal is read off the API's own `errorCode`, through a third guard beside the two in
`src/server/lib/auth-action-error.ts` and typed against the generated enumeration: the specification
declares two codes for this condition — `ENTITY_NOT_FOUND_ERROR` and `USER_DOES_NOT_EXIST_ERROR` — and
both are accepted, exactly as the registration conflict beside it accepts two. Any refusal from the
payments service is "no subscription", discriminated on `source`, because that is the one thing there is
to read: that service publishes no codes at all and this endpoint declares no failure whatsoever, so a
status from it would be an assertion about an undocumented refusal. Everything else is the generic
toast.

The asymmetry is the point, and it was not the first shape written. This screen was initially branched
on the API's 404 — the project's rule says to branch on `errorCode` and never on the status, and the
justification offered for the deviation ("its specification declares this 404") was true and beside the
point: the same specification declares the codes that come with it, and says of them "`errorCode` is
what a client should branch on". The rule was not impossible on the API side, only unexamined. It is
genuinely impossible on the payments side. It is recorded because a half-true justification for
deviating from a rule is worse than no justification: it reads as settled and stops the next reader
looking.

**The screen keeps its legacy palette and components.** Only the fetching changes, as everywhere else
on this track. No `__NEW__` keys, no `MIGRATED_PATHS` entry, and the three existing error strings are
reused rather than re-keyed. One line of behaviour is removed beyond the endpoint swap: the success
handler's `router.refresh()`, which re-rendered a page whose output depends on nothing a cancellation
changes.

## Alternatives rejected

**A random or configured user id with a `TODO`, as the work was originally framed.** Rejected above.
The variant putting it in an environment variable is the same defect with a switch in front of it.

**An exception in `REFUSED_PATH_FAMILIES` for this one path.** The shortest change and the wrong one.
That list is what makes the proxy a door onto a service rather than a tunnel onto its host, and the
family match exists specifically so nothing upstream can widen it; opening it for a browser call would
also put an unauthenticated cancel-anyone endpoint one fetch away from any page script.

**Waiting for payments to publish an unauthenticated cancellation, or for the endpoint to accept an
e-mail.** This is what 0025 effectively chose. Neither is asked for upstream and neither has a date, and
the composition needed no upstream change.

**Reading the payments refusal's `message` and showing it.** Rejected for the reason 0025 rejected it:
a foreign service's untyped text, in a language nobody promised, in front of a member.

**Collapsing to one generic refusal, as the billing screen has.** Simpler and honest about what the
specification promises, but a regression on a screen that today tells "no such account" from "no
subscription" — and both are things the person can act on.

## Consequences

- **Anyone can still cancel anyone's subscription by typing their address.** That is what this screen
  has always been, and this change neither widens nor narrows it: the 404 branch already told a caller
  whether an address has an account. The lookup that now answers that question moves server-side,
  behind a proxy list that keeps it away from page scripts. Nothing here should be read as an argument
  that the property is fine — only that it is unchanged.
- **The cancellation acts on the member's own subscription rather than the shared technical account's.**
  0023's sharpest cost, which 0025 pays knowingly, is not paid here.
- **Two upstreams now have to answer for one submission.** A member whose address resolves but whose
  cancellation is refused sees "no subscription", which is right when that is why it was refused and
  wrong for any other reason payments might refuse — none of which its specification names.
- **What `public_cancellation` does upstream is unverified.** Its siblings delete the user. If it does
  too, this screen deletes accounts and the fix is upstream, not here. It is the first question to ask
  the payments team about this change.
- **The first real 4xx from this endpoint will be seen in production**, because its specification
  declares only a 200.
- **The legacy browser surface is down to two call sites**: the standalone sex-offender search and its
  upselling purchase. `/public/subscriptions/cancel` has no callers.
- **Verification was the static checks plus unit tests** over the action — the order of the two calls,
  the resolved id reaching the cancel body, the source sent and the reason omitted, that no cancel is
  attempted when the lookup refuses, both of the API's not-found codes reaching the screen's guard, and
  a payments refusal not being mistaken for one of them.
  No walk through a browser was made: this form is public, so one is possible without a session, but a
  successful submission cancels a real subscription on whatever environment it reaches.
