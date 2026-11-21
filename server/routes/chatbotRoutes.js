
const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../controllers/chatbotController");

// AI chatbot endpoint
router.post("/chat", chatWithAI);

module.exports = router;
