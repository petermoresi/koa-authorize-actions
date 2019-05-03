import * as test from "tape-async";
import { enforcePermissions, isActionAllowed } from "./lib/index";
import log from "roarr";

function isFunction(o) {
  return o instanceof Function;
}

function createContext({ includeUser = false, includeAllowedActions = false }) {
  let ctx = {
    request: {
      url: "/"
    },
    body: null,
    user: null,
    status: null,
    assert: (cond, status, msg) => {
      if (!cond) {
        var e = new Error(msg);
        ctx.status = status;
        throw e;
      }
    },
    log: log.child(),
    throw: (number, message) => {
      ctx.status = number;
      throw new Error(message);
    }
  };
  if (includeUser) {
    ctx.user = {
      allowedActions: []
    };
  }

  if (includeAllowedActions) {
    ctx.user.allowedActions = ["*"];
  }
  return ctx;
}

test("Ensure functions being called exist", t => {
  t.plan(2);
  t.assert(
    isFunction(enforcePermissions),
    "enforcePermissions should be a function"
  );
  t.assert(isFunction(isActionAllowed), "isAllowed should be a function");
});

test("Testing passed values exist", t => {
  t.plan(6);
  t.throws(
    () => isActionAllowed(null, null),
    /action must have a value/,
    "Should throw empty message"
  );
  t.throws(
    () => isActionAllowed(null, null),
    /action must have a value/,
    "Should throw empty message"
  );
  t.throws(
    () => isActionAllowed(null, []),
    /action must have a value/,
    "Should throw empty message"
  );
  t.equals(isActionAllowed("foo", undefined), false);
  t.equals(isActionAllowed("foo", null), false);
  t.equals(isActionAllowed("foo", []), false);
});

test("Testing return is correct", t => {
  t.plan(6);
  t.ok(isActionAllowed("view/user", ["*"]), "Should return true");
  t.ok(isActionAllowed("view/user", ["view/*"]), "Should return true");
  t.ok(isActionAllowed("view/user/profile", ["view/**"]), "Should return true");
  t.notOk(
    isActionAllowed("view/user/profile", ["read/**"]),
    "Should return false"
  );
  t.notOk(isActionAllowed("view/user/profile", []), "Should return false");
  t.notOk(
    isActionAllowed("view/user/profile", ["read/**"]),
    "Should return false"
  );
});

test("Testing enforcePermissions", async t => {
  t.plan(3);
  let ctx = createContext({});
  t.assert(
    typeof enforcePermissions === "function",
    "enforcePermissions should return a function"
  );
  const enforcePermissionsConst = enforcePermissions(
    "read/table/roles",
    ctx => {
      var t = {
        code: "sysadmin",
        name: "Super User"
      };

      if (!t) {
        ctx.body = { error: "No table found" };
        return;
      }
      ctx.body = t;
    }
  );

  //await enforcePermissionsConst(ctx, async () => {});
  //   t.equal(lastRedirect, "/connect/google?returnTo=/");

  ctx = createContext({ includeUser: true });

  try {
    let result = await enforcePermissionsConst(ctx, async () => {});
  } catch (e) {
    t.equal(e.message, "Action is not allowed!");
  }

  ctx = createContext({ includeUser: true, includeAllowedActions: true });

  try {
    await enforcePermissionsConst(ctx, async () => {});
    t.ok(null !== ctx.body);
  } catch (e) {
    t.equal(e.message, "Action is not allowed!");
  }
});

test("Testing enforcePermissions with a function action", async t => {
  t.plan(1);
  let ctx = createContext({ includeUser: true, includeAllowedActions: true });

  let tables = "roles";
  const enforcePermissionsConst = enforcePermissions(
    tables => `/read/tables/${tables}`,
    ctx => {
      var t = {
        code: "sysadmin",
        name: "Super User"
      };

      if (!t) {
        ctx.body = { error: "No table found" };
        return;
      }
      ctx.body = t;
    }
  );

  try {
    await enforcePermissionsConst(ctx, async () => {});
    t.ok(true);
  } catch (e) {}
});
