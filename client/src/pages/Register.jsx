import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock } from "lucide-react";
const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await register(name, email, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.msg || "Registration failed. Please try again.");
        }
    };
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="brand-mark">TP</div>
                <h1>Create account</h1>
                <p className="auth-subtitle">Start organizing your work with Task Pilot</p>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>Full name</label>
                    <div className="input-group">
                        <User size={18} />
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required />
                    </div>
                    <label>Email address</label>
                    <div className="input-group">
                        <Mail size={18} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                    </div>
                    <label>Password</label>
                    <div className="input-group">
                        <Lock size={18} />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" minLength={6} required />
                    </div>
                    <button className="primary-btn" type="submit">Create account</button>
                </form>
                <p className="auth-footer">Already have an account? <Link to="/">Sign in</Link></p>
            </div>
        </div>
    );
};
export default Register;