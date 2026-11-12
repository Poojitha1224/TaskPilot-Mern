
import { UserCircle, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <LayoutDashboard size={25} />
                <h2>Task Pilot</h2>
            </div>
            <div className="navbar-user">
                <div className="navbar-profile">
                    <UserCircle size={22} />
                    <span>{user?.email || "User"}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
