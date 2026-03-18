import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import API from "../../utils/api";
import { useWishlist } from "../../context/WishlistContext";
import AuthContext from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import wishlistOutline from "../../assets/images/wishlist_outline.png";
import wishlistFilled from "../../assets/images/wishlist-filled.png";
import { FaSpinner } from "react-icons/fa";


const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { authTokens, user } = useContext(AuthContext);
  const { wishlist, isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  // Get query parameters from the URL
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const query = searchParams.get("q");
  const { id: categoryId } = useParams();

  useEffect(() => {
    if (query) {
      setSearchInput(query);
    }
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [query, categoryId]);

  // Fetching products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (categoryId) params.append("category", categoryId);

      const headers = authTokens?.access
        ? { Authorization: `Bearer ${authTokens.access}` }
        : {};
    
      const response = await API.get(`products/?${params.toString()}`, { headers });
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

   // Fetch product categories
   const [categories, setCategories] = useState([]);

   useEffect(() => {
       const fetchCategories = async () => {
           try {
               const response = await API.get("categories/");
               setCategories(response.data);
           } catch (error) {
               console.error("Error fetching categories:", error);
           }
       };

       fetchCategories();
   }, []);

  useEffect(() => {
    fetchProducts();
  }, [authTokens, categoryId, query]);

  

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };


  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    navigate("/products/");
  };


  return (
    <>
      <Navbar />

      <div className="container mx-auto px-4 py-6">
          {(query || categoryId) && (
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {query && `Search results for "${query}"`}
                {query && categoryId && " in "}
                {categoryId && !query && "Products in category: "}
                {categoryId && categories.find(c => c.id === parseInt(categoryId))?.name}
              </h2>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <span className="text-gray-600">{products.length} items found</span>
                )}
                {(query || categoryId) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-green-600 hover:underline flex items-center"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

        <section className="bg-gray-50 rounded-lg p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin text-4xl text-green-600" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 overflow-hidden"
                  >
                    <div className="relative group overflow-hidden">
                      <img
                        src={product.images?.[0]?.image || "https://via.placeholder.com/300"}
                        onClick={() => handleProductClick(product.id)}
                        alt={product.name}
                        className="w-full h-60 object-cover cursor-pointer transition duration-300 group-hover:scale-105"
                      />
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-3 right-3 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 shadow-md p-2 rounded-full transition duration-300"
                        aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <img
                          src={isWishlisted(product.id) ? wishlistFilled : wishlistOutline}
                          alt="Wishlist"
                          className="w-5 h-5"
                        />
                      </button>
                      {product.likes > 0 && (
                        <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {product.likes} ♥
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3
                        onClick={() => handleProductClick(product.id)}
                        className="text-lg font-semibold text-gray-800 hover:text-green-600 mb-1 cursor-pointer line-clamp-2"
                      >
                        {product.name}
                      </h3>
                      {/* <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </p> */}
                      <div className="flex justify-between items-center">
                        <p className="text-base font-bold text-gray-800">
                          TZS {parseFloat(product.price).toLocaleString()}
                        </p>
                        {/* {product.category_name && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {product.category_name}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <div className="text-gray-500 text-lg mb-4">
                    {query || categoryId
                      ? "No products match your search criteria"
                      : "No products available yet"}
                  </div>
                  {query || categoryId ? (
                    <button
                      onClick={clearAllFilters}
                      className="text-green-600 hover:underline"
                    >
                      Clear search filters
                    </button>
                  ) : (
                    <Link
                      to="/seller-account"
                      className="text-green-600 hover:underline"
                    >
                      Be the first to sell your craft
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* footer */}
      <Footer />

    </>
  );
};

export default ProductList;