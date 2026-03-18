import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../utils/api";

const AuthContext = createContext();
export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => {
        const storedTokens = localStorage.getItem("authTokens");
        return storedTokens ? JSON.parse(storedTokens) : null;
    });

    const [user, setUser] = useState(() => {
        const storedTokens = localStorage.getItem("authTokens");
        if (!storedTokens) return null;
        const decoded = jwtDecode(JSON.parse(storedTokens).access);
        return {
            ...decoded,
            role: decoded.role || 'customer',
            is_staff: decoded.is_staff || false
        };
    });

    const [sellerProfile, setSellerProfile] = useState(null);
    const navigate = useNavigate();

    const checkSellerStatus = useCallback(async () => {
        if (!authTokens?.access) return { hasAccount: false, hasProfile: false };

        try {
            const accountResponse = await axios.get("/check-seller-account/", {
                headers: { Authorization: `Bearer ${authTokens.access}` }
            });

            if (!accountResponse.data.has_account) {
                return { hasAccount: false, hasProfile: false };
            }

            try {
                const profileResponse = await axios.get("/seller-profile/", {
                    headers: { Authorization: `Bearer ${authTokens.access}` }
                });
                setSellerProfile(profileResponse.data);
                return { hasAccount: true, hasProfile: true };
            } catch (error) {
                if (error.response?.status === 404) {
                    return { hasAccount: true, hasProfile: false };
                }
                throw error;
            }
        } catch (error) {
            console.error("Seller status check error:", error);
            return { hasAccount: false, hasProfile: false };
        }
    }, [authTokens]);

    const createSellerAccount = async (businessEmail, password) => {
        try {
            const verifyResponse = await axios.post("/verify-password/", {
                password
            }, {
                headers: {
                    Authorization: `Bearer ${authTokens.access}`
                }
            });

            if (!verifyResponse.data.valid) {
                return {
                    success: false,
                    error: "Incorrect password"
                };
            }

            const response = await axios.post("/seller-account/", {
                business_email: businessEmail
            }, {
                headers: {
                    Authorization: `Bearer ${authTokens.access}`
                }
            });

            if (response.status === 201) {
                const status = await checkSellerStatus();
                setUser(prev => ({
                    ...prev,
                    role: 'seller'
                }));

                if (status.hasProfile) {
                    navigate("/seller");
                } else {
                    navigate("/profile-form");
                }

                return { success: true };
            }
        } catch (error) {
            console.error("Account creation error:", error.response?.data || error);
            return {
                success: false,
                error: error.response?.data?.error ||
                       error.response?.data?.message ||
                       "An unexpected error occurred. Please try again."
            };
        }
    };

    const registerUser = async (first_name, last_name, email, phone_number, password) => {
    try {
        const response = await axios.post("register/", {
            first_name, last_name, email, phone_number, password
        });

        if (response.status === 201) {
            // Store only the email temporarily for OTP verification
            localStorage.setItem("pendingEmail", email);
            navigate('/verify-otp');
        }
    } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
        throw error;
    }
};


    const loginUser = async (email, password) => {
        try {
            const response = await axios.post("token/", { email, password });
            const { access, refresh } = response.data;
            const decodedUser = jwtDecode(access);

            const tempAuthTokens = { access, refresh };

            const status = await axios.get("/check-seller-account/", {
                headers: { Authorization: `Bearer ${access}` }
            }).then(async accountResponse => {
                if (!accountResponse.data.has_account) {
                    return {
                        hasAccount: false,
                        hasProfile: false,
                        isStaff: decodedUser.is_staff || false
                    };
                }

                try {
                    const profileResponse = await axios.get("/seller-profile/", {
                        headers: { Authorization: `Bearer ${access}` }
                    });
                    return {
                        hasAccount: true,
                        hasProfile: true,
                        profile: profileResponse.data,
                        isStaff: decodedUser.is_staff || false
                    };
                } catch (error) {
                    if (error.response?.status === 404) {
                        return {
                            hasAccount: true,
                            hasProfile: false,
                            isStaff: decodedUser.is_staff || false
                        };
                    }
                    throw error;
                }
            }).catch(error => {
                console.error("Seller status check error:", error);
                return {
                    hasAccount: false,
                    hasProfile: false,
                    isStaff: decodedUser.is_staff || false
                };
            });

            setAuthTokens(tempAuthTokens);
            setUser({
                ...decodedUser,
                role: decodedUser.role || (status.hasAccount ? 'seller' : 'customer'),
                is_staff: status.isStaff
            });

            if (status.profile) setSellerProfile(status.profile);
            localStorage.setItem("authTokens", JSON.stringify(tempAuthTokens));

            if (status.isStaff) {
                navigate("/admin/orders");
            } else if (status.hasAccount) {
                navigate(status.hasProfile ? "/seller" : "/profile-form");
            } else {
                navigate("/");
            }

            return {
                success: true,
                data: {
                    ...decodedUser,
                    role: decodedUser.role || (status.hasAccount ? 'seller' : 'customer'),
                    is_staff: status.isStaff
                }
            };
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                error: error.response?.data?.detail || "Invalid credentials"
            };
        }
    };

    useEffect(() => {
        const checkInitialAuth = async () => {
            if (authTokens && user) {
                const status = await checkSellerStatus();
                if (
                    status.hasAccount &&
                    !window.location.pathname.startsWith("/seller") &&
                    !window.location.pathname.startsWith("/profile-form")
                ) {
                    navigate(status.hasProfile ? "/seller" : "/profile-form");
                }
            }
        };
        checkInitialAuth();
    }, [authTokens, user, checkSellerStatus, navigate]);

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        setSellerProfile(null);
        localStorage.removeItem("authTokens");
        navigate("/login");
    }, [navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (authTokens) {
                const decoded = jwtDecode(authTokens.access);
                const exp = decoded.exp * 1000;
                const now = Date.now();

                if (exp - now < 60000) {
                    axios.post("token/refresh/", { refresh: authTokens.refresh })
                        .then((response) => {
                            const newTokens = response.data;
                            setAuthTokens(newTokens);

                            const decodedUser = jwtDecode(newTokens.access);
                            setUser({
                                ...decodedUser,
                                role: decodedUser.role || 'customer',
                                is_staff: decodedUser.is_staff || false
                            });

                            localStorage.setItem("authTokens", JSON.stringify(newTokens));
                        })
                        .catch(() => logoutUser());
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [authTokens, logoutUser]);

    return (
        <AuthContext.Provider value={{
            user,
            authTokens,
            setAuthTokens,  
            setUser, 
            sellerProfile,
            createSellerAccount,
            registerUser,
            loginUser,
            logoutUser,
            checkSellerStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};
