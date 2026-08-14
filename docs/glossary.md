# Glossary

The words this codebase uses for the things it models, and what each one means here
specifically. When a term has a general meaning in the industry and a narrower one in this
project, the narrower one wins — that is what this file is for.

Terms are grouped by the area of the application they belong to. Add a term when its
meaning is not obvious from the code, or when two people have already used it to mean two
different things.

## Session and authentication

Introduced by [ADR 0008](adr/0008-a-sealed-session-on-the-new-api.md), which records why the
model looks like this. The **proxy** and everything that follows from closing the access token
are recorded in [ADR 0009](adr/0009-one-proxy-for-every-browser-call.md), which also defines the
vocabulary of the data layer around it.

**Session**
: What the application knows about the person making a request: their identity, the tokens
that authenticate them, and when the access token expires. It lives in one sealed, http-only
cookie, so no part of it is legible to a page script. Client components learn who is signed
in from the **session provider** the root layout renders out of that cookie — identity only,
never a token.

**Access token**
: The short-lived credential sent to the API as a bearer token to prove who the caller is.
It carries the identity in its own claims, which is where the session gets the account's id,
email, account type and roles rather than asking an endpoint for them. It never leaves the
server: a call from the browser goes through a **proxy**, which attaches it on the way past.

**Proxy**
: A route handler in this application that forwards a browser's call to a backend with the
session's bearer attached server-side. There are two — one onto the new API, which validates
the path against the generated specification, and one onto the legacy backend, which has no
specification and is bounded by the single host it forwards to. Both discard any
`Authorization` the browser supplies, so the session's token is the only one presentable.

**Refresh token**
: The long-lived credential that buys a new access token when the current one expires. It
never leaves the sealed cookie, and it **rotates** — spending it yields a new refresh token
and invalidates the old one. That rotation is why two requests renewing at the same time can
sign a user out; see the ADR's consequences.

**Renewal**
: Exchanging an expired access token for a fresh pair. It happens in the middleware, before
the request is served, so that a token expiring in the background never surfaces to the
person using the site. A renewal that fails clears the session and the request continues as
anonymous — it does not redirect, because a middleware redirect is not followed for a server
action.

**Protected route**
: A path only an authenticated account may open. An anonymous visitor on one is sent to the
login route with their original destination preserved, so signing in returns them to where
they were going. The member area is protected by prefix; checkout and its outcomes are
listed explicitly.

**Auth route**
: A path that exists to authenticate — login and the sign-up screens. The mirror of a
protected route: an _authenticated_ visitor on one is sent to their dashboard, because a
form for something already done is not worth showing.

**Guest**
: An account type the session carries and the guards refuse, treating it as anonymous on a
protected route. No guest session is ever created by this application. The type is honoured
because the API can issue one, not because anything here produces one.
