const z = require("zod");
const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});
// update ke liye: saari fields optional, lekin kam az kam ek honi chahiye
const updateProductSchema = productSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
module.exports = {productSchema, updateProductSchema};
