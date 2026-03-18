import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Creating the Axios Instance
const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});

// Set withCredentials to true to send cookies (session) with requests
axios.defaults.withCredentials = true;

// Request Interceptor
API.interceptors.request.use(async (config) => {
    // Do something before request is sent
    let tokens = JSON.parse(localStorage.getItem("authTokens")); // Get tokens (access & refresh tokens) from local storage

    if (tokens) {
        let decoded = jwtDecode(tokens.access);
        let exp = decoded.exp * 1000;
        let now = Date.now();

        if (exp - now < 30000) {  // If token is about to expire
            try {
                let refreshResponse = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
                    refresh: tokens.refresh,
                });

                if (refreshResponse.status === 200) {
                    localStorage.setItem("authTokens", JSON.stringify(refreshResponse.data));
                    tokens = refreshResponse.data; // New access and refresh token
                } else {
                    throw new Error("Failed to refresh token");
                }

                // // Do something with request error
            } catch (error) {
                console.error("Token refresh error:", error);
                localStorage.removeItem("authTokens");
                window.location.href = "/login"; // Redirect to login
            }
        }
        // Add Authorization header
        // Adds the access token to the request headers so that the server knows the user is authenticated.
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default API;
