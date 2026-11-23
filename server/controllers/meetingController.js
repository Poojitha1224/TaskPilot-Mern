const { google } = require("googleapis");
const GoogleAuth = require("../models/GoogleAuth");
const { decryptToken } = require("../utils/googleTokenCrypto");
const crypto = require("crypto");
const Meeting = require("../models/Meeting");
const Board = require("../models/board");
const BoardMember = require("../models/BoardMember");
const { createNotification } = require("./notificationController");


const generateGoogleMeetLink = async ({
    userId,
    title,
    description,
    startTime,
    endTime
}) => {
    const googleAuth = await GoogleAuth.findOne({ userId });

    if (!googleAuth) {
        throw new Error("GOOGLE_ACCOUNT_NOT_CONNECTED");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: decryptToken(googleAuth.refreshToken)
    });

    const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client
    });

    const response = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        requestBody: {
            summary: title,
            description: description || "",
            start: {
                dateTime: startTime.toISOString()
            },
            end: {
                dateTime: endTime.toISOString()
            },
            conferenceData: {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: {
                        type: "hangoutsMeet"
                    }
                }
            }
        }
    });

    const eventId = response.data.id;
    let event = response.data;

    // Check whether Google has generated the Meet link
    for (let attempt = 0; attempt < 5; attempt++) {
        const meetLink =
            event.hangoutLink ||
            event.conferenceData?.entryPoints?.find(
                entry => entry.entryPointType === "video"
            )?.uri;

        if (meetLink) {
            return {
                meetLink,
                eventId
            };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedEvent = await calendar.events.get({
            calendarId: "primary",
            eventId
        });

        event = updatedEvent.data;
    }

    // Remove the calendar event if Meet generation failed
    await calendar.events.delete({
        calendarId: "primary",
        eventId
    });

    throw new Error("GOOGLE_MEET_LINK_NOT_READY");
};


// CREATE MEETING

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
            meetingLink,
            linkProvider = "manual"
        } = req.body;

        if (!boardId || !title?.trim() || !meetingType || !startTime || !endTime) {
            return res.status(400).json({
                msg: "Please provide all required meeting details"
            });
        }

        if (!["team", "private"].includes(meetingType)) {
            return res.status(400).json({ msg: "Invalid meeting type" });
        }

        if (!["manual", "google-meet"].includes(linkProvider)) {
            return res.status(400).json({
                msg: "Invalid meeting link provider"
            });
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

        // MANUAL LINK VALIDATION
        let finalMeetingLink = "";
        let googleCalendarEventId = null;

        if (linkProvider === "manual") {
            try {
                const link = new URL(meetingLink);

                if (link.protocol !== "https:") {
                    throw new Error("HTTPS required");
                }

                finalMeetingLink = link.href;
            } catch {
                return res.status(400).json({
                    msg: "Please provide a valid HTTPS meeting link"
                });
            }
        }

        // GENERATE GOOGLE MEET LINK
        if (linkProvider === "google-meet") {
            try {
                const result = await generateGoogleMeetLink({
                    userId: req.user._id,
                    title: title.trim(),
                    description,
                    startTime: start,
                    endTime: end
                });

                finalMeetingLink = result.meetLink;
                googleCalendarEventId = result.eventId;

            } catch (error) {
                console.error("Google Meet Generation Error:", error);

                if (error.message === "GOOGLE_ACCOUNT_NOT_CONNECTED") {
                    return res.status(400).json({
                        msg: "Please connect your Google Calendar first."
                    });
                }

                return res.status(502).json({
                    msg: "Unable to generate Google Meet link. Please try again or use a manual link."
                });
            }
        }

        // GET BOARD MEMBERS
        const boardMembers = await BoardMember.find({ boardId })
            .select("userId");

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

        // SAVE MEETING
        const meeting = await Meeting.create({
            boardId,
            title: title.trim(),
            description: description || "",
            createdBy: req.user._id,
            meetingType,
            participants: selectedParticipants,
            startTime: start,
            endTime: end,
            meetingLink: finalMeetingLink,
            linkProvider,
            googleCalendarEventId
        });

        // SEND NOTIFICATIONS
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
