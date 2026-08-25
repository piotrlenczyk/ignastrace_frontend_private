# 0031 — Spend versus buy is settled from the credit balance, not from an error code

**Status:** Accepted — August 2026. **Supersedes one section of
[0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md)** — the
one that named a single undeclared error code as the signal for "no credit left", and stated the
assumption behind it as pointing the safe way. The assumption was wrong, and its safe direction cost
the whole feature. Everything else in 0030 stands: the charge still follows the price onto the
payments service, the order is still spend-first, and a second spend that is refused is still
reported rather than retried. It changes nothing in
[0023](0023-a-shared-technical-account-for-the-payments-upstream.md) and inherits its open question,
knowingly. It closes #102 on the legacy-retirement epic (#69).

## Context

**Buying an upsell from the member area never bought anything.** A member with no credit left who
opened the data-breach, sex-offender or social-network unlock dialog and accepted the price was told
the payment had failed. No card was charged, no credit was bought, the section stayed locked, and no
sequence of gestures got past it. Three of the products this application sells could not be sold.

**The cause is exactly the failure 0030 wrote down.** That record read "the caller has no credit of
this product" out of the refusal envelope's own error code, of which it admitted precisely one —
because the consume operation documents only 401 and 403 and says nothing about an empty balance. It
recorded the risk plainly: if the backend refuses with some other code, the purchase branch is never
reached, the dialog reports a failed payment, no money moves, and the fix is one entry in that list.
The chosen error code turns out to belong to a different operation entirely — the sex-offender read
raises it; the spend never does.

**What the spend actually sends is a conflict, and the fix is not one entry in a list.** The new API
refuses a spend it will not perform with HTTP 409. The envelope states the status as a word, and for
that status the word is `CONFLICT`; its error code is the generic handled-server-error member of the
business union, and the only thing naming the condition is a free-text sentence in the additional
context.

**And the same envelope carries two opposite meanings.** The spend refuses with that identical
conflict both when the balance is empty and when the content is _already unlocked_. Status, error
code and message are byte-for-byte the same for both; only the free-text sentence differs. So
reading any conflict as an empty balance would charge a member for a section they already own —
precisely the charge-with-nothing-behind-it the spend-first order exists to prevent, and the
mistake 0030 deliberately narrowed its list to avoid.

**The reference implementation cannot be copied.** ResumeWise's equivalent flow branches on a
documented 400 carrying its own dedicated error code. The new API offers no such shape for this
operation.

**The report's own section buttons had the mirror-image defect.** They spent a credit where a balance
said one was held and treated every non-success answer as a reason to open the sales dialog — so a
member whose section was already unlocked was shown an offer to buy it.

## Decision

### A conflict is recognised by the envelope's status word, and the error-code list is deleted

The refusal reaches a query-library mutation as the body the upstream refused with — no status
object, no flattened client error — and the status word in that envelope is the whole of the
classification. The predicate that used to answer "is this an empty balance" is renamed to say what
it now tests, a spend conflict, and the list of accepted error codes goes with it. Keeping the list
would preserve a signal that was never real.

Anything that is not that envelope is not a conflict: a gateway's HTML, or the proxy's own refusal
arriving in the same envelope under its own code family, says nothing about the spend, and treating
one as a conflict would put an unrelated failure on the road to a charge.

### The credit balance says which of the two conflicts it was

A conflict is not read as "no credit" on its own. The member's balance for that product is re-read
**fresh** from the new API, and that answer settles it:

- **more than zero** — the conflict cannot have meant an empty balance, so it meant the content is
  already unlocked. The unlock succeeds and nothing is charged.
- **zero** — the balance is genuinely empty, so the upsell is bought on the payments service,
  confirmed where the provider asks the cardholder for it, and the credit spent.
- **unreadable** — nothing is inferred and nothing is charged. The member is told the attempt failed.

**Nothing branches on the English sentence** in the refusal's additional context, in either
direction. A copy change upstream cannot move money. Every path that leads to a charge requires a
fresh reading of zero, and the read is fresh by construction: it goes to the API with staleness
disabled rather than answering out of whatever the balance query happens to hold, because a cached
number is exactly the stale one this inference exists to correct.

### The pure module gains one operation and one outcome, and no second seam

The spend outcome becomes three-valued — spent, conflict, refused — replacing the "no credit" answer
the adapter can no longer produce on its own, and the injected operations gain a balance read that
answers with a count or with "unknown". Everything else about that module is unchanged: injected
operations, no network, no React, no session, one discriminated outcome out, and every branch
reachable from a test with plain fakes. That is where this decision is tested, and it is the only
place tests are added — the adapter, the dialog and the report sections stay untested, which is what
0022 holds this track to and what 0030 restated for these call sites.

### The order of operations, in full

For a credit-balance product: spend; on a conflict read the balance; on a fresh zero buy, confirm
where asked, and spend once more. A spend refused outside a conflict never reads the balance and
never buys.

**The second spend is attempted once and its answer is final.** 0030's "reported, not retried"
stands: no waiting for the credit, no polling of the balance, no retry schedule inside the module.
The second spend is not put through the balance inference either — after a purchase, anything other
than a spent credit is a refusal.

### The section's own unlock button gets the same answer, from the same implementation

The direct spend stops handing a raw refusal to its call site and answers in that call site's terms:
unlocked, no credit, or refused — where a conflict is resolved by the same balance read. A section
navigates on unlocked, opens the priced dialog on no credit, and reports a failure on refused,
through the toast the neighbouring legacy screens already use. The rule is not copied into the two
sections; there is one implementation and both entry points reach it, so no entry point offers to
sell a member a section they already hold.

### Nothing changes on the purely purchasing paths, and no copy is added

The purchase-only sequence — the three funnel steps and unlimited PDF downloads — spends no credit,
so it has no conflict to resolve and is untouched, as are the surface that makes the 3-D Secure
confirmation available and the resolution of a product to its price row. A purchase that succeeded
while the section stayed locked keeps reporting through the existing failed-payment message, and the
retry that message offers keeps re-entering the whole sequence. No new member-facing string.

### Nothing is asked of either upstream

No dedicated error code for an empty balance, no declaration of the conflict the consume operation
already returns, no change to how the credit is minted. This application adapts to what the upstream
sends today.

## Alternatives rejected

**Adding the observed error code to 0030's list.** The observed code is the generic
handled-server-error member, shared by every conflict this operation raises — including the
already-unlocked one. A list containing it would charge members for content they own. This is the
"list too wide" failure 0030 chose against, and it is still the wrong direction.

**Branching on the free-text sentence in the refusal's additional context.** It is developer-facing
prose, not an interface. A wording change upstream would silently move money, or silently stop
moving it, with no build failure and no test to catch either.

**Reverting to buy-first.** It is what the reference implementation deliberately removed, in two
successive fixes, because it charged members who already had something to spend. 0030's order was
never the defect.

**Deciding spend-versus-buy from the balance alone, with no spend attempt.** Rejected by 0030 and
still rejected: a balance read a moment ago can be stale, and every stale reading would charge a
member for something already theirs. The balance is consulted here only after a spend has already
been refused, which is the opposite arrangement.

**Waiting for the credit after the purchase.** No clock is injected and no poll is added, so the
one-immediate-attempt shape stays. See the second accepted risk below.

**Tests on the adapter, the dialog or the sections.** The whole rule about when money moves lives in
the pure module. Testing the adapter would test the query library.

## Consequences

- **The three credit-balance upsells can be bought again**, which is the whole point.
- **An unlock of already-owned content reads as an unlock**, at both entry points, rather than as an
  offer to buy it. Nothing is charged for it.
- **No failure mode introduced here moves money without a fresh zero balance behind it.** An
  unreachable balance, a refusal that is not a conflict, and a dead session all fail without a
  charge.
- **Which account the credit is minted for is still unsettled, and this record ships regardless.**
  The payments purchase identifies its buyer solely from the cookie, which is the shared technical
  account of 0023, and the new API mints the credit for the user named on the resulting payments
  event. If that user is the technical account rather than the member, fixing this trigger converts
  today's "nothing happened" into "charged and still locked". This was raised, and the decision is to
  ship the trigger fix anyway; the payments service's own source was not available to settle it. It
  is the same difference that makes the reference implementation unreadable here — there the purchase
  is raised on the member's own token, so its payments event names the member.
- **A retry may charge a second time.** The credit is minted asynchronously from a payments event, so
  a single immediate second spend may find the balance still empty even when everything upstream is
  correct. The resulting message looks like a failed payment, and its retry re-enters the full
  sequence — purchase included. This was raised, and the decision is to keep the retry as it is.
- **A conflict now costs an extra round trip** to the balance endpoint before anything else happens.
  It is one read on a path that was already about to take a card.
- **The classification is only as good as one status word.** If the upstream ever answers this
  operation's empty balance with something other than a conflict, the symptom is the same one this
  record fixes — a member who cannot buy, and no money moved. The direction of that failure is
  deliberate and unchanged from 0030.
- **Verification was `check-types`, `lint`, `format:check` and the full suite.** Money moves on this
  path, so a manual pass through one unlock dialog and one already-unlocked section on a configured
  environment is worth a developer's time where one is available.
