# koa-authorize-actions
A simple koa v2 middleware.

## ctx.user

This library depends on your application setting `ctx.user`.

Your ctx.user should have a property name `allowedActions`. This should be an array of actions to permit.

```js
var Koa = require("koa");
var { enforcePermissions } = require("koa-authorize-actions");
var app = new Koa();

app.use( ctx => {
  // determine what actions a user by querying a database instead.
  ctx.user.allowActions = ["read/*", "write/*"]
})

app.use( enforcePermissions( "read/api", ctx => {

}) )

```
