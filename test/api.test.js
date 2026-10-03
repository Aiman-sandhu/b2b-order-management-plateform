require("dotenv").config({ quiet: true });
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/db/prisma");

jest.setTimeout(30000);

const stamp = Date.now();
const customer = { email: `cust${stamp}@test.com`, password: "12345678" };
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

let token, adminToken, productId, customerId;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = res.body.token;

  const p = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Test Item", price: 10, stock: 5 });
  productId = p.body.id;
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth", () => {
  test("register creates a CUSTOMER", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...customer, role: "ADMIN" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("CUSTOMER");
    customerId = res.body.id;
  });

  test("duplicate email returns 409", async () => {
    const res = await request(app).post("/api/auth/register").send(customer);
    expect(res.status).toBe(409);
  });

  test("wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ ...customer, password: "wrongwrong" });
    expect(res.status).toBe(401);
  });

  test("login returns a token", async () => {
    const res = await request(app).post("/api/auth/login").send(customer);
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeDefined();
  });
});

describe("Roles", () => {
  test("customer cannot create product (403)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "x", price: 1, stock: 1 });
    expect(res.status).toBe(403);
  });

  test("no token returns 401", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });
});

describe("Cart and orders", () => {
  beforeAll(async () => {
    // cart saaf karo (agar pehle se khali ho to 404, theek hai)
    await request(app)
      .delete(`/api/cart/${productId}`)
      .set("Authorization", `Bearer ${token}`);
  }, 30000);

  test("cannot add more than stock", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 99 });
    expect(res.status).toBe(400);
  });

  test("empty cart order returns 400", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test("order succeeds, reduces stock, creates invoice", async () => {
    const add = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 2 });
    expect(add.status).toBe(201);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.invoice.number).toMatch(/^INV-/);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product.stock).toBe(3);
  });

  test("rollback: failed order leaves stock unchanged", async () => {
    const add = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 3 });
    expect(add.status).toBe(201);

    // stock 1 kar do, cart mein qty 3 hai
    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stock: 1 });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product.stock).toBe(1);
  });
});

describe("Order status", () => {
  test("invalid transition returns 400", async () => {
    // is customer ka apna order (jo "order succeeds" test ne banaya)
    const order = await prisma.order.findFirst({
      where: { userId: customerId },
      orderBy: { id: "desc" },
    });
    expect(order).not.toBeNull();

    // kisi bhi status se PENDING par wapas jana allowed nahi
    const res = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PENDING" });
    expect(res.status).toBe(400);
  });
});