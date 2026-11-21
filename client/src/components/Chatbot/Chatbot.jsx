
import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();

        setMessages(prev => [
            ...prev,
            { role: "user", content: userMessage }
        ]);

        setInput("");
        setLoading(true);

        setMessages(prev => [
            ...prev,
            { role: "assistant", content: "" }
        ]);

        try {
            const response = await fetch(
                "http://localhost:5003/api/chatbot/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: userMessage
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Unable to connect to AI.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, {
                    stream: true
                });

                const events = buffer.split("\n\n");
                buffer = events.pop() || "";

                for (const event of events) {
                    const line = event
                        .split("\n")
                        .find(item => item.startsWith("data: "));

                    if (!line) continue;

                    const data = line.slice(6);

                    if (data === "[DONE]") continue;

                    const parsed = JSON.parse(data);

                    if (parsed.error) {
                        throw new Error(parsed.error);
                    }

                    if (parsed.delta) {
                        setMessages(prev => {
                            const updated = [...prev];
                            const last = updated.length - 1;

                            updated[last] = {
                                ...updated[last],
                                content:
                                    updated[last].content +
                                    parsed.delta
                            };

                            return updated;
                        });
                    }
                }
            }

        } catch (error) {
            console.error("Chatbot error:", error);

            setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;

                updated[last] = {
                    ...updated[last],
                    content:
                        "Sorry! I'm unable to respond right now. Please try again."
                };

                return updated;
            });

        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="taskpilot-chatbot">

            <div className="chatbot-header">
                <div className="chatbot-avatar">✦</div>

                <div>
                    <h3>TaskPilot AI</h3>
                    <span>● Your intelligent assistant</span>
                </div>

                <button
                    className="clear-chat"
                    onClick={() => setMessages([])}
                    title="Clear conversation"
                >
                    ↻
                </button>
            </div>

            <div className="chatbot-messages">

                {messages.length === 0 && (
                    <div className="chatbot-welcome">
                        <div className="welcome-icon">✦</div>

                        <h2>How can I help you today?</h2>

                        <p>
                            Ask me anything about coding,
                            productivity or project management.
                        </p>

                        <div className="suggestion-list">
                            {[
                                "Explain React hooks",
                                "How can I organize my tasks?",
                                "Give me project ideas",
                                "Help me debug my code"
                            ].map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(suggestion)}
                                >
                                    {suggestion} →
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat-message ${message.role}`}
                    >
                        <div className="message-avatar">
                            {message.role === "user" ? "You" : "✦"}
                        </div>

                        <div className="message-content">
                            {message.content ||
                                (loading &&
                                index === messages.length - 1
                                    ? "Thinking..."
                                    : "")}
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-area">
                <textarea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message TaskPilot AI..."
                    rows="1"
                />

                <button
                    className="send-button"
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                >
                    ↑
                </button>
            </div>

            <p className="chatbot-footer">
                TaskPilot AI can make mistakes. Verify important information.
            </p>

        </div>
    );
}

export default Chatbot;
