import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../utils/api";
import { FiHeart, FiTrash2, FiArrowRight } from "react-icons/fi";
import { useWishlist } from "../../../context/WishlistContext";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    API.get("products/")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setLoading(false);
      });
  }, []);

  const wishlistedProductData = wishlist
    .map((wish) => {
      const product = products.find((p) => p.id === wish.product);
      return product ? { ...product, wishlistId: wish.id } : null;
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button onClick={() => navigate("/")} className="hover:text-blue-600">
              Home
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate("/wishlist")} className="hover:text-blue-600">
              wishlist
            </button>
          </li>
        </ol>
      </nav>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Wishlist</h1>
          <p className="mt-2 text-gray-600">
            {wishlistedProductData.length} {wishlistedProductData.length === 1 ? "item" : "items"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : wishlistedProductData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistedProductData.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className="relative">
                  <Link to={`/products/${product.id}`} className="block">
                    <img
                      src={product.images?.[0]?.image || "https://via.placeholder.com/400x300"}
                      alt={product.name}
                      className="w-full h-48 sm:h-56 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x300";
                      }}
                    />
                  </Link>
                </div>

                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="text-sm text-gray-500 capitalize line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="ml-2 text-red-600 hover:text-red-500  text-sm font-medium ease-in duration-200 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      Remove {/* <FiTrash2 className="w-5 h-5" /> */}
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-gray-900">
                      TZS {Number(product.price).toLocaleString()}
                    </span>
                    <Link
                      to={`/products/${product.id}`}
                      className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium ease-in duration-200"
                    >
                      View <FiArrowRight className="ml-1" />
                    </Link>

                    {/* <div>
                      <button className="text-green-600 text-sm font-semibold hover:text-green-500">Contact Seller</button>
                    </div> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md mx-auto">
            <div className="mx-auto h-24 w-24 text-gray-400 flex items-center justify-center">
              <FiHeart className="w-full h-full" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-500">
              Start adding products you love to your wishlist
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;