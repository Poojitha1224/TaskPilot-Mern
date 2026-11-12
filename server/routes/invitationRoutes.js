const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    sendInvitation,
    getInvitations,
    acceptInvitation,
    declineInvitation
} = require("../controllers/invitationController");
router.post("/boards/:boardId/invitations", authMiddleware, sendInvitation);
router.get("/invitations", authMiddleware, getInvitations);
router.put("/invitations/:id/accept", authMiddleware, acceptInvitation);
router.put("/invitations/:id/decline", authMiddleware, declineInvitation);
module.exports = router;