
const mongoose = require("mongoose");

const googleAuthSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        googleEmail: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.GoogleAuth ||
    mongoose.model("GoogleAuth", googleAuthSchema);
