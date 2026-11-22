
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const GoogleAuth = require("../models/GoogleAuth");

const {
    encryptToken,
    decryptToken
} = require("../utils/googleTokenCrypto");

const createOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

// START GOOGLE AUTHORIZATION
exports.googleAuth = async (req, res) => {
    try {
        const oauth2Client = createOAuthClient();

        const state = jwt.sign(
            { userId: req.user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/userinfo.email"
            ],
            state
        });

        return res.status(200).json({ authUrl });

    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).send(
            "Unable to start Google authorization"
        );
    }
};

// GOOGLE AUTHORIZATION CALLBACK
exports.googleCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.status(400).send(
                "Google authorization was denied"
            );
        }

        if (!code || !state) {
            return res.status(400).send(
                "Missing authorization details"
            );
        }

        const decoded = jwt.verify(
            state,
            process.env.JWT_SECRET
        );

        const oauth2Client = createOAuthClient();

        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            version: "v2",
            auth: oauth2Client
        });

        const { data } = await oauth2.userinfo.get();

        const existingAuth = await GoogleAuth.findOne({
            userId: decoded.userId
        });

        const refreshToken =
            tokens.refresh_token ||
            (existingAuth
                ? decryptToken(existingAuth.refreshToken)
                : null);

        if (!refreshToken) {
            return res.status(400).send(
                "Google did not provide a refresh token. Please reconnect."
            );
        }

        await GoogleAuth.findOneAndUpdate(
            { userId: decoded.userId },
            {
                userId: decoded.userId,
                googleEmail: data.email,
                refreshToken: encryptToken(refreshToken)
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return res.send(
            "Google account connected successfully! You can close this page."
        );

    } catch (error) {
        console.error("Google Callback Error:", error);
        return res.status(400).send(
            "Google authorization failed. Please try again."
        );
    }
};
