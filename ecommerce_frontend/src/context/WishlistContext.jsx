import React, { createContext, useState, useContext, useEffect } from "react";
import API from "../utils/api";

const WishlistContext = createContext();
export default WishlistContext;

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  
  const token = localStorage.getItem('access_token');
  const isAuthenticated = !!token;

  useEffect(() => {
    if (isAuthenticated) {
      syncWishlist();
      fetchWishlist();
    } else {
      const storedWishlist = localStorage.getItem("wishlist");
      setWishlist(storedWishlist ? JSON.parse(storedWishlist) : []);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await API.get("/wishlist/");
      setWishlist(response.data);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
  };

  const addToWishlist = async (productId) => {
    if (isWishlisted(productId)) return;
    if (isAuthenticated) {
      try {
        const response = await API.post("/wishlist/", { product: productId });
        setWishlist((prev) => [...prev, response.data]);
      } catch (error) {
        console.error("Failed to add to wishlist:", error);
      }
    } else {
      const updated = [...wishlist, { product: productId }];
      setWishlist(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        const wishlistItem = wishlist.find(
          (item) => item.product === productId || item.product?.id === productId
        );
        if (wishlistItem) {
          await API.delete(`/wishlist/${wishlistItem.id}/`);
          setWishlist((prev) => prev.filter((item) => item.id !== wishlistItem.id));
        }
      } catch (error) {
        console.error("Failed to remove from wishlist:", error);
      }
    } else {
      const updated = wishlist.filter(
        (item) => item.product !== productId && item.product?.id !== productId
      );
      setWishlist(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some(
      (item) => item.product === productId || item.product?.id === productId
    );
  };

  const toggleWishlist = (productId) => {
    if (isWishlisted(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const syncWishlist = async () => {
    const storedWishlist = localStorage.getItem('wishlist');
    if (!storedWishlist) return;

    const localWishlist = JSON.parse(storedWishlist);
    for (const item of localWishlist) {
      try {
        await API.post("/wishlist/", { product: item.product });
      } catch (error) {
        console.error("Failed to sync wishlist item:", error);
      }
    }
    localStorage.removeItem('wishlist');
    fetchWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
