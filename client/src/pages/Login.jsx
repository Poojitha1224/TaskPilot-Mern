import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, ArrowRight } from "lucide-react";
const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.msg || err.message || "Login failed. Please try again.");
        }
    };
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="brand-mark">TP</div>
                <h1>Welcome back</h1>
                <p className="auth-subtitle">Sign in to continue to Task Pilot</p>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>Email address</label>
                    <div className="input-group">
                        <Mail size={18} />
                        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <label>Password</label>
                    <div className="input-group">
                        <Lock size={18} />
                        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="primary-btn" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                        <ArrowRight size={18} />
                    </button>
                </form>
                <p className="auth-footer">Don't have an account? <Link to="/register">Create account</Link></p>
            </div>
        </div>
    );
};
export default Login;