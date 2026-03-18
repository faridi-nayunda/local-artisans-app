import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

/**
 * @param {ReactNode} children - The page to render
 * @param {string} allowed - The allowed role: 'customer', 'seller', 'admin', or 'any'
 */
const ProtectedRoute = ({ children, allowed = "any" }) => {
    const { user, sellerProfile } = useContext(AuthContext);

    // 1. If not logged in → send to login
    if (!user) return <Navigate to="/login" replace />;

    // 2. Role-based checks
    const role = user.role || "customer";

    // If allowed = 'any', allow everyone logged in
    if (allowed === "any") return children;

    // Only customer
    if (allowed === "customer" && role !== "customer") {
        return <Navigate to="/seller" replace />;
    }

    // Only seller with complete profile
    if (allowed === "seller") {
        if (role !== "seller") return <Navigate to="/" replace />;
        if (!sellerProfile) return <Navigate to="/profile-form" replace />;
        return children;
    }

    // Only admin
    if (allowed === "admin" && !user.is_staff) {
        return <Navigate to="/" replace />;
    }

    // Default allow
    return children;
};

export default ProtectedRoute;
