const Notification = require("../models/Notification");

// GET NOTIFICATIONS
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user._id,
            isDeleted: false
        })
        .populate("taskId", "title status")
        .populate("createdBy", "email")
        .populate("boardId", "name")
        .sort({ createdAt: -1 });
        res.status(200).json({
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// MARK NOTIFICATION AS READ
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: false
        });
        if (!notification) {
            return res.status(404).json({
                msg: "Notification not found"
            });
        }
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
        res.status(200).json({
            msg: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark Notification Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: false
        });
        if (!notification) {
            return res.status(404).json({
                msg: "Notification not found"
            });
        }
        notification.isDeleted = true;
        await notification.save();
        res.status(200).json({
            msg: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ msg: "Server error" });
    }
};
// CREATE AND SEND REAL-TIME NOTIFICATION
exports.createNotification = async ({ userId, message, taskId = null, boardId = null, createdBy = null, io }) => {
    const notification = await Notification.create({
        userId,
        message,
        taskId,
        boardId,
        createdBy
    });
    if (io) {
        io.to(userId.toString()).emit("newNotification", notification);
    }
    return notification;
};