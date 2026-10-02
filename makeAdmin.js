require("dotenv").config();
const prisma = require("./src/db/prisma"); 

(async () => {
  try {
    const user = await prisma.user.update({
      where: { email: "admintest09@gmail.com" }, 
      data: { role: "ADMIN" },
    });
    console.log("Done:", user);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
})();