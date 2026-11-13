const { createNotification } = require("./notificationController");
const Task = require("../models/Task");
const Board = require("../models/board");
const BoardMember = require("../models/BoardMember");
const Notification = require("../models/Notification");

const checkBoardAccess = async (boardId, userId) => {
    const board = await Board.findById(boardId);
    if (!board) return null;
    const isMember = await BoardMember.exists({
        boardId: boardId,
        userId: userId
    });
    if (!isMember && board.createdBy.toString() !== userId.toString()) {
        return false;
    }
    return board;
};

// CREATE TASK AND SEND NOTIFICATIONS
exports.createTask = async (req, res) => {
    try {
        const { title, description, status, boardId, dueDate } = req.body;
        if (!title || !title.trim() || !boardId) {
            return res.status(400).json({
                msg: "Task title and board ID are required"
            });
        }
        const boardAccess = await checkBoardAccess(boardId, req.user._id);
        if (!boardAccess) {
            return res.status(404).json({
                msg: "Board not found or access denied"
            });
        }
        const task = await Task.create({
            title: title.trim(),
            description: description || "",
            status: status || "todo",
            boardId,
            dueDate: dueDate || null,
            userId: req.user._id
        });
        const members = await BoardMember.find({
            boardId,
            userId: { $ne: req.user._id }
        });
        const notifications = await Promise.all(
            members.map(member => Notification.create({
                userId: member.userId,
                taskId: task._id,
                createdBy: req.user._id,
                boardId,
                message: `New task created: ${task.title}`
            }))
        );
        const io = req.app.get("io");
        if (io) {
            notifications.forEach(notification => {
    const roomId = String(notification.userId);
    console.log("SENDING NOTIFICATION TO ROOM:", roomId);
    io.to(roomId).emit("newNotification", notification);
});
        }
        res.status(201).json({
            msg: "Task created successfully",
            task,
            notificationsSent: notifications.length
        });
    } catch (error) {
        console.error("Create Task Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
// GET ALL TASKS IN A BOARD
exports.getBoardTasks = async (req, res) => {
    try {
        const { boardId } = req.params;
        const boardAccess = await checkBoardAccess(boardId, req.user._id);
        if (!boardAccess) {
            return res.status(404).json({ msg: "Board not found or access denied" });
        }
        const tasks = await Task.find({ boardId })
            .populate("userId", "email")
            .sort({ createdAt: -1 });
        res.status(200).json({
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error("Get Board Tasks Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// GET SINGLE TASK
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate("userId", "email");
        if (!task) {
            return res.status(404).json({ msg: "Task not found" });
        }
        const boardAccess = await checkBoardAccess(task.boardId, req.user._id);
        if (!boardAccess) {
            return res.status(403).json({ msg: "Access denied" });
        }
        res.status(200).json({ task });
    } catch (error) {
        console.error("Get Task Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: "Task not found" });
        }
        const boardAccess = await checkBoardAccess(task.boardId, req.user._id);
        if (!boardAccess) {
            return res.status(403).json({ msg: "Access denied" });
        }
        const { title, description, status, dueDate } = req.body;
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ msg: "Task title cannot be empty" });
            }
            task.title = title.trim();
        }
        if (description !== undefined) task.description = description;
        if (status !== undefined) {
            if (!["todo", "in-progress", "done"].includes(status)) {
                return res.status(400).json({ msg: "Invalid task status" });
            }
            task.status = status;
        }
        if (dueDate !== undefined) task.dueDate = dueDate || null;
        await task.save();
        res.status(200).json({
            msg: "Task updated successfully",
            task
        });
    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: "Task not found" });
        }
        const boardAccess = await checkBoardAccess(task.boardId, req.user._id);
        if (!boardAccess) {
            return res.status(403).json({ msg: "Access denied" });
        }
        await task.deleteOne();
        res.status(200).json({ msg: "Task deleted successfully" });
    } catch (error) {
        console.error("Delete Task Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
