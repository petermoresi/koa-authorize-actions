  import mm from "micromatch";

/**
 * Check if given action is in the path of the given action pattern
 * @param action Action to check
 * @param allowedActions List of action patterns to check against
 */
export function isActionAllowed(
  action: string,
  allowedActions: Array<string>
): boolean {
  if (action == null) throw "action must have a value";
  if (allowedActions == null) return false;
  if (allowedActions.length === 0) return false;
  var actionParts = action.split("/");

  for (var index in allowedActions) {
    let item = allowedActions[index];
    var itemParts = item.split("/");
    let result;
    for (var partIndex in itemParts) {
      if (
        itemParts[partIndex] === actionParts[index] ||
        "*" === actionParts[index]
      ) {
        result = true;
        break;
      }
      if (itemParts[partIndex] !== actionParts[index]) result = false;
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

    const { allowedActions = [] } = user;

    const user_id = user.id;
    ctx.log.debug(
      { user: ctx.user, actionToCheck, allowedActions },
      "enforce permission"
    );

    let isAllowed = isActionAllowed(actionToCheck, allowedActions);

    ctx.log.trace({ user_id, action, isAllowed }, "action allowed?");

    ctx.assert(isAllowed, 401, "Action is not allowed!");

    await middleware(ctx, next);
  };
}
