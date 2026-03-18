import React, { useEffect, useState } from 'react';
import API from "../../../utils/api";
import wishlistOutline from "../../../assets/images/wishlist_outline.png";
import wishlistFilled from "../../../assets/images/wishlist-filled.png";
import { useWishlist } from "../../../context/WishlistContext";
import { useNavigate } from "react-router-dom";

const SearchResults = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('http://127.0.0.1:8000/api/categories/')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, category]);

  const fetchProducts = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (query) params.q = query;
    if (category) params.category = category;

    API.get('http://localhost:8000/api/products/', { params })
      .then(res => setProducts(res.data))
      .catch(err => {
        console.error('Error fetching products:', err);
        setError('Failed to fetch products.');
      })
      .finally(() => setLoading(false));
  };

  const handleProductClick = (id) => {
    navigate(`/products/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 hidden md:block">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Search Products</h2>

      {/* Search Filters */}
      <div className="flex space-x-4 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition duration-300"
            >
              <div className="relative group overflow-hidden rounded-t-lg">
                <img
                  src={product.images?.[0]?.image || "https://via.placeholder.com/300"}
                  onClick={() => handleProductClick(product.id)}
                  alt={product.name}
                  className="w-full h-64 object-cover relative z-10 cursor-pointer"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 shadow-md p-2 rounded-full transition duration-300"
                >
                  <img
                    src={isWishlisted(product.id) ? wishlistFilled : wishlistOutline}
                    alt="Wishlist Icon"
                    className="w-5 h-5"
                  />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{product.description}</p>
                <p className="text-base font-bold text-gray-800">Tzs. {product.price}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No products found.</p>
      )}
    </div>
  );
};

export default SearchResults;
