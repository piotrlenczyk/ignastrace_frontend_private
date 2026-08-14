# 0008 — A sealed session holding the new API's token pair, renewed in the middleware

**Status:** Accepted — August 2026. The second, readable cookie described below is superseded by
[0009](0009-one-proxy-for-every-browser-call.md), and the consequence that renewal cannot use the
ordinary server-side API client is reversed by
[0010](0010-one-client-for-the-auth-calls-too.md); the rest stands.

## Context

The inherited session was a signed cookie managed by an authentication library, and it carried
exactly one useful value: the opaque authorisation header the legacy backend handed back at
sign-in. That value had no expiry the frontend could read, no renewal path, and no identity beyond
an email address.

Everything that followed from that was a symptom. A session died the moment the backend stopped
accepting the header, and the frontend found out by having the next request fail. There was nothing
in the browser a page script could use to call an API, so every call was laundered through the
server whether or not it needed to be. The route guards were hand-assembled regular expressions
that missed the login page and pointed their "please sign in" redirect at a path this application
does not serve.

The blocking problem, though, was the wider programme. The application is being moved onto a new
API which authenticates with an access/refresh token pair, and the old session model could neither
hold that pair nor rotate it. No screen could move to the new backend until the session changed.

## Decision

The session becomes a **sealed cookie**, encrypted with a single deployment secret, holding the
access token, the moment that token expires, the refresh token, and the identity decoded out of the
access token's own claims. It is http-only and lasts a month; the cookie is set to expire slightly
before the seal does, so the browser drops it rather than sending something that unseals to an
error.

> **Superseded by [0009](0009-one-proxy-for-every-browser-call.md).** The second cookie is gone. No
> browser code holds a bearer any more: a call from the browser goes through a proxy in this
> application, which attaches the session's token server-side, and client components read identity —
> never a token — from a provider. The paragraph below records why the split existed, not what the
> session is now.

A **second cookie carries the raw access token and is deliberately readable by page scripts**. This
is the point of the split. Client code needs a bearer token to call the API directly; it does not
need the refresh token, which is what can mint a new session. Exposing the short-lived half and
sealing the half that renews it is the whole reason there are two cookies rather than one. They are
written, rewritten and deleted in the same operations, never independently — a session where the
two have drifted apart is a state the code cannot produce.

**Tokens come from the new API only.** Sign-in, registration, sign-out and renewal all go there.
Social sign-in does not: that API expects the client to present an authorisation code it obtained
itself, and building that handshake is separate work, so the buttons stay visible and disabled with
copy saying the option is temporarily unavailable. A disabled button that explains itself is better
than a button that fails silently, and better than one that vanishes and leaves the visitor
wondering where their usual way in went.

**The middleware renews an expired token before the request is served**, allowing a small clock
skew so that a token about to expire is refreshed rather than refused a second later. It does not
probe a current-user endpoint on each request — the implementation this was modelled on does, and
that per-request round trip is deliberately not adopted. A renewed session is written to both the
incoming request and the outgoing response, because the internationalisation step downstream builds
its response from the request and would otherwise serve the old token.

When renewal fails, both cookies are cleared and the request continues as anonymous. **The
middleware does not redirect on a failed renewal**; the route guard does. Middleware redirects are
not followed for server actions, so a redirect issued there would swallow a form submission
silently.

Route guards are matched from explicit path patterns with an optional locale segment, held in one
place, so adding a protected area is a single edit and a locale prefix can never change what a
visitor is allowed to see.

## Consequences

**Everyone is signed out on deploy.** The old cookie stops meaning anything the moment the guards
read the new session. This was accepted rather than mitigated; a migration path for a token with no
readable expiry is not worth building for a single cutover.

**Legacy calls now carry a token the legacy backend will reject.** Both the server-side and
client-side legacy clients were changed to send the new session's access token, which keeps the
codebase compiling and structurally correct and makes every legacy screen fail authentication until
it is rebuilt on the new API. This is the recorded price of doing the cutover in one step instead of
maintaining two live sessions side by side, and it is why the screen-by-screen migration is the work
that follows this one.

**Concurrent renewals can sign a user out.** The refresh token rotates, so two requests that both
find an expired token will each spend it, and the loser's session is gone. Deduplicating them needs
a lock the middleware runtime has nowhere to keep, and the window is the few seconds around an
expiry. It is a known, accepted race, not an oversight.

**Renewal cannot use the ordinary server-side API client.** That client resolves the caller's
address through a module needing a request scope the middleware runtime does not have, so renewal
uses a separate minimal client that takes the locale and the forwarded address from the request it
was given. Two clients against one API is a cost of the runtime split, and it means a change to
request headers has two places to land.

> **Reversed by [0010](0010-one-client-for-the-auth-calls-too.md).** The claim in this paragraph is
> wrong: the ordinary client resolves each request-scoped value behind a guard at the point it is
> used, and leaves alone any header the caller already set, so one client serves the middleware
> runtime as well. There is no second client.

**Nothing enforces the server boundary on the session modules.** The sealed cookie's reader and
writer are ordinary modules; a future client component that imported one would fail at runtime
rather than at build. A guard on those modules would catch it, and is worth adding — it was left out
here only because nothing currently crosses that line.

**The server-side session getter can redirect, and nothing asks it to.** The guard in the middleware
is the first line and catches the anonymous visitor before a page renders. The redirecting form
exists as a second line for a reader that has no guard in front of it; today every reader does.
