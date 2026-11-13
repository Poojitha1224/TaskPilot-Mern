
const mongoose = require("mongoose");
const Board = require("../models/board");
const User = require("../models/User");
const BoardMember = require("../models/BoardMember");
const BoardInvitation = require("../models/BoardInvitation");

// SEND INVITATION
exports.sendInvitation = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { email } = req.body;
        if (!mongoose.Types.ObjectId.isValid(boardId)) {
            return res.status(400).json({ msg: "Invalid board ID" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ msg: "Email is required" });
        }
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Only the board owner can send invitations" });
        }
        const invitedUser = await User.findOne({
            email: email.trim().toLowerCase()
        });
        if (!invitedUser) {
            return res.status(404).json({
                msg: "No registered user found with this email"
            });
        }
        if (invitedUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ msg: "You cannot invite yourself" });
        }
        const existingMember = await BoardMember.findOne({
            boardId,
            userId: invitedUser._id
        });
        if (existingMember) {
            return res.status(400).json({ msg: "User is already a board member" });
        }
        const existingInvitation = await BoardInvitation.findOne({
            boardId,
            invitedUserId: invitedUser._id,
            status: "pending"
        });
        if (existingInvitation) {
            return res.status(400).json({ msg: "Invitation is already pending" });
        }
        const invitation = await BoardInvitation.create({
            boardId,
            invitedUserId: invitedUser._id,
            invitedBy: req.user._id,
            status: "pending"
        });
        res.status(201).json({
            msg: "Invitation sent successfully",
            invitation
        });
    } catch (error) {
        console.error("Send Invitation Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// GET RECEIVED INVITATIONS
exports.getInvitations = async (req, res) => {
    try {
        const invitations = await BoardInvitation.find({
            invitedUserId: req.user._id,
            status: "pending"
        })
        .populate("boardId", "name description")
        .populate("invitedBy", "email")
        .sort({ createdAt: -1 });
        res.status(200).json({
            count: invitations.length,
            invitations
        });
    } catch (error) {
        console.error("Get Invitations Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ACCEPT INVITATION
exports.acceptInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "Invalid invitation ID" });
        }
        const invitation = await BoardInvitation.findOne({
            _id: id,
            invitedUserId: req.user._id,
            status: "pending"
        });
        if (!invitation) {
            return res.status(404).json({
                msg: "Pending invitation not found"
            });
        }
        const board = await Board.findById(invitation.boardId);
        if (!board) {
            return res.status(404).json({ msg: "Board no longer exists" });
        }
        await BoardMember.updateOne(
            {
                boardId: invitation.boardId,
                userId: req.user._id
            },
            {
                $setOnInsert: {
                    role: "member"
                }
            },
            { upsert: true }
        );
        invitation.status = "accepted";
        await invitation.save();
        res.status(200).json({
            msg: "Invitation accepted successfully. You are now a board member.",
            invitation
        });
    } catch (error) {
        console.error("Accept Invitation Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// DECLINE INVITATION
exports.declineInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "Invalid invitation ID" });
        }
        const invitation = await BoardInvitation.findOne({
            _id: id,
            invitedUserId: req.user._id,
            status: "pending"
        });
        if (!invitation) {
            return res.status(404).json({
                msg: "Pending invitation not found"
            });
        }
        invitation.status = "declined";
        await invitation.save();
        res.status(200).json({
            msg: "Invitation declined successfully"
        });
    } catch (error) {
        console.error("Decline Invitation Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
