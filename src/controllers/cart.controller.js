const prisma = require("../db/prisma");
const { addToCartSchema, updateCartSchema } = require("../validators/cart.schema");

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = addToCartSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { productId, quantity } = result.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // cart mein pehle se jitni quantity hai, wo bhi count karo
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    const newQuantity = (existing ? existing.quantity : 0) + quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} in stock`,
      });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: newQuantity },
      create: { userId, productId, quantity },
      include: { product: true },
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "desc" },
    });

    const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

    return res.json({ items, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const result = updateCartSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { quantity } = result.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} in stock` });
    }

    const item = await prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: true },
    });

    return res.json(item);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Item not in cart" });
    }
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const { count } = await prisma.cartItem.deleteMany({
      where: { userId, productId },
    });
    if (count === 0) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { addToCart, getCart, updateCartItem, removeCartItem };