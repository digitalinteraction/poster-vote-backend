# PosterVote API Documentation

This is the guide for using the PosterVote api.

> These examples use the [httpie cli](https://httpie.org/)

<!-- toc-head -->
<!-- toc-tail -->

## Api envelope

All responses from the API are either JSON payloads or a http redirect.
All json bodies are wrapped in a meta/data envelope to ensure a consistent message.

Here is an example of the structure,
the `meta` part contains information about the request
and the `data` part is the payload you requested.

```json
{
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  },
  "data": "Hello, World!"
}
```

> For more information see [robb-j/chowchow-json-envelope](https://github.com/robb-j/chowchow-json-envelope)

## Authorization

To authorize a request, the API looks in three places:

- A `?token=<token>` querystring parameter
- A cookie named `postervote_jwt`
- An authorisation header like: `Authorization: bearer <token>`

The value of each method should be a token acquired when you authenticate yourself.

## Authentication

The API use email-based authentication to confirm you are a human.

#### auth.email.request

> `GET https://api.postervote.openlab.ncl.ac.uk/auth/email/request`

| Param | Description                                 |
| ----- | ------------------------------------------- |
| email | The email address to authenticate with      |
| mode  | How you want to receive your authentication |

**Authentication modes**

An authentication email is send to `email` with a link for them to click.
The `mode` passed determines what happens next.

Passing `cookie` will redirect the user to the web app,
`https://postervote.openlab.ncl.ac.uk`,
with the `postervote_jwt` cookie set.

Passing `redir` means the user is redirected back to the web app,
`https://postervote.openlab.ncl.ac.uk`,
with query parameter set: `?token=<new_token>`.
This is for single-page-apps which can processes their params in their own way.

Passing `token` redirects the user to a JSON endpoint which has the token in it.
This is only really useful for development.

> For more information see [robb-j/chowchow-auth](https://github.com/robb-j/chowchow-auth/#authentication-modes)

#### auth.email.check

> `GET https://api.postervote.openlab.ncl.ac.uk/auth/email/check`

This is the handler endpoint for `auth.email.request`,
which is where users are send from their email link
and then forwarded on depending on their `mode`.

#### auth.me

> `GET https://api.postervote.openlab.ncl.ac.uk/auth/me`

This endpoint gets the currently authenticated user or returns null.
