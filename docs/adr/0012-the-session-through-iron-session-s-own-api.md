# 0012 — The session through iron-session's own API, and the auth calls beside the actions

**Status:** Accepted — August 2026. Reverses the cookie-jar consequence of
[0008](0008-a-sealed-session-on-the-new-api.md) and the identity-completion call introduced with
[0010](0010-one-client-for-the-auth-calls-too.md).

## Context

The session lived in one 521-line module. It held the token decoding, the identity assembly, the
sealing, all five auth requests, and the five operations that composed them — and every one of
those operations took the cookie jar it worked on as a parameter, because the middleware runtime
was believed to have no request scope. That parameter is what made the module hard to read: it
turned five short operations into five higher-order ones, and it forced a `SessionCookieReader` /
`SessionCookieWriter` pair to exist so that `cookies()` and `NextResponse.cookies` could both be
passed to the same function.

Two of the premises turned out not to hold.

**Next does give the middleware a request scope.** The middleware adapter runs the handler inside
a work store and a request store, so `cookies()` — and therefore `getIronSession` — resolves there.
The abstraction was paying for a problem that no longer existed.

**The identity is in the token.** The module fetched `/api/v1/user/me` at sign-in whenever the
access token's claims did not carry a complete identity, and typed every field but the id as
optional to allow for it. That defensiveness was never traced to an actual gap in what the API
issues.

The reference implementation this application's session was modelled on
(`resumewise-frontend`) does none of this: it holds the session through iron-session's own
`getIronSession` / `save` / `destroy`, keeps each auth request in the action that makes it, and
reads the whole identity off the token.

## Decision

**The session is held through iron-session's own API.** `getSession()` is
`getIronSession<SessionData>(await cookies(), getSessionOptions())` — a mutable session object with
`save` and `destroy` on it. `setSession(tokens)` writes one, `session.destroy()` ends one, and
`getServerSession(options)` is the plain read that server components and route handlers use. There
is no cookie-jar parameter anywhere, and `SessionCookieReader` / `SessionCookieWriter` are gone.

**`getServerSession` carries the guard's question.** It takes `shouldRedirect`, `redirectPath` and
`acceptGuest`, and answers `null` for a guest-typed session unless the caller says it accepts one.
That replaces the previous split between a reader that returned any session and a separate
`isFullUserSession` predicate the guards had to remember to apply.

**Each auth request lives with the write that makes it.** Sign-in and registration post to the API
in the body of their own server action and hand the pair to `setSession`; the renewal posts from
the middleware step that renews. Nothing in the session module calls the API. The requests still go
through the generated client and the shared unwrapper, so [0010](0010-one-client-for-the-auth-calls-too.md)'s
"one client for the auth calls too" is unchanged — only where they are written has moved.

**The middleware still seals by hand.** Reading could go through `getIronSession` now, but writing
cannot: Next flushes a cookie written through `cookies()` in the middleware with
`headers.set('set-cookie', …)`, which would drop the cookies the tracking step puts on the same
response. A renewed session also has to land on the incoming request, because the
internationalisation step builds its response out of that request. So the session step keeps
`unsealData`/`sealData` against `NextRequest`/`NextResponse` cookies — which is what the reference
implementation does as well, for the same second reason.

**The identity is whatever the access token's claims say.** `id`, `type`, `roles` and `exp` are
required; only the address is optional, because the reference API omits it for some accounts. The
decode checks for all four rather than trusting the cast `jwt-decode` gives it, and raises when one
is absent — a token without an `exp` would otherwise seal with an expiry of `NaN`, which every
comparison reads as "not yet expired" and the middleware would renew on every request; one without
an `id` would seal into a cookie that reads back as an anonymous visitor. The failure reaches the
form as the action library's default server error. `/api/v1/user/me` is no longer called at
sign-in, and `jwt-decode` replaces the hand-written base64url decoder.

**The per-request `/user/me` probe is still not adopted.** The reference implementation calls it on
every request with a live token, to catch an account deleted out from under a session.
[0008](0008-a-sealed-session-on-the-new-api.md) rejected that round trip and this record does not
reverse it.

## Consequences

**Sign-out no longer revokes the token upstream.** `actionLogout` destroys the cookie and nothing
else, matching the reference implementation. A refresh token therefore stays valid at the API for
its full lifetime after the member signs out — anyone holding a copy can keep minting sessions with
it. This is the one deviation here that costs something real, and it was taken deliberately in
favour of the 1:1 shape.

**A token renewal is no longer given a clock-skew allowance.** The middleware renews on a bare
`Date.now() < accessTokenExpiresAt`, so a token that expires in the moment between that check and
the API receiving it produces one failed request; the following request renews. The 30-second skew
that prevented this is gone.

**A token missing a claim breaks sign-in rather than degrading.** There is no longer a fallback
that fills the identity from the current-user endpoint. If the API stops emitting `id`, `type`,
`roles` or `exp`, sign-in fails outright instead of producing a half-populated session — the louder
failure, chosen on purpose, but it does mean the session layer now depends on an undocumented
property of the token: the specification types it only as a string. This is the one place the
implementation is deliberately stricter than the reference it was copied from, which casts the
decode and checks nothing.

**The registration action no longer states a locale.** It posts nothing but the address and lets the
client attach `x-locale` from the request being served, which is what decides the language of the
account's welcome mail. One parameter fewer for a form to get right, and one more thing that is
implicit in the request scope.

**The session module is 123 lines where it was 521.** The middleware's session step grew by the
renewal request and the unsealing it now owns, and the actions grew by the three requests they
make; nothing else absorbed the difference — the rest was the cookie-jar indirection, the
hand-written decoder and the identity-completion path.
