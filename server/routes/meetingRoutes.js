
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createMeeting,
    getMeetings
} = require("../controllers/meetingController");

const {
    googleAuth,
    googleCallback
} = require("../controllers/googleOAuthController");

// Google OAuth routes
router.get("/google/auth", authMiddleware, googleAuth);
router.get("/google/callback", googleCallback);

// Meeting routes
router.post("/", authMiddleware, createMeeting);
router.get("/:boardId", authMiddleware, getMeetings);

module.exports = router;
