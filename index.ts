/**
 * Check if given action is in the path of the given action pattern
 * @param action Action to check
 * @param allowActions List of action patterns to check against
 */
export function isActionAllowed(
  action: string,
  allowActions: Array<string>
): boolean {
  if (action == null) throw "action must have a value";
  if (allowActions == null) return false;
  if (allowActions.length === 0) return false;
  var actionParts = action.split("/");

  for (var index in allowActions) {
    let item = allowActions[index];
    var itemParts = item.split("/");
    let result = true;
    for (var partIndex in itemParts) {
      if (
        itemParts[partIndex] === actionParts[index] ||
        "*" === itemParts[partIndex] ||
        "**" === itemParts[partIndex]
      ) {
        result = true;
        break;
      }
      if (itemParts[partIndex] !== actionParts[index]) {
        result = false;
        break;
      }
    }

    // did we find a completely true result?
    if (result) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a protected middleware.
 * @param action The action to enforce.
 * @param middleware The middleware to protect.
 */
export function enforcePermissions(
  action: string | Function,
  middleware: Function
): Function {
  return async (ctx, next) => {
    const { params, user } = ctx;
    let actionToCheck;

    if (action instanceof Function) {
      actionToCheck = action(ctx);
    } else {
      actionToCheck = action;
    }

    ctx.assert(user, 500, "ctx.user is not defined");

    const { allowActions = [] } = user;

    const user_id = user.id;
    ctx.log.debug(
      { user: ctx.user, actionToCheck, allowActions },
      "enforce permission"
    );

    let isAllowed = isActionAllowed(actionToCheck, allowActions);

    ctx.log.trace({ user_id, action, isAllowed }, "action allowed?");

    ctx.assert(isAllowed, 401, "Action is not allowed!");

    await middleware(ctx, next);
  };
}
