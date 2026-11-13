
const mongoose = require("mongoose");
const Board = require("../models/board");
const BoardMember = require("../models/BoardMember");

// GET ALL BOARD MEMBERS
exports.getBoardMembers = async (req, res) => {
    try {
        const { boardId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(boardId)) {
            return res.status(400).json({ msg: "Invalid board ID" });
        }
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        const membership = await BoardMember.findOne({
            boardId,
            userId: req.user._id
        });
        if (!membership && board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Access denied" });
        }
        const members = await BoardMember.find({ boardId })
            .populate("userId", "email")
            .sort({ createdAt: 1 });
        res.status(200).json({
            count: members.length,
            members
        });
    } catch (error) {
        console.error("Get Members Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// UPDATE MEMBER ROLE
exports.updateMemberRole = async (req, res) => {
    try {
        const { boardId, memberId } = req.params;
        const { role } = req.body;
        if (!mongoose.Types.ObjectId.isValid(boardId) ||
            !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ msg: "Invalid ID" });
        }
        if (!["member", "owner"].includes(role)) {
            return res.status(400).json({ msg: "Invalid role" });
        }
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Only the board owner can change roles" });
        }
        const member = await BoardMember.findOne({
            _id: memberId,
            boardId
        });
        if (!member) {
            return res.status(404).json({ msg: "Board member not found" });
        }
        if (member.userId.toString() === board.createdBy.toString()) {
            return res.status(400).json({ msg: "Owner role cannot be changed here" });
        }
        if (role === "owner") {
            return res.status(400).json({
                msg: "Board ownership cannot be transferred through this API"
            });
        }
        member.role = role;
        await member.save();
        res.status(200).json({
            msg: "Member role updated successfully",
            member
        });
    } catch (error) {
        console.error("Update Member Role Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// REMOVE BOARD MEMBER
exports.removeBoardMember = async (req, res) => {
    try {
        const { boardId, memberId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(boardId) ||
            !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ msg: "Invalid ID" });
        }
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Only the board owner can remove members" });
        }
        const member = await BoardMember.findOne({
            _id: memberId,
            boardId
        });
        if (!member) {
            return res.status(404).json({ msg: "Board member not found" });
        }
        if (member.userId.toString() === board.createdBy.toString()) {
            return res.status(400).json({ msg: "Board owner cannot be removed" });
        }
        await member.deleteOne();
        res.status(200).json({
            msg: "Board member removed successfully"
        });
    } catch (error) {
        console.error("Remove Member Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
