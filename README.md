# koa-authorize-actions
A simple koa v2 middleware.

## ctx.user

This library depends on your application setting `ctx.user`.

Your ctx.user should have a property name `allowedActions`. This should be an array of actions to permit.

```js
ctx.user.allowActions = ["*"]
```


```js
ctx.user.allowActions = ["read/*", "write/*"]
```
