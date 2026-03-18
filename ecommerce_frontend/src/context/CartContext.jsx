import { createContext, useState, useContext, useEffect } from "react";
import axios from "../utils/api";  // Use centralized API instance
import AuthContext from "./AuthContext";
import Cookies from "js-cookie";  // Import js-cookie to work with cookies
import { toast } from 'react-toastify';


const CartContext = createContext();

export default CartContext;

export const CartProvider = ({ children }) => {
    const { authTokens } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);  // To track loading state
    const [error, setError] = useState(null);  // To track any errors

    // Sync the cart with session or cookies for unauthenticated users
    useEffect(() => {
        if (authTokens) {
            // If authenticated, fetch cart from the backend
            getCart();
        } else {
            // If unauthenticated, load cart from cookies
            const sessionKey = Cookies.get('sessionid');  // Get session key from cookies
            if (sessionKey) {
                getCart(sessionKey);
            } else {
                setCart([]);  // No cart available if no session key
            }
        }
    }, [authTokens]);

    const getCart = async (sessionKey = null) => {
        setLoading(true);
        let url = "/cart/";
        if (sessionKey) {
            // For unauthenticated users, pass session key in headers
            url += `?session_key=${sessionKey}`;
        }

        try {
            let response = await axios.get(url);
            setCart(response.data);
            setError(null);  // Clear error if successful
            if (!authTokens) {
                // For unauthenticated users, store cart data in cookies
                Cookies.set('cart', JSON.stringify(response.data), { expires: 7 }); // Store cart in cookies for 7 days
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
            setError("Failed to load cart. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId) => {
        setLoading(true);
        if (authTokens) {
            try {
                await axios.post("/cart/add/", { product_id: productId });
                await getCart(); // Refresh cart from backend
            } catch (error) {
                console.error("Error adding item to cart:", error);
                setError("Failed to add item to cart. Please try again.");
            }
        } else {
            let sessionKey = Cookies.get('sessionid');
            if (!sessionKey) {
                // If no session key, create one
                sessionKey = Math.random().toString(36).substr(2, 9);  // Create a unique session ID
                Cookies.set('sessionid', sessionKey);  // Set a temporary session key
            }
            try {
                await axios.post("/cart/add/", { product_id: productId, session_key: sessionKey });
                await getCart(sessionKey); // Refresh cart for unauthenticated users
            } catch (error) {
                console.error("Error adding item to cart:", error);
                setError("Failed to add item to cart. Please try again.");
            }
        }
        setLoading(false);
    };

    const updateQuantity = async (itemId, newQuantity) => {
        setLoading(true);
        try {
            const payload = {
                quantity: newQuantity
            };
    
            // Add session key for guest users
            if (!authTokens) {
                let sessionKey = Cookies.get('sessionid');
                if (!sessionKey) {
                    sessionKey = Math.random().toString(36).substr(2, 9);
                    Cookies.set('sessionid', sessionKey);
                }
                payload.session_key = sessionKey;
            }
    
            await axios.patch(`/cart/items/${itemId}/`, payload);
            await getCart(authTokens ? null : Cookies.get('sessionid'));
        } catch (error) {
            console.error("Error updating quantity:", error);
            setError(error.response?.data?.error || "Failed to update quantity");
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (itemId) => {
        setLoading(true);
        if (authTokens) {
            try {
                await axios.delete(`/cart/remove/${itemId}/`);
                await getCart(); // Refresh cart from backend
            } catch (error) {
                console.error("Error removing item from cart:", error);
                setError("Failed to remove item from cart. Please try again.");
            }
        } else {
            const sessionKey = Cookies.get('sessionid');
            try {
                await axios.delete(`/cart/remove/${itemId}/`, { data: { session_key: sessionKey } });
                await getCart(sessionKey); // Refresh cart for unauthenticated users
            } catch (error) {
                console.error("Error removing item from cart:", error);
                setError("Failed to remove item from cart. Please try again.");
            }
        }
        setLoading(false);
    };

    const checkout = async ({ shipment_id, payment_id }) => {
    setLoading(true);
    try {
        const payload = { shipment_id, payment_id };
        const response = await axios.post("/checkout/", payload);

        if (response.status === 201) {
        // toast pop up message
        toast.success(response.data.message || "Order placed successfully!");
        setCart([]);
        Cookies.remove("cart"); // clear guest cart
        }
    } catch (error) {
        console.error("Checkout failed:", error);
        setError("Failed to complete checkout. Please try again.");
    } finally {
        setLoading(false);
    }
    };


    return (
        <CartContext.Provider value={{ cart, loading, error, addToCart, updateQuantity, removeFromCart, checkout }}>
            {children}
        </CartContext.Provider>
    );
};
