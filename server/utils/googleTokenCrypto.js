
const crypto = require("crypto");

const getKey = () => {
    const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

    if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error("Invalid Google token encryption key");
    }

    return Buffer.from(key, "hex");
};

exports.encryptToken = (token) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        getKey(),
        iv
    );

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        encrypted
    ].join(":");
};

exports.decryptToken = (encryptedToken) => {
    const [ivHex, authTagHex, encrypted] =
        encryptedToken.split(":");

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getKey(),
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};
