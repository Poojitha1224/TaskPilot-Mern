
const Meeting = require("../models/Meeting");
const Board = require("../models/Board");
const BoardMember = require("../models/BoardMember");
const { createNotification } = require("./notificationController");

// CREATE MEETING
exports.createMeeting = async (req, res) => {
    try {
        const {
            boardId,
            title,
            description,
            meetingType,
            participants,
            startTime,
            endTime,
            meetingLink
        } = req.body;

        if (!boardId || !title || !meetingType || !startTime || !endTime || !meetingLink) {
            return res.status(400).json({
                msg: "Please provide all required meeting details"
            });
        }

        if (!["team", "private"].includes(meetingType)) {
            return res.status(400).json({ msg: "Invalid meeting type" });
        }

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }

        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                msg: "Only the board owner can schedule meetings"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start ||
            start <= new Date()
        ) {
            return res.status(400).json({
                msg: "Please provide valid future meeting times"
            });
        }

        let link;

        try {
            link = new URL(meetingLink);
            if (link.protocol !== "https:") {
                throw new Error("HTTPS required");
            }
        } catch {
            return res.status(400).json({
                msg: "Please provide a valid HTTPS meeting link"
            });
        }

        const boardMembers = await BoardMember.find({ boardId }).select("userId");

        const memberIds = boardMembers.map(member =>
            member.userId.toString()
        );

        let selectedParticipants = [];

        if (meetingType === "team") {
            selectedParticipants = memberIds;
        } else {
            if (!Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({
                    msg: "Select at least one participant"
                });
            }

            const invalidParticipants = participants.filter(
                id => !memberIds.includes(id.toString())
            );

            if (invalidParticipants.length > 0) {
                return res.status(400).json({
                    msg: "All participants must belong to this board"
                });
            }

            selectedParticipants = [
                ...new Set(participants.map(id => id.toString()))
            ];
        }

        if (!selectedParticipants.includes(req.user._id.toString())) {
            selectedParticipants.push(req.user._id.toString());
        }

        const meeting = await Meeting.create({
            boardId,
            title: title.trim(),
            description: description || "",
            createdBy: req.user._id,
            meetingType,
            participants: selectedParticipants,
            startTime: start,
            endTime: end,
            meetingLink: link.href,
            linkProvider: "manual"
        });

        const io = req.app.get("io");

        for (const userId of selectedParticipants) {
            if (userId === req.user._id.toString()) continue;

            await createNotification({
                userId,
                message: `New ${meetingType} meeting scheduled: ${title}`,
                boardId: board._id,
                createdBy: req.user._id,
                io
            });
        }

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate("createdBy", "email")
            .populate("participants", "email")
            .populate("boardId", "name");

        return res.status(201).json({
            msg: "Meeting scheduled successfully",
            meeting: populatedMeeting
        });

    } catch (error) {
        console.error("Create Meeting Error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
};

// GET MEETINGS FOR A BOARD
exports.getMeetings = async (req, res) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findById(boardId);

        if (!board) {
            return res.status(404).json({ msg: "Board not found" });
        }

        const isMember = await BoardMember.exists({
            boardId,
            userId: req.user._id
        });

        if (!isMember) {
            return res.status(403).json({ msg: "Access denied" });
        }

        const meetings = await Meeting.find({
            boardId,
            status: "scheduled",
            $or: [
                { meetingType: "team" },
                { createdBy: req.user._id },
                { participants: req.user._id }
            ]
        })
            .populate("createdBy", "email")
            .populate("participants", "email")
            .populate("boardId", "name")
            .sort({ startTime: 1 });

        return res.status(200).json({
            count: meetings.length,
            meetings
        });

    } catch (error) {
        console.error("Get Meetings Error:", error);
        return res.status(500).json({ msg: "Server error" });
    }
};
