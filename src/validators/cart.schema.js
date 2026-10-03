const { z } = require("zod");

const addToCartSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1),
});

module.exports = { addToCartSchema, updateCartSchema };