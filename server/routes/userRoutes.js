
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
router.get("/me", authMiddleware, (req, res) => {
    res.status(200).json({
        msg: "User authenticated successfully",
        user: req.user
    });
});
module.exports = router;
