const prisma = require("../db/prisma");
const { productSchema, updateProductSchema } = require("../validators/product.schema");
const logAudit = require("../utils/audit");

const createProduct = async (req, res) => {
  try {
    const result = productSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const product = await prisma.product.create({ data: result.data });
    await logAudit({ userId: req.user.id, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id });
    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: "desc" } });
    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const result = updateProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors,
      });
    }

       const product = await prisma.product.update({
      where: { id },
      data: result.data,
    });
    await logAudit({ userId: req.user.id, action: "PRODUCT_UPDATED", entity: "Product", entityId: id, meta: result.data });
    return res.json(product);
   
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    await prisma.product.delete({ where: { id } });
    await logAudit({ userId: req.user.id, action: "PRODUCT_DELETED", entity: "Product", entityId: id });
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };