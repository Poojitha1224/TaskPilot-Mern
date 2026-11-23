
const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
    {
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Board",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        meetingType: {
            type: String,
            enum: ["team", "private"],
            required: true
        },

        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        meetingLink: {
            type: String,
            default: ""
        },
        googleCalendarEventId: {
    type: String,
    default: null
},

        linkProvider: {
            type: String,
            enum: ["manual", "google-meet", "zoom"],
            default: "manual"
        },

        status: {
            type: String,
            enum: ["scheduled", "cancelled"],
            default: "scheduled"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Meeting", meetingSchema);
