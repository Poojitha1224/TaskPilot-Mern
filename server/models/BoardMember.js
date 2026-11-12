
const mongoose = require("mongoose");
const boardMemberSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        default: "member",
        enum: ["owner", "member"]
    }
}, {
    timestamps: true
});
boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("BoardMember", boardMemberSchema);
