# Architecture decision records

A record belongs here when a decision is **hard to reverse**, **surprising without
context**, and **the outcome of a real trade-off** — someone weighed alternatives and
rejected them for reasons that are not visible in the resulting code. Everything else
belongs in a code comment or in the regular docs.

Records are immutable once merged. A decision that stops holding gets a _new_ record
that supersedes the old one; the old one stays, with its status updated, so the reasoning
trail survives.

Keep repository file paths and excerpts of project code out of these records. They
outlive the layout of the tree, and a record that names a file is wrong the day the file
moves. Describe things by their role instead.

| #                                                                                          | Decision                                                                                | Status                                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [0001](0001-explicit-content-sources.md)                                                   | Declare Tailwind's content sources explicitly, detection off                            | Accepted                                          |
| [0002](0002-colour-tokens-keep-indirection.md)                                             | Colour tokens keep their custom-property indirection                                    | Accepted                                          |
| [0003](0003-tailwind-class-linting-and-token-aware-merging.md)                             | Tailwind class linting returns; class merging learns the project's tokens               | Accepted                                          |
| [0004](0004-token-layers-and-the-tailwind-theme.md)                                        | The design-token export meets Tailwind's theme at the semantic boundary                 | Accepted; one consequence corrected by 0005       |
| [0005](0005-two-colour-systems-during-the-redesign.md)                                     | Two colour systems ship side by side for the length of the redesign                     | Accepted                                          |
| [0006](0006-lint-and-format-without-antfu.md)                                              | Lint follows the framework; a formatter owns formatting                                 | Accepted                                          |
| [0007](0007-a-component-workbench-for-the-new-design-only.md)                              | A component workbench, catalogued for the new design only                               | Accepted                                          |
| [0008](0008-a-sealed-session-on-the-new-api.md)                                            | A sealed session holding the new API's token pair, renewed in middleware                | Accepted; sections superseded by 0009, 0010, 0012 |
| [0009](0009-one-proxy-for-every-browser-call.md)                                           | Every browser call goes through this application's own server, and arrives typed        | Accepted; one section superseded by 0015          |
| [0010](0010-one-client-for-the-auth-calls-too.md)                                          | The authentication calls go through the generated client too                            | Accepted; consequences settled by 0011 and 0012   |
| [0011](0011-auth-failures-on-the-standard-action-error-channel.md)                         | Authentication failures travel the standard action-error channel                        | Accepted                                          |
| [0012](0012-the-session-through-iron-session-s-own-api.md)                                 | The session through iron-session's own API, auth calls beside the actions               | Accepted                                          |
| [0013](0013-a-mocked-membership-until-the-api-publishes-one.md)                            | A mocked membership stands in until the API publishes one                               | Accepted; two fields since emptied by 0034, 0036  |
| [0014](0014-a-two-source-activity-list.md)                                                 | The activity list is composed from two sources                                          | Superseded by 0026                                |
| [0015](0015-the-proxy-refuses-session-issuing-paths-not-a-prefix.md)                       | The proxy refuses the paths that issue a session, not the authentication prefix         | Accepted                                          |
| [0016](0016-a-second-upstream-with-its-own-client-proxy-and-specification.md)              | The payments service is a second upstream, with its own client, proxy and specification | Accepted; the credential corrected by 0023        |
| [0017](0017-the-pricing-page-quotes-one-trial-product.md)                                  | The pricing page quotes one trial product, in a currency this application picks         | Accepted                                          |
| [0018](0018-checkout-quotes-payments-and-charges-the-legacy-api.md)                        | Checkout quotes the payments catalogue and charges the legacy API                       | Accepted; risks closed by 0021 bar one screen     |
| [0019](0019-the-parked-checkout-island.md)                                                 | The resumewise Stripe/Adyen checkout is parked as a faithful, inert island              | Accepted; sentences corrected by 0021             |
| [0020](0020-one-answer-to-what-is-switched-on.md)                                          | One settings object answers what is switched on, for every source                       | Accepted                                          |
| [0021](0021-the-checkout-island-takes-every-payment-but-one.md)                            | The checkout island takes every payment but one, and no longer knows any route          | Accepted                                          |
| [0022](0022-retiring-the-legacy-layer-on-its-own-track.md)                                 | Retiring the legacy layer on its own track                                              | Accepted                                          |
| [0023](0023-a-shared-technical-account-for-the-payments-upstream.md)                       | A shared technical account is the payments credential, until the upstream trusts ours   | Accepted; temporary by construction               |
| [0024](0024-the-subscription-read-moves-to-payments-before-the-data-does.md)               | The subscription read moves to payments before the data does                            | Accepted; one line of 0022 reversed               |
| [0025](0025-the-subscription-writes-follow-the-read-onto-payments.md)                      | The subscription writes follow the read onto payments                                   | Accepted; one line of 0024 superseded             |
| [0026](0026-the-activity-feed-becomes-the-list.md)                                         | The activity feed becomes the list, one exit condition short                            | Accepted; supersedes 0014                         |
| [0027](0027-the-reverse-lookup-creation-starts-on-an-unanswered-assumption.md)             | The reverse-lookup creation starts on an unanswered assumption                          | Accepted; one line of 0022 reversed               |
| [0028](0028-the-report-reads-move-and-the-unlocks-stay-behind.md)                          | The report reads move onto the new API and the unlocks stay behind on legacy            | Accepted; extends 0027's assumption               |
| [0029](0029-the-upsell-price-moves-to-payments-and-the-charge-stays-behind.md)             | The upsell price moves to payments and the charge stays behind on legacy                | Accepted; one line of 0022 reversed               |
| [0030](0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md) | The upsell charge follows the price, and the credit is spent on the new API             | Accepted; one section superseded by 0031          |
| [0031](0031-spend-versus-buy-is-settled-from-the-credit-balance.md)                        | Spend versus buy is settled from the credit balance, not from an error code             | Accepted; supersedes one section of 0030          |
| [0032](0032-the-order-success-extras-move-to-payments-and-the-cart-dissolves.md)           | The order-success extras move to payments, and the cart dissolves                       | Accepted; one line of 0030 reversed               |
| [0033](0033-the-funnel-s-report-creation-follows-the-member-s.md)                          | The funnel's report creation follows the member's onto the new API                      | Accepted; lifts 0027's carve-out                  |
| [0034](0034-the-notification-centre-moves-whole-and-loses-eleven-languages.md)             | The notification centre moves whole, and loses eleven languages                         | Accepted; closes a gap 0022 opened                |
| [0035](0035-the-public-cancellation-follows-onto-payments-through-a-server-action.md)      | The public cancellation follows onto payments, through a server action                  | Accepted; reverses 0025's last line               |
| [0036](0036-the-subscription-gate-reads-the-payments-service.md)                           | The subscription gate reads the payments service, and the member read leaves it         | Accepted; extends 0024 to every screen            |
