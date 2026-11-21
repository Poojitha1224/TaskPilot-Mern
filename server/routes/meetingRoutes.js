
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createMeeting,
    getMeetings
} = require("../controllers/meetingController");

// Create a meeting
router.post("/", authMiddleware, createMeeting);

// Get meetings for a board
router.get("/:boardId", authMiddleware, getMeetings);

module.exports = router;
