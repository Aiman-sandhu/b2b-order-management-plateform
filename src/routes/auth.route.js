const express = require("express");
const {register, login} = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const router = express.Router();

router.get("/me", authenticate,(req,res)=> res.json(req.user));


router.get("/admin-test", authenticate, authorize("ADMIN"),(req,res)=>{
    res.json({ok:true})
})
router.post("/register", register)
router.post("/login", login);



module.exports = router;







