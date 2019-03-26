# PosterVote API Documentation

This is the guide for using the PosterVote api.

> Example requests are shown using the [httpie](https://httpie.org/doc) cli.
> Where `$TOKEN` is your authentication token and `$URL` is the api url.

<!-- toc-head -->

## Table of Contents

- [Api envelope](#api-envelope)
- [Authorization](#authorization)
- [Authentication](#authentication)
  - [auth.email.request](#auth.email.request)
  - [auth.email.check](#auth.email.check)
  - [auth.me](#auth.me)
  - [auth.logout](#auth.logout)
- [Poster Management](#poster-management)
  - [posters.index](#posters.index)
  - [posters.show](#posters.show)
  - [posters.create](#posters.create)
  - [posters.update](#posters.update)
  - [posters.destroy](#posters.destroy)
  - [posters.votes](#posters.votes)
  - [posters.print](#posters.print)

<!-- toc-tail -->

## Api envelope

All requests expect bodies to be a JSON string.

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

### auth.email.request

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

### auth.email.check

> `GET https://api.postervote.openlab.ncl.ac.uk/auth/email/check`

This is the handler endpoint for `auth.email.request`,
which is where users are send from their email link
and then forwarded on depending on their `mode`.

### auth.me

> `GET https://api.postervote.openlab.ncl.ac.uk/auth/me`

This endpoint gets the currently authenticated user or returns null.

### auth.logout

> `POST https://api.postervote.openlab.ncl.ac.uk/auth/logout`

Logs out the current user by expiring their cookie.

---

## Poster Management

These endpoints are for creating, retrieving, updating and deleting posters.

### posters.index

`GET https://api.postervote.openlab.ncl.ac.uk/posters`

Retrieve the posters that the current user is the owner of.
Returning an array of posters.

```bash
# An example with httpie
http $URL/posters
```

<details>

<summary> Example response </summary>

```json
{
  "data": [
    {
      "active": 1,
      "code": 698702,
      "colour": "aae048",
      "contact": "geoff@r0b.io",
      "created_at": "2018-11-20T13:22:25.000Z",
      "creator_hash": "IdP/Ucbx9MzfvqPPUjjcDcnb2e3iTZJm3fkGOKREr6w=",
      "id": 2,
      "name": "Lunch",
      "owner": "Geoff Testington",
      "pdf_url": "http://localhost:3000/posters/2/print.pdf",
      "question": "What did you have for lunch today??",
      "updated_at": "2018-11-20T13:22:25.000Z"
    }
  ],
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  }
}
```

</details>

### posters.show

`GET https://api.postervote.openlab.ncl.ac.uk/posters/:id`

Fetch a specific poster using its id.
This also populates the poster's options, nested inside the poster resource.

```bash
# An example with httpie
http $URL/posters/1
```

<details>

<summary> Example response </summary>

```json
{
  "data": {
    "active": 1,
    "code": 698702,
    "colour": "aae048",
    "contact": "geoff@r0b.io",
    "created_at": "2018-11-20T13:22:25.000Z",
    "creator_hash": "IdP/Ucbx9MzfvqPPUjjcDcnb2e3iTZJm3fkGOKREr6w=",
    "id": 2,
    "name": "Lunch",
    "options": [
      {
        "created_at": "2018-11-20T13:22:25.000Z",
        "id": 6,
        "poster_id": 2,
        "text": "Chicken",
        "updated_at": "2018-11-20T13:22:25.000Z",
        "value": 1
      },
      {
        "created_at": "2018-11-20T13:22:25.000Z",
        "id": 7,
        "poster_id": 2,
        "text": "Beef",
        "updated_at": "2018-11-20T13:22:25.000Z",
        "value": 2
      },
      {
        "created_at": "2018-11-20T13:22:25.000Z",
        "id": 8,
        "poster_id": 2,
        "text": "Sausages",
        "updated_at": "2018-11-20T13:22:25.000Z",
        "value": 3
      },
      {
        "created_at": "2018-11-20T13:22:25.000Z",
        "id": 9,
        "poster_id": 2,
        "text": "Soup",
        "updated_at": "2018-11-20T13:22:25.000Z",
        "value": 4
      },
      {
        "created_at": "2018-11-20T13:22:25.000Z",
        "id": 10,
        "poster_id": 2,
        "text": "",
        "updated_at": "2018-11-20T13:22:25.000Z",
        "value": 5
      }
    ],
    "owner": "Geoff Testington",
    "pdf_url": "http://localhost:3000/posters/2/print.pdf",
    "question": "What did you have for lunch today??",
    "updated_at": "2018-11-20T13:22:25.000Z"
  },
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  }
}
```

</details>

### posters.create

`POST https://api.postervote.openlab.ncl.ac.uk/posters`

Create a new poster using the specified parameters.

| Param    | Description                                                    |
| -------- | -------------------------------------------------------------- |
| name     | The internal name of the poster, just for the creator          |
| question | The public question that represents the poster                 |
| options  | The options to pick from, an array of strings                  |
| owner    | **optional** - A friendly name for who made the poster         |
| contact  | **optional** - Someone who can be contacted about the poster   |
| colour   | **optional** - A 6 letter hex string to colour the poster with |

```bash
# An example with httpie
http post $URL/posters token==$TOKEN \
  name="Favorite pie" \
  question="What is your favorite pie?" \
  options:='["beef","chicken","pizza"]'
```

<details>

<summary> Example response </summary>

```json
{
  "data": {
    "active": 1,
    "code": 16193,
    "colour": "7E7F9A",
    "contact": null,
    "created_at": "2019-03-26T10:16:59.000Z",
    "creator_hash": "IdP/Ucbx9MzfvqPPUjjcDcnb2e3iTZJm3fkGOKREr6w=",
    "id": 5,
    "name": "Favorite pie",
    "options": [
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 21,
        "poster_id": 5,
        "text": "beef",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 1
      },
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 22,
        "poster_id": 5,
        "text": "chicken",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 2
      },
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 23,
        "poster_id": 5,
        "text": "pizza",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 3
      }
    ],
    "owner": null,
    "pdf_url": "http://localhost:3000/posters/5/print.pdf",
    "question": "What is your favorite pie?",
    "updated_at": "2019-03-26T10:16:59.000Z"
  },
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  }
}
```

</details>

### posters.update

`PUT https://api.postervote.openlab.ncl.ac.uk/posters/:id`

Update all or part of a specific poster.
You can update any of the fields from [posters.create](#posters.create).
Updated values are optional so you only need to pass what you want to change.

**Updating poster options**

To update a posters options you should pass `options` which should be an array of update objects, see below.

> Where `value` is the value of the option to update and `text` is the new option.

```json
{
  "options": [{ "value": 1, "text": "New option text" }]
}
```

```bash
# An example with httpie
http put $URL/posters/5 token==$TOKEN name="Pie poll"
```

<details>

<summary> Example response </summary>

```json
{
  "data": {
    "active": 1,
    "code": 16193,
    "colour": "7E7F9A",
    "contact": null,
    "created_at": "2019-03-26T10:16:59.000Z",
    "creator_hash": "IdP/Ucbx9MzfvqPPUjjcDcnb2e3iTZJm3fkGOKREr6w=",
    "id": 5,
    "name": "Pie poll",
    "options": [
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 21,
        "poster_id": 5,
        "text": "beef",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 1
      },
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 22,
        "poster_id": 5,
        "text": "chicken",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 2
      },
      {
        "created_at": "2019-03-26T10:16:59.000Z",
        "id": 23,
        "poster_id": 5,
        "text": "pizza",
        "updated_at": "2019-03-26T10:16:59.000Z",
        "value": 3
      }
    ],
    "owner": null,
    "question": "What is your favorite pie?",
    "updated_at": "2019-03-26T10:16:59.000Z"
  },
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  }
}
```

</details>

### posters.destroy

`DELETE https://api.postervote.openlab.ncl.ac.uk/posters/:id`

Soft deletes a poster, keeping the record but setting `active` to false.
All other queries respect this and filter on `active=true`.

### posters.votes

`GET https://api.postervote.openlab.ncl.ac.uk/posters/:id/votes`

Get the votes that have been submitted to a poster through the IVR endpoints.

```bash
# An example with httpie
http $URL/posters/2/votes
```

<details>

<summary> Example response </summary>

```json
{
  "data": {
    "lastUpdate": "2018-11-21T15:37:42.000Z",
    "votes": [
      {
        "option_id": 6,
        "vote": 0
      },
      {
        "option_id": 7,
        "vote": 3
      },
      {
        "option_id": 8,
        "vote": 2
      },
      {
        "option_id": 9,
        "vote": 2
      },
      {
        "option_id": 10,
        "vote": 1
      }
    ]
  },
  "meta": {
    "messages": [],
    "name": "posternode",
    "status": 200,
    "success": true,
    "version": "1.4.0"
  }
}
```

</details>

### posters.print

`GET https://api.postervote.openlab.ncl.ac.uk/posters/:id/print.pdf`

Generate a pdf to print a poster.
