
import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await API.get("/user/me");
                setUser(response.data.user);
            } catch (error) {
                console.error("Session verification failed:", error);
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkLogin();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await API.post("/auth/login", {
                email,
                password
            });
            localStorage.setItem("token", response.data.token);
            setUser(response.data.user);
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        const response = await API.post("/auth/register", {
            name,
            email,
            password
        });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
