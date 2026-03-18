// src/utils/wishlistService.js
import API from "./api";

export const fetchWishlist = () => API.get("/wishlist/");
export const addToWishlist = (productId) =>
  API.post("/wishlist/", { product: productId });
export const removeFromWishlist = (wishlistId) =>
  API.delete(`/wishlist/${wishlistId}/`);
