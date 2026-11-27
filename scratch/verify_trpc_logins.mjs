import path from "node:path";

async function verifyTrpcLogins() {
  const { appRouter } = await import("../server/routers.ts");
  const db = await import("../server/db.ts");

  let setCookieVal = null;
  const mockReq = {
    headers: { "user-agent": "NodeTestClient/1.0" },
    cookies: {},
    protocol: "http",
    get: (h) => (h === "host" ? "localhost:3000" : null),
  };
  const mockRes = {
    cookie: (name, val, opts) => {
      setCookieVal = { name, val, opts };
    },
    clearCookie: () => {},
  };

  const caller = appRouter.createCaller({
    req: mockReq,
    res: mockRes,
    user: null,
  });

  console.log("--- 1. Testing Admin Login ---");
  const adminRes = await caller.auth.adminLogin({
    email: "admin@trinayaa.in",
    password: "Admin@Trinayaa2026!",
  });
  console.log("Admin Login Success:", adminRes.user);

  console.log("--- 2. Testing Retail Login with retail@trinayaa.in ---");
  const retailRes = await caller.auth.retailLogin({
    email: "retail@trinayaa.in",
    password: "Retail@Trinayaa2026!",
  });
  console.log("Retail Login Success:", retailRes.user);

  console.log("--- 3. Testing Retail Login with retail.erode@trinayaa.in ---");
  const retailAliasRes = await caller.auth.retailLogin({
    email: "retail.erode@trinayaa.in",
    password: "Retail@Trinayaa2026!",
  });
  console.log("Retail Alias Login Success:", retailAliasRes.user);

  console.log("--- 4. Testing Super Admin access at retailLogin ---");
  const superAdminRetailRes = await caller.auth.retailLogin({
    email: "admin@trinayaa.in",
    password: "Admin@Trinayaa2026!",
  });
  console.log("Super Admin Retail Login Success:", superAdminRetailRes.user);

  console.log("\nALL TRPC LOGIN PROCEDURES PASSED WITH 100% SUCCESS!");
}

verifyTrpcLogins().catch(console.error);

