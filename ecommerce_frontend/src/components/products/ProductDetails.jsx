import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import CartContext from "../../context/CartContext";
import API from "../../utils/api";
import wishlistOutline from "../../assets/images/wishlist_outline.png";
import wishlistFilled from "../../assets/images/wishlist-filled.png";
import arrowRight from "../../assets/images/arrow-right.png";
import arrowLeft from "../../assets/images/arrow-left.png";

const ProductDetails = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [wishlistStatus, setWishlistStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get(`products/${productId}/`);
        setProduct(response.data);
        setWishlistStatus(isWishlisted(response.data.id));
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, isWishlisted]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product.id);
      navigate("/cart");
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const wasWishlisted = wishlistStatus;
      await toggleWishlist(product.id);
      
      setProduct(prev => ({
        ...prev,
        likes: wasWishlisted ? prev.likes - 1 : prev.likes + 1,
      }));
      
      setWishlistStatus(!wasWishlisted);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % (product.images?.length || 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1)
    );
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Product Not Found</h2>
        <p className="text-gray-700 mb-4">The product you're looking for doesn't exist.</p>
        <button 
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );

  return (
    <section className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
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
            <button onClick={() => navigate(-1)} className="hover:text-blue-600">
              Products
            </button>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-900 truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Product Images Section */}
          <div className="md:w-1/2 relative bg-gray-50 p-4">
            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-3 right-3 z-10 bg-white p-1.5 rounded-full shadow-sm hover:scale-105 transition-transform"
              aria-label={wishlistStatus ? "Remove from wishlist" : "Add to wishlist"}
            >
              <img
                src={wishlistStatus ? wishlistFilled : wishlistOutline}
                alt=""
                className="w-5 h-5"
              />
            </button>

            {/* Main Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded bg-white">
              <img
                src={product.images?.[currentImageIndex]?.image || "https://via.placeholder.com/600"}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600";
                }}
              />

              {/* Navigation Arrows */}
              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm transition-all"
                    aria-label="Previous image"
                  >
                    <img src={arrowLeft} alt="" className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-sm transition-all"
                    aria-label="Next image"
                  >
                    <img src={arrowRight} alt="" className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images?.length > 1 && (
              <div className="mt-3 flex space-x-2 overflow-x-auto pb-1">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent'}`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={img.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/100";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="md:w-1/2 p-5 flex flex-col">
            <div className="flex-grow">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Price Section */}
              <div className="mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    TZS {product.price.toLocaleString()}
                  </span>
                  {product.price < product.price * 1.2 && (
                    <span className="text-sm text-gray-500 line-through">
                      TZS. {(product.price * 1.2).toLocaleString()}
                    </span>
                  )}
                </div>
                {product.price < product.price * 1.2 && (
                  <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 font-medium rounded">
                    Save TZS. {(product.price * 0.2).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-2">
                {/* <h2 className="text-sm font-semibold text-gray-900 mb-1">Description</h2> */}
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={`w-full py-2.5 px-4 rounded-md font-medium text-white transition-colors flex items-center justify-center ${
                  addingToCart
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {addingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add to Cart'
                )}
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center text-sm ${
                  wishlistStatus
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <img
                  src={wishlistStatus ? wishlistFilled : wishlistOutline}
                  alt=""
                  className="w-4 h-4 mr-2"
                />
                {wishlistStatus ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetails;