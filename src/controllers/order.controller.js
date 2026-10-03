const { Prisma } = require("@prisma/client");
const prisma = require("../db/prisma");
const logAudit = require("../utils/audit");

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const order = await prisma.$transaction(async (tx) => {
    
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { productId: "asc" }, 
      });

      if (cartItems.length === 0) {
        const err = new Error("Cart is empty");
        err.statusCode = 400;
        throw err;
      }

      // 2. guarded stock minus
      for (const item of cartItems) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          const err = new Error(`Insufficient stock for product ${item.productId}`);
          err.statusCode = 400;
          throw err; //  transaction rollback
        }
      }

      // 3. total (Decimal methods )
      let total = new Prisma.Decimal(0);
      for (const item of cartItems) {
        total = total.add(item.product.price.mul(item.quantity));
      }

      // 4. order + items
      const created = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      // 5. invoice
      await tx.invoice.create({
        data: {
          orderId: created.id,
          number: `INV-${String(created.id).padStart(6, "0")}`,
        },
      });

      // 6. cart empty
      await tx.cartItem.deleteMany({ where: { userId } });
const logAudit = require("../utils/audit");
      return tx.order.findUnique({
        where: { id: created.id },
        include: { items: true, invoice: true },
      });
    });

    return res.status(201).json(order);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
const VALID_TRANSITIONS = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, invoice: true, user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    if (!Object.keys(VALID_TRANSITIONS).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) {
        const err = new Error("Order not found");
        err.statusCode = 404;
        throw err;
      }

      if (!VALID_TRANSITIONS[order.status].includes(status)) {
        const err = new Error(`Cannot change ${order.status} to ${status}`);
        err.statusCode = 400;
        throw err;
      }

      // cancel hone par stock wapas
      if (status === "CANCELLED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const result = await tx.order.update({
        where: { id },
        data: { status },
      });

      await logAudit(
        {
          userId: req.user.id,
          action: "ORDER_STATUS_CHANGED",
          entity: "Order",
          entityId: id,
          meta: { from: order.status, to: status },
        },
        tx
      );

      return result;
    },{
    maxWait: 10000, // transaction shuru hone ka intezaar (ms)
    timeout: 15000, // transaction ke chalne ka max time (ms)
  })

    return res.json(updated);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(logs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, getAuditLogs };

