import { useEffect, useState } from "react";
import {
    Plus, CheckCircle, Clock, ListTodo, Users,
    ArrowLeft, X, Pencil, Trash2, Bell, MessageCircle
} from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import Chatbot from "../components/Chatbot/Chatbot";

const Dashboard = () => {
    const { user } = useAuth();
    const [boards, setBoards] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("todo");
    const [dueDate, setDueDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [showBoardForm, setShowBoardForm] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [boardDescription, setBoardDescription] = useState("");
    const [boardSaving, setBoardSaving] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [invitations, setInvitations] = useState([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);
    const [showInvitations, setShowInvitations] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    // MEETINGS
    const [meetings, setMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [showMeetings, setShowMeetings] = useState(false);
    const [showMeetingForm, setShowMeetingForm] = useState(false);
    const [meetingSaving, setMeetingSaving] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [meetingDescription, setMeetingDescription] = useState("");
    const [meetingType, setMeetingType] = useState("team");
    const [meetingParticipants, setMeetingParticipants] = useState([]);
    const [meetingStartTime, setMeetingStartTime] = useState("");
    const [meetingEndTime, setMeetingEndTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    // FETCH BOARDS AND TASKS
    useEffect(() => {
        let cancelled = false;
        const fetchBoards = async () => {
            console.log("STEP 1: Fetch boards started");
            try {
                console.log("STEP 2: Calling boards API");
                const response = await API.get("/boards");
                console.log("STEP 3: Boards API response:", response.data);
                const boardList = response.data.boards || [];
                if (cancelled) return;
                setBoards(boardList);
                const taskResults = await Promise.all(
                    boardList.map(async (board) => {
                        try {
                            const taskResponse = await API.get(`/tasks/board/${board._id}`);
                            return taskResponse.data.tasks || [];
                        } catch (error) {
                            console.error("Unable to load board tasks:", error);
                            return [];
                        }
                    })
                );
                if (!cancelled) setTasks(taskResults.flat());
            } catch (error) {
                console.error("Fetch Boards Error:", error);
                alert(error.response?.data?.msg || "Unable to load boards.");
            } finally {
                console.log("STEP 4: Dashboard loading finished");
                if (!cancelled) setLoading(false);
            }
        };
        fetchBoards();
        return () => {
            cancelled = true;
        };
    }, []);

    // SOCKET.IO REAL-TIME NOTIFICATIONS
    useEffect(() => {
        if (!user?._id) return;
        const socket = io("https://taskpilot-mern-0wcc.onrender.com/");
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            console.log("Joining user room:", user._id);
            socket.emit("joinUser", String(user._id));
        });
        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
        });
        socket.on("newNotification", async (notification) => {
            console.log("NEW NOTIFICATION EVENT RECEIVED:", notification);
            console.log("New notification received:", notification);
            try {
                const response = await API.get("/notifications");
                setNotifications(response.data.notifications || []);
                console.log("Notifications refreshed successfully");
            } catch (error) {
                console.error("Unable to refresh notifications:", error);
            }
        });
        return () => socket.disconnect();
    }, [user?._id]);

    const openBoard = async (board) => {
        setSelectedBoard(board);
        setShowMembers(false);
        setShowInviteForm(false);
        setMembers([]);
        setTasksLoading(true);
        try {
            const response = await API.get(`/tasks/board/${board._id}`);
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error("Board Tasks Error:", error);
            alert("Unable to load tasks.");
        } finally {
            setTasksLoading(false);
        }
    };

    const fetchMembers = async () => {
        if (!selectedBoard) return;
        setMembersLoading(true);
        try {
            const response = await API.get(`/boards/${selectedBoard._id}/members`);
            setMembers(response.data.members || []);
            setShowMembers(true);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to load board members.");
        } finally {
            setMembersLoading(false);
        }
    };
    // FETCH MEETINGS FOR THE SELECTED BOARD
    const fetchMeetings = async () => {
        if (!selectedBoard) return;

        setMeetingsLoading(true);
        try {
            const response = await API.get(`/meetings/${selectedBoard._id}`);
            setMeetings(response.data.meetings || []);
            setShowMeetings(true);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to load meetings.");
        } finally {
            setMeetingsLoading(false);
        }
    };

    const openMeetingForm = async () => {
        if (!selectedBoard) return;

        try {
            const response = await API.get(`/boards/${selectedBoard._id}/members`);
            setMembers(response.data.members || []);
            setMeetingTitle("");
            setMeetingDescription("");
            setMeetingType("team");
            setMeetingParticipants([]);
            setMeetingStartTime("");
            setMeetingEndTime("");
            setMeetingLink("");
            setShowMeetingForm(true);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to load board members.");
        }
    };

    const toggleMeetingParticipant = (participantId) => {
        setMeetingParticipants((previous) =>
            previous.includes(participantId)
                ? previous.filter((id) => id !== participantId)
                : [...previous, participantId]
        );
    };

    const createMeeting = async (e) => {
        e.preventDefault();

        if (!selectedBoard) return;
        if (!meetingTitle.trim()) {
            return alert("Please enter a meeting title.");
        }
        if (!meetingStartTime || !meetingEndTime) {
            return alert("Please select the meeting start and end time.");
        }

        const start = new Date(meetingStartTime);
        const end = new Date(meetingEndTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ||
            start <= new Date() || end <= start) {
            return alert("Choose a future start time and an end time after the start time.");
        }

        if (!meetingLink.trim()) {
            return alert("Please enter a meeting link.");
        }

        if (meetingType === "private" && meetingParticipants.length === 0) {
            return alert("Select at least one participant for a private meeting.");
        }

        setMeetingSaving(true);
        try {
            const payload = {
                boardId: selectedBoard._id,
                title: meetingTitle.trim(),
                description: meetingDescription.trim(),
                meetingType,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                meetingLink: meetingLink.trim()
            };

            if (meetingType === "private") {
                payload.participants = meetingParticipants;
            }

            const response = await API.post("/meetings", payload);
            alert(response.data.msg || "Meeting scheduled successfully!");
            setShowMeetingForm(false);
            await fetchMeetings();
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to schedule meeting.");
        } finally {
            setMeetingSaving(false);
        }
    };

    const updateMemberRole = async (memberId, role) => {
        try {
            const response = await API.put(
                `/boards/${selectedBoard._id}/members/${memberId}`,
                { role }
            );
            alert(response.data.msg || "Member role updated successfully!");
            await fetchMembers();
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to update member role.");
        }
    };

    const removeMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const response = await API.delete(
                `/boards/${selectedBoard._id}/members/${memberId}`
            );
            alert(response.data.msg || "Member removed successfully!");
            await fetchMembers();
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to remove member.");
        }
    };

    const fetchInvitations = async () => {
        setInvitationsLoading(true);
        try {
            const response = await API.get("/invitations");
            setInvitations(response.data.invitations || []);
            setShowInvitations(true);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to load invitations.");
        } finally {
            setInvitationsLoading(false);
        }
    };

    const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
            const response = await API.get("/notifications");
            setNotifications(response.data.notifications || []);
            setShowNotifications(true);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to load notifications.");
        } finally {
            setNotificationsLoading(false);
        }
    };
        const markNotificationRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(notification =>
                notification._id === id
                    ? { ...notification, isRead: true }
                    : notification
            ));
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to mark notification as read.");
        }
    };

    const deleteNotification = async (id) => {
        try {
            await API.delete(`/notifications/${id}`);
            setNotifications(prev =>
                prev.filter(notification => notification._id !== id)
            );
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to delete notification.");
        }
    };

    const acceptInvitation = async (id) => {
        try {
            const response = await API.put(`/invitations/${id}/accept`);
            alert(response.data.msg || "Invitation accepted!");
            setInvitations(prev =>
                prev.filter(invitation => invitation._id !== id)
            );
            const boardsResponse = await API.get("/boards");
            setBoards(boardsResponse.data.boards || []);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to accept invitation.");
        }
    };

    const declineInvitation = async (id) => {
        if (!window.confirm("Are you sure you want to decline this invitation?")) return;
        try {
            const response = await API.put(`/invitations/${id}/decline`);
            alert(response.data.msg || "Invitation declined.");
            setInvitations(prev =>
                prev.filter(invitation => invitation._id !== id)
            );
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to decline invitation.");
        }
    };

    const sendInvitation = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            return alert("Please enter an email address.");
        }
        if (!selectedBoard) return;
        setInviteLoading(true);
        try {
            const response = await API.post(
                `/boards/${selectedBoard._id}/invitations`,
                { email: inviteEmail.trim().toLowerCase() }
            );
            alert(response.data.msg || "Invitation sent successfully!");
            setInviteEmail("");
            setShowInviteForm(false);
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to send invitation.");
        } finally {
            setInviteLoading(false);
        }
    };

    const resetTaskForm = () => {
        setTitle("");
        setDescription("");
        setStatus("todo");
        setDueDate("");
        setEditingTask(null);
        setShowForm(false);
    };

    const createBoard = async (e) => {
        e.preventDefault();
        if (!boardName.trim()) {
            return alert("Please enter a board name.");
        }
        setBoardSaving(true);
        try {
            const response = await API.post("/boards", {
                name: boardName,
                description: boardDescription
            });
            setBoards(prev => [response.data.board, ...prev]);
            setBoardName("");
            setBoardDescription("");
            setShowBoardForm(false);
            alert("Board created successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to create board.");
        } finally {
            setBoardSaving(false);
        }
    };

    const startEditBoard = (e, board) => {
        e.stopPropagation();
        setEditingBoard(board);
        setBoardName(board.name || "");
        setBoardDescription(board.description || "");
        setShowBoardForm(true);
    };

    const updateBoard = async (e) => {
        e.preventDefault();
        if (!boardName.trim()) {
            return alert("Please enter a board name.");
        }
        setBoardSaving(true);
        try {
            const response = await API.put(`/boards/${editingBoard._id}`, {
                name: boardName,
                description: boardDescription
            });
            setBoards(prev => prev.map(board =>
                board._id === editingBoard._id
                    ? response.data.board
                    : board
            ));
            if (selectedBoard?._id === editingBoard._id) {
                setSelectedBoard(response.data.board);
            }
            setBoardName("");
            setBoardDescription("");
            setEditingBoard(null);
            setShowBoardForm(false);
            alert("Board updated successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to update board.");
        } finally {
            setBoardSaving(false);
        }
    };

    const deleteBoard = async (e, boardId) => {
        e.stopPropagation();
        const confirmed = window.confirm(
            "Are you sure? This will permanently delete this board and all its tasks."
        );
        if (!confirmed) return;
        try {
            await API.delete(`/boards/${boardId}`);
            setBoards(prev => prev.filter(board => board._id !== boardId));
            if (selectedBoard?._id === boardId) {
                setSelectedBoard(null);
                setShowMembers(false);
                setMembers([]);
                resetTaskForm();
            }
            setTasks(prev => prev.filter(task =>
                String(task.boardId?._id || task.boardId) !== String(boardId)
            ));
            alert("Board deleted successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to delete board.");
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        if (!selectedBoard) return;
        setSaving(true);
        try {
            const response = await API.post("/tasks", {
                title,
                description,
                status,
                dueDate: dueDate || null,
                boardId: selectedBoard._id
            });
            setTasks(prev => [...prev, response.data.task]);
            resetTaskForm();
            alert("Task created successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to create task.");
        } finally {
            setSaving(false);
        }
    };

    const startEditTask = (task) => {
        setEditingTask(task);
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || "todo");
        setDueDate(
            task.dueDate
                ? new Date(task.dueDate).toISOString().slice(0, 10)
                : ""
        );
        setShowForm(true);
    };

    const updateTask = async (e) => {
        e.preventDefault();
        if (!editingTask) return;
        setSaving(true);
        try {
            const response = await API.put(`/tasks/${editingTask._id}`, {
                title,
                description,
                status,
                dueDate: dueDate || null
            });
            setTasks(prev => prev.map(task =>
                task._id === editingTask._id
                    ? response.data.task
                    : task
            ));
            resetTaskForm();
            alert("Task updated successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to update task.");
        } finally {
            setSaving(false);
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await API.delete(`/tasks/${taskId}`);
            setTasks(prev =>
                prev.filter(task => task._id !== taskId)
            );
            alert("Task deleted successfully!");
        } catch (error) {
            alert(error.response?.data?.msg || "Unable to delete task.");
        }
    };

    const completedTasks = tasks.filter(task => task.status === "done").length;
    const pendingTasks = tasks.filter(task => task.status === "todo").length;
    const progressTasks = tasks.filter(task => task.status === "in-progress").length;

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }
        return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <p className="eyebrow">WORKSPACE OVERVIEW</p>
                    <h1>Dashboard</h1>
                    <p className="muted-text">Manage your boards and keep your work moving.</p>
                </div>
                {!selectedBoard && (
                    <div className="task-actions">
                        <button className="primary-btn" onClick={fetchNotifications}>
                            <Bell size={18} /> Notifications ({notifications.filter(n => !n.isRead).length})
                        </button>
                        <button className="primary-btn" onClick={fetchInvitations}>
                            <Users size={18} /> Invitations
                        </button>
                        <button className="primary-btn" onClick={() => {
                            setEditingBoard(null);
                            setBoardName("");
                            setBoardDescription("");
                            setShowBoardForm(!showBoardForm);
                        }}>
                            <Plus size={18} /> New Board
                        </button>
                    </div>
                )}
            </header>

            {showBoardForm && !selectedBoard && (
                <form className="auth-card" onSubmit={editingBoard ? updateBoard : createBoard}>
                    <div className="dashboard-header">
                        <h2>{editingBoard ? "Edit Board" : "Create New Board"}</h2>
                        <button type="button" onClick={() => {
                            setShowBoardForm(false);
                            setEditingBoard(null);
                            setBoardName("");
                            setBoardDescription("");
                        }}>
                            <X size={20} />
                        </button>
                    </div>
                    <label>Board Name</label>
                    <input type="text" placeholder="Enter board name" value={boardName}
                        onChange={e => setBoardName(e.target.value)} required />
                    <label>Description</label>
                    <textarea placeholder="Enter board description" value={boardDescription}
                        onChange={e => setBoardDescription(e.target.value)} />
                    <button className="primary-btn" type="submit" disabled={boardSaving}>
                        {boardSaving ? "Saving..." : editingBoard ? "Update Board" : "Create Board"}
                    </button>
                </form>
            )}

            {!selectedBoard && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <ListTodo />
                        <span>Total tasks</span>
                        <h2>{tasks.length}</h2>
                    </div>
                    <div className="stat-card">
                        <Clock />
                        <span>To do</span>
                        <h2>{pendingTasks}</h2>
                    </div>
                    <div className="stat-card">
                        <Users />
                        <span>In progress</span>
                        <h2>{progressTasks}</h2>
                    </div>
                    <div className="stat-card">
                        <CheckCircle />
                        <span>Completed</span>
                        <h2>{completedTasks}</h2>
                    </div>
                </div>
            )}

            {showNotifications && (
                <div className="auth-card">
                    <div className="dashboard-header">
                        <h2>Notifications ({notifications.length})</h2>
                        <button type="button" onClick={() => setShowNotifications(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    {notificationsLoading ? (
                        <p>Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <p className="muted-text">No notifications available.</p>
                    ) : (
                        notifications.map(notification => (
                            <div className="board-card" key={notification._id}>
                                <h3>{notification.isRead ? "Read" : "New notification"}</h3>
                                <p>{notification.message}</p>
                                <p>Board: {notification.boardId?.name || "N/A"}</p>
                                <p>From: {notification.createdBy?.email || "Unknown"}</p>
                                <p>{new Date(notification.createdAt).toLocaleString()}</p>
                                <div className="task-actions">
                                    {!notification.isRead && (
                                        <button className="primary-btn"
                                            onClick={() => markNotificationRead(notification._id)}>
                                            <CheckCircle size={16} /> Mark as Read
                                        </button>
                                    )}
                                    <button className="primary-btn"
                                        onClick={() => deleteNotification(notification._id)}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <section className="boards-section">
                {showInvitations && (
                    <div className="auth-card">
                        <div className="dashboard-header">
                            <h2>Received Invitations ({invitations.length})</h2>
                            <button type="button" onClick={() => setShowInvitations(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {invitationsLoading ? (
                            <p>Loading invitations...</p>
                        ) : invitations.length === 0 ? (
                            <p className="muted-text">No pending invitations.</p>
                        ) : (
                            invitations.map(invitation => (
                                <div className="board-card" key={invitation._id}>
                                    <h3>{invitation.boardId?.name || "Board"}</h3>
                                    <p>{invitation.boardId?.description || "No description"}</p>
                                    <p>Invited by: {invitation.invitedBy?.email || "Unknown"}</p>
                                    <div className="task-actions">
                                        <button className="primary-btn"
                                            onClick={() => acceptInvitation(invitation._id)}>
                                            <CheckCircle size={16} /> Accept
                                        </button>
                                        <button className="primary-btn"
                                            onClick={() => declineInvitation(invitation._id)}>
                                            <X size={16} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {selectedBoard ? (
                    <>
                        <button className="primary-btn" onClick={() => {
                            setSelectedBoard(null);
                            setShowMembers(false);
                            setShowInviteForm(false);
                            setMembers([]);
                            resetTaskForm();
                        }}>
                            <ArrowLeft size={18} /> Back to boards
                        </button>

                        <div className="dashboard-header">
                            <div>
                                <h2>{selectedBoard.name}</h2>
                                <p className="muted-text">
                                    {selectedBoard.description || "No description available"}
                                </p>
                            </div>
                            <div className="task-actions">
                                <button className="primary-btn" onClick={fetchMembers}>
                                    <Users size={18} /> Members
                                </button>
                                <button className="primary-btn" onClick={fetchMeetings}>
                                    <Clock size={18} /> Meetings
                                </button>
                                <button className="primary-btn" onClick={openMeetingForm}>
                                    <Plus size={18} /> Schedule Meeting
                                </button>
                                <button className="primary-btn" type="button"
                                    onClick={() => setShowInviteForm(!showInviteForm)}>
                                    <Plus size={18} /> Invite Member
                                </button>
                                <button className="primary-btn" onClick={() => {
                                    if (showForm) {
                                        resetTaskForm();
                                    } else {
                                        setEditingTask(null);
                                        setTitle("");
                                        setDescription("");
                                        setStatus("todo");
                                        setDueDate("");
                                        setShowForm(true);
                                    }
                                }}>
                                    <Plus size={18} /> Create Task
                                </button>
                            </div>
                        </div>

                        {showInviteForm && (
                            <form className="auth-card" onSubmit={sendInvitation}>
                                <div className="dashboard-header">
                                    <h3>Invite a Member</h3>
                                    <button type="button" onClick={() => {
                                        setShowInviteForm(false);
                                        setInviteEmail("");
                                    }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <label>Registered User Email</label>
                                <input type="email" placeholder="Enter registered user's email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)} required />
                                <button className="primary-btn" type="submit" disabled={inviteLoading}>
                                    {inviteLoading ? "Sending..." : "Send Invitation"}
                                </button>
                            </form>
                        )}

                        {showMembers && (
                            <div className="auth-card">
                                <div className="dashboard-header">
                                    <h3>Board Members ({members.length})</h3>
                                    <button type="button" onClick={() => setShowMembers(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                {membersLoading ? (
                                    <p>Loading members...</p>
                                ) : members.length === 0 ? (
                                    <p className="muted-text">No members found.</p>
                                ) : (
                                    members.map(member => (
                                        <div className="board-card" key={member._id}>
                                            <p>Email: {member.userId?.email || "Unknown"}</p>
                                            <p>Role: {member.role}</p>
                                            {member.role !== "owner" && (
                                                <div className="task-actions">
                                                    <button className="primary-btn"
                                                        onClick={() => removeMember(member._id)}>
                                                        <Trash2 size={16} /> Remove Member
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {showMeetingForm && (
                            <form className="auth-card" onSubmit={createMeeting}>
                                <div className="dashboard-header">
                                    <h2>Schedule a Meeting</h2>
                                    <button type="button" onClick={() => setShowMeetingForm(false)}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <label>Meeting Title</label>
                                <input
                                    type="text"
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    placeholder="Enter meeting title"
                                    required
                                />

                                <label>Description</label>
                                <textarea
                                    value={meetingDescription}
                                    onChange={(e) => setMeetingDescription(e.target.value)}
                                    placeholder="What will this meeting cover?"
                                />

                                <label>Meeting Type</label>
                                <select
                                    value={meetingType}
                                    onChange={(e) => setMeetingType(e.target.value)}
                                >
                                    <option value="team">Team meeting (all board members)</option>
                                    <option value="private">Private meeting (selected members)</option>
                                </select>

                                {meetingType === "private" && (
                                    <div>
                                        <label>Select Participants</label>
                                        {members.length === 0 ? (
                                            <p className="muted-text">No board members found.</p>
                                        ) : (
                                            members
                                                .filter((member) => {
                                                    const memberUserId = member.userId?._id || member.userId;
                                                    return memberUserId &&
                                                        String(memberUserId) !== String(user?._id);
                                                })
                                                .map((member) => {
                                                    const memberUserId = member.userId?._id || member.userId;
                                                    return (
                                                        <label key={member._id} style={{ display: "block", margin: "8px 0" }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={meetingParticipants.includes(String(memberUserId))}
                                                                onChange={() => toggleMeetingParticipant(String(memberUserId))}
                                                            />
                                                            {" "}{member.userId?.email || "Board member"}
                                                        </label>
                                                    );
                                                })
                                        )}
                                    </div>
                                )}

                                <label>Start Date and Time</label>
                                <input
                                    type="datetime-local"
                                    value={meetingStartTime}
                                    onChange={(e) => setMeetingStartTime(e.target.value)}
                                    required
                                />

                                <label>End Date and Time</label>
                                <input
                                    type="datetime-local"
                                    value={meetingEndTime}
                                    onChange={(e) => setMeetingEndTime(e.target.value)}
                                    required
                                />

                                <label>Meeting Link</label>
                                <input
                                    type="url"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    required
                                />

                                <button className="primary-btn" type="submit" disabled={meetingSaving}>
                                    {meetingSaving ? "Scheduling..." : "Schedule Meeting"}
                                </button>
                            </form>
                        )}

                        {showMeetings && (
                            <div className="auth-card">
                                <div className="dashboard-header">
                                    <h2>Meetings ({meetings.length})</h2>
                                    <button type="button" onClick={() => setShowMeetings(false)}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {meetingsLoading ? (
                                    <p>Loading meetings...</p>
                                ) : meetings.length === 0 ? (
                                    <p className="muted-text">No meetings scheduled for this board.</p>
                                ) : (
                                    <div className="boards-grid">
                                        {meetings.map((meeting) => (
                                            <div className="board-card" key={meeting._id}>
                                                <h3>{meeting.title}</h3>
                                                <p>{meeting.description || "No description available"}</p>
                                                <p>Type: {meeting.meetingType}</p>
                                                <p>Starts: {new Date(meeting.startTime).toLocaleString()}</p>
                                                <p>Ends: {new Date(meeting.endTime).toLocaleString()}</p>
                                                <p>Status: {meeting.status}</p>
                                                <a
                                                    href={meeting.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="primary-btn"
                                                >
                                                    Join Meeting
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {showForm && (
                            <form className="auth-card"
                                onSubmit={editingTask ? updateTask : createTask}>
                                <div className="dashboard-header">
                                    <h2>{editingTask ? "Edit Task" : "New Task"}</h2>
                                    <button type="button" onClick={resetTaskForm}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <label>Task Title</label>
                                <input type="text" value={title}
                                    onChange={e => setTitle(e.target.value)} required />
                                <label>Description</label>
                                <textarea value={description}
                                    onChange={e => setDescription(e.target.value)} />
                                <label>Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="todo">To do</option>
                                    <option value="in-progress">In progress</option>
                                    <option value="done">Completed</option>
                                </select>
                                <label>Due Date</label>
                                <input type="date" value={dueDate}
                                    onChange={e => setDueDate(e.target.value)} />
                                <button className="primary-btn" type="submit" disabled={saving}>
                                    {saving ? "Saving..." : editingTask ? "Update Task" : "Save Task"}
                                </button>
                            </form>
                        )}

                        
<h3>Tasks in this board</h3>
{tasksLoading ? (
    <p>Loading tasks...</p>
) : tasks.length === 0 ? (
    <p className="muted-text">No tasks in this board yet.</p>
) : (
    <div className="boards-grid">
        {tasks.map(task => (
            <div className="board-card task-card" key={task._id}>
                <h3>{task.title}</h3>
                <p>{task.description || "No description available"}</p>

                <p className="task-status">
                    <span>Status</span>
                    <span className={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                        {task.status}
                    </span>
                </p>

                {task.dueDate && (
                    <p className="task-due-date">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                )}

                <div className="task-actions">
                    <button className="primary-btn"
                        onClick={() => startEditTask(task)}>
                        <Pencil size={16} /> Edit
                    </button>

                    <button className="primary-btn delete-task-btn"
                        onClick={() => deleteTask(task._id)}>
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>
        ))}
    </div>
)}

                        
                    </>
                ) : (
                    <>
                        <h2>Your boards</h2>
                        {boards.length === 0 ? (
                            <p className="muted-text">No boards found. Create your first board.</p>
                        ) : (
                            <div className="boards-grid">
                                {boards.map(board => (
                                    <div className="board-card" key={board._id}
                                        onClick={() => openBoard(board)}
                                        style={{ cursor: "pointer" }}>
                                        <h3>{board.name}</h3>
                                        <p>{board.description || "No description available"}</p>
                                        <div className="task-actions">
                                            <button className="primary-btn"
                                                onClick={e => startEditBoard(e, board)}>
                                                <Pencil size={16} /> Edit
                                            </button>
                                            <button className="primary-btn"
                                                onClick={e => deleteBoard(e, board._id)}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                        <p>Click the board name area to view tasks.</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
                    {/* TASKPILOT AI CHATBOT */}

            <button
                className="chatbot-floating-button"
                onClick={() => setShowChatbot(!showChatbot)}
                title="Chat with TaskPilot AI"
            >
                {showChatbot ? <X size={25} /> : <MessageCircle size={25} />}
            </button>

            {showChatbot && (
                <div className="chatbot-floating-window">
                    <Chatbot />
                </div>
            )}

        </div>
    );
};

export default Dashboard;