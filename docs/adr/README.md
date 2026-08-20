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

| #                                                                             | Decision                                                                                | Status                                            |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [0001](0001-explicit-content-sources.md)                                      | Declare Tailwind's content sources explicitly, detection off                            | Accepted                                          |
| [0002](0002-colour-tokens-keep-indirection.md)                                | Colour tokens keep their custom-property indirection                                    | Accepted                                          |
| [0003](0003-tailwind-class-linting-and-token-aware-merging.md)                | Tailwind class linting returns; class merging learns the project's tokens               | Accepted                                          |
| [0004](0004-token-layers-and-the-tailwind-theme.md)                           | The design-token export meets Tailwind's theme at the semantic boundary                 | Accepted; one consequence corrected by 0005       |
| [0005](0005-two-colour-systems-during-the-redesign.md)                        | Two colour systems ship side by side for the length of the redesign                     | Accepted                                          |
| [0006](0006-lint-and-format-without-antfu.md)                                 | Lint follows the framework; a formatter owns formatting                                 | Accepted                                          |
| [0007](0007-a-component-workbench-for-the-new-design-only.md)                 | A component workbench, catalogued for the new design only                               | Accepted                                          |
| [0008](0008-a-sealed-session-on-the-new-api.md)                               | A sealed session holding the new API's token pair, renewed in middleware                | Accepted; sections superseded by 0009, 0010, 0012 |
| [0009](0009-one-proxy-for-every-browser-call.md)                              | Every browser call goes through this application's own server, and arrives typed        | Accepted; one section superseded by 0015          |
| [0010](0010-one-client-for-the-auth-calls-too.md)                             | The authentication calls go through the generated client too                            | Accepted; consequences settled by 0011 and 0012   |
| [0011](0011-auth-failures-on-the-standard-action-error-channel.md)            | Authentication failures travel the standard action-error channel                        | Accepted                                          |
| [0012](0012-the-session-through-iron-session-s-own-api.md)                    | The session through iron-session's own API, auth calls beside the actions               | Accepted                                          |
| [0013](0013-a-mocked-membership-until-the-api-publishes-one.md)               | A mocked membership stands in until the API publishes one                               | Accepted; temporary by construction               |
| [0014](0014-a-two-source-activity-list.md)                                    | The activity list is composed from two sources                                          | Accepted; temporary by construction               |
| [0015](0015-the-proxy-refuses-session-issuing-paths-not-a-prefix.md)          | The proxy refuses the paths that issue a session, not the authentication prefix         | Accepted                                          |
| [0016](0016-a-second-upstream-with-its-own-client-proxy-and-specification.md) | The payments service is a second upstream, with its own client, proxy and specification | Accepted; the credential corrected by 0023        |
| [0017](0017-the-pricing-page-quotes-one-trial-product.md)                     | The pricing page quotes one trial product, in a currency this application picks         | Accepted                                          |
| [0018](0018-checkout-quotes-payments-and-charges-the-legacy-api.md)           | Checkout quotes the payments catalogue and charges the legacy API                       | Accepted; risks closed by 0021 bar one screen     |
| [0019](0019-the-parked-checkout-island.md)                                    | The resumewise Stripe/Adyen checkout is parked as a faithful, inert island              | Accepted; sentences corrected by 0021             |
| [0020](0020-one-answer-to-what-is-switched-on.md)                             | One settings object answers what is switched on, for every source                       | Accepted                                          |
| [0021](0021-the-checkout-island-takes-every-payment-but-one.md)               | The checkout island takes every payment but one, and no longer knows any route          | Accepted                                          |
| [0022](0022-retiring-the-legacy-layer-on-its-own-track.md)                    | Retiring the legacy layer on its own track                                              | Accepted                                          |
| [0023](0023-a-shared-technical-account-for-the-payments-upstream.md)          | A shared technical account is the payments credential, until the upstream trusts ours   | Accepted; temporary by construction               |
