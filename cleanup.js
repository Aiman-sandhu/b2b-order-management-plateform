require("dotenv").config({ quiet: true });
const prisma = require("./src/db/prisma");

(async () => {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@test.com" } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const orders = await prisma.order.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  const products = await prisma.product.findMany({
    where: { name: "Test Item" },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  await prisma.invoice.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderItem.deleteMany({
    where: { OR: [{ orderId: { in: orderIds } }, { productId: { in: productIds } }] },
  });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.cartItem.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { productId: { in: productIds } }] },
  });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log("Deleted:", { users: userIds.length, orders: orderIds.length, products: productIds.length });
  await prisma.$disconnect();
})();