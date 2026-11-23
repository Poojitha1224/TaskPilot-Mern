
import { Link } from "react-router-dom";
import {
    CheckCircle2,
    Users,
    CalendarDays,
    Bell,
    Bot,
    LayoutDashboard,
    ArrowRight,
    Zap,
    ShieldCheck
} from "lucide-react";
import "./Landing.css";

const Landing = () => {
    const features = [
        {
            icon: <LayoutDashboard />,
            title: "Project Boards",
            description: "Organize your projects with dedicated boards and keep everything in one place."
        },
        {
            icon: <CheckCircle2 />,
            title: "Task Management",
            description: "Create, assign, track and complete tasks with an easy workflow."
        },
        {
            icon: <Users />,
            title: "Team Collaboration",
            description: "Invite members, manage teams and collaborate efficiently."
        },
        {
            icon: <CalendarDays />,
            title: "Smart Meetings",
            description: "Schedule team meetings and generate Google Meet links automatically."
        },
        {
            icon: <Bell />,
            title: "Real-time Notifications",
            description: "Stay informed about important updates and team activities."
        },
        {
            icon: <Bot />,
            title: "AI Assistant",
            description: "Get quick assistance through your integrated TaskPilot AI chatbot."
        }
    ];

    return (
        <div className="landing-page">

            {/* NAVBAR */}
            <nav className="landing-navbar">
                <Link to="/" className="landing-logo">
                    <span className="logo-icon">T</span>
                    TaskPilot
                </Link>

                <div className="landing-nav-links">
                    <a href="#home">Home</a>
                    <a href="#features">Features</a>
                    <a href="#about">About</a>
                </div>

                <div className="landing-nav-actions">
                    <Link to="/login" className="login-link">
                        Login
                    </Link>
                    <Link to="/register" className="signup-btn">
                        Get Started <ArrowRight size={16} />
                    </Link>
                </div>
            </nav>

            {/* HERO */}
            <section className="landing-hero" id="home">
                <div className="hero-content">
                    <span className="hero-badge">
                        <Zap size={15} /> Your productivity partner
                    </span>

                    <h1>
                        Manage Tasks.
                        <br />
                        <span>Collaborate.</span>
                        <br />
                        Achieve More.
                    </h1>

                    <p>
                        Bring your team, tasks and projects together.
                        Plan smarter, collaborate better and achieve
                        your goals with TaskPilot.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/register" className="hero-primary-btn">
                            Get Started Free <ArrowRight size={18} />
                        </Link>

                        <Link to="/login" className="hero-secondary-btn">
                            Login to Account
                        </Link>
                    </div>

                    <div className="hero-trust">
                        <ShieldCheck size={18} />
                        Simple. Smart. Productive.
                    </div>
                </div>

                {/* DASHBOARD PREVIEW */}
                <div className="hero-visual">
                    <div className="preview-glow"></div>

                    <div className="dashboard-preview">
                        <div className="preview-topbar">
                            <div className="preview-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span>TaskPilot Dashboard</span>
                        </div>

                        <div className="preview-body">
                            <div className="preview-sidebar">
                                <div className="preview-side-logo">T TaskPilot</div>
                                <div className="preview-side-active">Dashboard</div>
                                <div>My Boards</div>
                                <div>My Tasks</div>
                                <div>Meetings</div>
                            </div>

                            <div className="preview-main">
                                <h3>Workspace Overview</h3>
                                <p>Welcome back to your workspace!</p>

                                <div className="preview-stats">
                                    <div>
                                        <span>Total Tasks</span>
                                        <strong>24</strong>
                                    </div>
                                    <div>
                                        <span>In Progress</span>
                                        <strong>08</strong>
                                    </div>
                                    <div>
                                        <span>Completed</span>
                                        <strong>16</strong>
                                    </div>
                                </div>

                                <h4>Recent Tasks</h4>

                                <div className="preview-task">
                                    <span>Website Design</span>
                                    <small>In Progress</small>
                                </div>

                                <div className="preview-task">
                                    <span>API Integration</span>
                                    <small>Completed</small>
                                </div>

                                <div className="preview-task">
                                    <span>Team Meeting</span>
                                    <small>Upcoming</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="landing-features" id="features">
                <div className="section-heading">
                    <span>WHAT TASKPILOT OFFERS</span>
                    <h2>Everything your team needs</h2>
                    <p>Powerful tools to make teamwork easier and more productive.</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div className="feature-card" key={index}>
                            <div className="feature-icon">
                                {feature.icon}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ABOUT */}
            <section className="landing-about" id="about">
                <div>
                    <span className="about-label">ABOUT TASKPILOT</span>
                    <h2>Work better, together.</h2>
                    <p>
                        TaskPilot is a team task management platform
                        designed to simplify project planning,
                        task tracking and team collaboration.
                    </p>
                </div>

                <div className="about-highlight">
                    <CheckCircle2 size={28} />
                    <h3>One workspace. Everything organized.</h3>
                    <p>
                        Manage your tasks, boards, meetings and
                        team communication from one place.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="landing-cta">
                <h2>Ready to take control of your work?</h2>
                <p>Start organizing your projects with TaskPilot today.</p>
                <Link to="/register" className="hero-primary-btn">
                    Create Your Account <ArrowRight size={18} />
                </Link>
            </section>

            {/* FOOTER */}
            <footer className="landing-footer">
                <Link to="/" className="landing-logo">
                    <span className="logo-icon">T</span>
                    TaskPilot
                </Link>
                <p>© {new Date().getFullYear()} TaskPilot. All rights reserved.</p>
            </footer>

        </div>
    );
};

export default Landing;
