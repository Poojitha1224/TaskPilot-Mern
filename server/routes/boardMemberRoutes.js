
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getBoardMembers,
    updateMemberRole,
    removeBoardMember
} = require("../controllers/boardMemberController");
router.get("/:boardId/members", authMiddleware, getBoardMembers);
router.put("/:boardId/members/:memberId", authMiddleware, updateMemberRole);
router.delete("/:boardId/members/:memberId", authMiddleware, removeBoardMember);
module.exports = router;
