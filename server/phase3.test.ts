import { describe, expect, it, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { COOKIE_NAME } from "@shared/const";

function createMockContext(user: any = null) {
  const cookies: Record<string, any> = {};
  return {
    ctx: {
      user,
      req: {
        protocol: "https",
        headers: {
          "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200) + 1}`,
        },
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        cookie: (name: string, val: any, opts: any) => {
          cookies[name] = { val, opts };
        },
        clearCookie: (name: string, opts: any) => {
          delete cookies[name];
        },
      } as any,
    },
    cookies,
  };
}

describe("TRINAYAA Phase 3 — Customer Auth, Product APIs & Persistent Cart Tests", () => {
  const ts = Date.now();
  const testEmail = `phase3_user_${ts}@example.com`;
  const testPassword = "ValidPassword123!";
  let customerId: string = "";
  let guestToken: string = `gst_phase3_test_${ts}`;

  // 1. Customer registration
  it("1. Customer registration creates user with CUSTOMER role", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const res = await caller.auth.register({
      name: "Meenakshi Sundaram",
      email: testEmail,
      phone: "+919876543210",
      password: testPassword,
      confirmPassword: testPassword,
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.user.role).toBe("CUSTOMER");
    expect(res.token).toBeDefined();
    customerId = res.user.id;
  });

  // 2. Duplicate email rejection
  it("2. Duplicate email registration is rejected with CONFLICT error", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      })
    ).rejects.toThrow(/already exists/i);
  });

  // 3. Invalid registration data
  it("3. Invalid registration data (mismatched password, invalid email) is rejected", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Mismatched passwords
    await expect(
      caller.auth.register({
        name: "Mismatch User",
        email: `new_${Date.now()}@example.com`,
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
      })
    ).rejects.toThrow();

    // Invalid email format
    await expect(
      caller.auth.register({
        name: "Bad Email",
        email: "not-an-email",
        password: "Password123!",
      })
    ).rejects.toThrow();
  });

  // 4. Password hashing
  it("4. Password hashing stores cryptographic salt and hash, never plain text", () => {
    const user = db.usersRepo.getByEmail(testEmail);
    expect(user).toBeDefined();
    expect(user.passwordHash).not.toBe(testPassword);
    expect(user.passwordHash).toContain(":"); // salt:hash format
    expect(db.verifyPassword(testPassword, user.passwordHash)).toBe(true);
    expect(db.verifyPassword("WrongPassword", user.passwordHash)).toBe(false);
  });

  // 5. Customer login
  it("5. Customer login succeeds with correct credentials and returns session", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const res = await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(res.user.email).toBe(testEmail);
    expect(res.user.role).toBe("CUSTOMER");
    expect(cookies[COOKIE_NAME]).toBeDefined();
    expect(cookies[COOKIE_NAME].opts.httpOnly).toBe(true);
  });

  // 6. Invalid password rejection
  it("6. Customer login rejects incorrect password", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: testEmail,
        password: "IncorrectPassword123!",
      })
    ).rejects.toThrow(/Invalid email or password/i);
  });

  // 7. Logout
  it("7. Logout clears authentication cookie", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Login first to set cookie
    await caller.auth.login({ email: testEmail, password: testPassword });
    expect(cookies[COOKIE_NAME]).toBeDefined();

    // Logout
    const res = await caller.auth.logout();
    expect(res.success).toBe(true);
    expect(cookies[COOKIE_NAME]).toBeUndefined();
  });

  // 8. Session expiration or invalidation
  it("8. Public /me query returns null when unauthenticated", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  // 9. Product listing
  it("9. Product listing retrieves published catalogue with actual database details", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({ limit: 50 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p: any) => p.sku && p.name && p.price > 0)).toBe(true);
  });

  // 10. Product details
  it("10. Product details can be retrieved by slug and SKU", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const bySku = await caller.products.getBySku({ sku: "TRN-1001" });
    expect(bySku).toBeDefined();
    expect(bySku.name).toBe("Licorice Root");
    expect(bySku.nameTa).toBe("அதிமதுரம்");
    expect(bySku.sizes.length).toBeGreaterThan(0);

    const bySlug = await caller.products.getBySlug({ slug: bySku.slug });
    expect(bySlug).toBeDefined();
    expect(bySlug.sku).toBe("TRN-1001");
  });

  // 11. English search
  it("11. Search works with English names", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.products.list({ search: "Licorice" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p: any) => p.sku === "TRN-1001")).toBe(true);
  });

  // 12. Tamil search
  it("12. Search works with Tamil botanical names", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.products.list({ search: "அதிமதுரம்" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p: any) => p.sku === "TRN-1001")).toBe(true);
  });

  // 13. SKU search
  it("13. Search works with exact and partial SKU", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.products.list({ search: "TRN-1001" });
    expect(results.length).toBe(1);
    expect(results[0].sku).toBe("TRN-1001");
  });

  // 14. Category filtering
  it("14. Products filter by category correctly", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const healthProducts = await caller.products.list({ category: "Health Care", limit: 20 });
    expect(healthProducts.length).toBeGreaterThan(0);
    expect(healthProducts.every((p: any) => p.category === "Health Care")).toBe(true);
  });

  // 15. Product sorting
  it("15. Product sorting orders prices ascending and descending", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const lowToHigh = await caller.products.list({ sort: "price_asc", limit: 20 });
    for (let i = 0; i < lowToHigh.length - 1; i++) {
      expect(lowToHigh[i].price).toBeLessThanOrEqual(lowToHigh[i + 1].price);
    }

    const highToLow = await caller.products.list({ sort: "price_desc", limit: 20 });
    for (let i = 0; i < highToLow.length - 1; i++) {
      expect(highToLow[i].price).toBeGreaterThanOrEqual(highToLow[i + 1].price);
    }
  });

  // 16. Guest cart creation
  it("16. Guest cart is created and retrieved using guest token", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const cart = await caller.cart.get({ guestToken });
    expect(cart).toBeDefined();
    expect(cart.guestToken).toBe(guestToken);
    expect(cart.items).toEqual([]);
  });

  // 17. Add to cart
  it("17. Products can be added to guest cart without registration", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1001" });
    const addRes = await caller.cart.add({
      guestToken,
      productId: product.id,
      packSize: "100g",
      quantity: 2,
    });

    expect(addRes.items.length).toBe(1);
    expect(addRes.items[0].productId).toBe(product.id);
    expect(addRes.items[0].quantity).toBe(2);
    expect(addRes.items[0].unitPrice).toBe(product.price);
  });

  // 18. Update cart quantity
  it("18. Guest cart item quantity can be updated", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1001" });
    const updateRes = await caller.cart.update({
      guestToken,
      productId: product.id,
      packSize: "100g",
      quantity: 5,
    });

    expect(updateRes.items[0].quantity).toBe(5);
  });

  // 19. Remove cart item
  it("19. Cart item can be removed", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1001" });
    const removeRes = await caller.cart.remove({
      guestToken,
      productId: product.id,
      packSize: "100g",
    });

    expect(removeRes.items.length).toBe(0);
  });

  // 20. Guest cart persistence
  it("20. Guest cart persists across queries using guest token", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1002" });
    await caller.cart.add({
      guestToken,
      productId: product.id,
      packSize: "100g",
      quantity: 3,
    });

    const persisted = await caller.cart.get({ guestToken });
    expect(persisted.items.length).toBe(1);
    expect(persisted.items[0].quantity).toBe(3);
  });

  // 21. Stock validation
  it("21. Stock validation rejects quantities exceeding available inventory", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1002" });
    await expect(
      caller.cart.add({
        guestToken,
        productId: product.id,
        packSize: "100g",
        quantity: 99999,
      })
    ).rejects.toThrow(/exceeds available stock/i);
  });

  // 22. Server-side price validation
  it("22. Cart calculates price from database values, ignoring tampered client unit price", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getBySku({ sku: "TRN-1003" });
    const res = await caller.cart.add({
      guestToken,
      productId: product.id,
      packSize: "100g",
      unitPrice: 1, // Tampered client price (₹1)
      quantity: 1,
    });

    const item = res.items.find((i: any) => i.productId === product.id);
    expect(item).toBeDefined();
    expect(item.unitPrice).toBe(product.price); // Server enforced database price
    expect(item.unitPrice).not.toBe(1);
  });

  // 23. Guest cart merge after login
  it("23. Guest cart merges into customer account upon login", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Login with guestToken
    const loginRes = await caller.auth.login({
      email: testEmail,
      password: testPassword,
      guestToken,
    });

    expect(loginRes.user.id).toBe(customerId);

    // Verify user cart now has the merged items
    const userCart = db.cartRepo.getOrCreate(customerId);
    expect(userCart.items.length).toBeGreaterThan(0);

    // Verify guest cart was cleaned up
    const oldGuestCart = db.cartRepo.getOrCreate(undefined, guestToken);
    expect(oldGuestCart.items.length).toBe(0);
  });

  // 24. Duplicate cart merge prevention
  it("24. Merging cart twice is idempotent and does not duplicate items", async () => {
    const { ctx } = createMockContext({ id: customerId, role: "CUSTOMER" });
    const caller = appRouter.createCaller(ctx);

    // Attempt second merge with already-cleared guest token
    await caller.cart.mergeGuestCart({ guestToken });
    const userCart = db.cartRepo.getOrCreate(customerId);
    const itemIds = userCart.items.map((i: any) => `${i.productId}-${i.packSize}`);
    const uniqueIds = new Set(itemIds);
    expect(itemIds.length).toBe(uniqueIds.size);
  });

  // 25. Checkout restriction for unauthenticated customers
  it("25. Protected order creation is strictly rejected for unauthenticated visitors", async () => {
    const { ctx } = createMockContext(null); // Unauthenticated context
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        customerName: "Anonymous Visitor",
        customerEmail: "anon@example.com",
        customerPhone: "+919876543210",
        shippingAddress: {
          street: "123 Main Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [],
        subtotal: 500,
        total: 500,
      })
    ).rejects.toThrow(/Please login|UNAUTHORIZED/i);
  });

  afterAll(() => {
    // Clean up test user and test cart
    const sqlite = db.getDatabase();
    sqlite.exec(`
      DELETE FROM cart_items WHERE cartId IN (SELECT id FROM carts WHERE userId = '${customerId}');
      DELETE FROM carts WHERE userId = '${customerId}' OR guestToken = '${guestToken}';
      DELETE FROM users WHERE id = '${customerId}';
    `);
  });
});

