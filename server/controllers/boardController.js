
const Board = require("../models/board");
const BoardMember = require("../models/BoardMember");
const Task = require("../models/Task");
const BoardInvitation = require("../models/BoardInvitation");
const Notification = require("../models/Notification");

// CREATE BOARD
exports.createBoard = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ msg: "Board name is required" });
        }
        const board = await Board.create({
            name: name.trim(),
            description: description || "",
            createdBy: req.user._id
        });
        await BoardMember.create({
            boardId: board._id,
            userId: req.user._id,
            role: "owner"
        });
        res.status(201).json({
            msg: "Board created successfully",
            board
        });
    } catch (error) {
        console.error("Create Board Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// GET ALL ACCESSIBLE BOARDS
exports.getBoards = async (req, res) => {
    try {
        const memberships = await BoardMember.find({
            userId: req.user._id
        }).select("boardId");
        const boardIds = memberships.map(member => member.boardId);
        const boards = await Board.find({
            $or: [
                { createdBy: req.user._id },
                { _id: { $in: boardIds } }
            ]
        }).populate("createdBy", "email").sort({ createdAt: -1 });
        res.status(200).json({
            count: boards.length,
            boards
        });
    } catch (error) {
        console.error("Get Boards Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// GET SINGLE BOARD
exports.getBoardById = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate("createdBy", "email");
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        const isMember = await BoardMember.exists({
            boardId: board._id,
            userId: req.user._id
        });
        if (!isMember && board.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Access denied" });
        }
        res.status(200).json({ board });
    } catch (error) {
        console.error("Get Board Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// UPDATE BOARD
exports.updateBoard = async (req, res) => {
    try {
        const { name, description } = req.body;
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Only the board owner can update this board" });
        }
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ msg: "Board name cannot be empty" });
            }
            board.name = name.trim();
        }
        if (description !== undefined) {
            board.description = description;
        }
        await board.save();
        res.status(200).json({
            msg: "Board updated successfully",
            board
        });
    } catch (error) {
        console.error("Update Board Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// DELETE BOARD
exports.deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Only the board owner can delete this board" });
        }
        await Promise.all([
            Task.deleteMany({ boardId: board._id }),
            BoardMember.deleteMany({ boardId: board._id }),
            BoardInvitation.deleteMany({ boardId: board._id }),
            Notification.deleteMany({ boardId: board._id }),
            board.deleteOne()
        ]);
        res.status(200).json({
            msg: "Board and related records deleted successfully"
        });
    } catch (error) {
        console.error("Delete Board Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
