
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";

import "./App.css";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Checking login...</div>;
    }

    return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    const { user, loading } = useAuth();

    return (
        <>
            {user && !loading && <Navbar />}

            <Routes>
                {/* PUBLIC LANDING PAGE */}
                <Route
                    path="/"
                    element={
                        user ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Landing />
                        )
                    }
                />

                {/* LOGIN */}
                <Route
                    path="/login"
                    element={
                        loading ? (
                            <div>Checking login...</div>
                        ) : user ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login />
                        )
                    }
                />

                {/* REGISTER */}
                <Route
                    path="/register"
                    element={
                        loading ? (
                            <div>Checking login...</div>
                        ) : user ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Register />
                        )
                    }
                />

                {/* PROTECTED DASHBOARD */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* UNKNOWN ROUTES */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
