const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const boardRoutes = require("./routes/boardRoutes");
const taskRoutes = require("./routes/taskRoutes");
const boardMemberRoutes = require("./routes/boardMemberRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/boards", boardMemberRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", invitationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
    res.status(200).send("Task Pilot MERN Backend is Running!");
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("joinUser", (userId) => {
    const roomId = String(userId);
    socket.join(roomId);
    console.log("USER ROOM JOINED:", roomId);
    console.log("CURRENT SOCKET ROOMS:", [...socket.rooms]);
});
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5003;

const startServer = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log("Socket.IO server is running");
    });
};

startServer();