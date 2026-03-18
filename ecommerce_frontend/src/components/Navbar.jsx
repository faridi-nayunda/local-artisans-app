import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaBars, FaUserCircle, FaSearch, FaStore, FaCommentAlt, FaTimes } from "react-icons/fa";
import { MdLocationOn } from 'react-icons/md';
import WishlistContext from "../context/WishlistContext";
import CartContext from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import wishlistIcon from "../assets/images/wishlist-filled.png";
import API from "../utils/api";

const Navbar = () => {
    const { wishlist } = useContext(WishlistContext);
    const { cart } = useContext(CartContext);
    const { logoutUser, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    // const [showTooltip, setShowTooltip] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [categories, setCategories] = useState([]);

    const wishlistCount = Object.values(wishlist).filter(Boolean).length;
    const cartCount = cart.length;

    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

    // Add new state for mobile account sidebar
    const [isAccountSidebarOpen, setIsAccountSidebarOpen] = useState(false);

    const toggleAccountSidebar = () => {
        setIsAccountSidebarOpen(!isAccountSidebarOpen);
    };

    // Close all mobile menus when navigating
    const closeAllMenus = () => {
        setIsAccountSidebarOpen(false);
        setMobileMenuOpen(false);
    };

    const handleWishlistClick = (e) => {
        if (!user) {
            e.preventDefault();
            navigate("/login");
        }
    };

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

    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSearchInput(value);

        if (value.length >= 3) {
            try {
                const response = await API.get(`products/search-suggestions?q=${value}`);
                setSearchSuggestions(response.data.map(item => item.name));
            } catch (error) {
                console.error("Error fetching search suggestions:", error);
            }
        } else {
            setSearchSuggestions([]);
        }
    };

    const handleSellCraftClick = (e) => {
        if (!user) {
            e.preventDefault();
            navigate("/login");
        }
    };
    
    const clearSearch = () => {
        setSearchInput("");
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        
        if (selectedCategory) {
            navigate(`/category/${selectedCategory}/?${params.toString()}`);
        } else {
            navigate("/products/");
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const searchQuery = searchInput.trim();
        const categoryQuery = selectedCategory;
        
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (categoryQuery) params.append("category", categoryQuery);
        
        if (searchQuery || categoryQuery) {
            if (categoryQuery) {
                navigate(`/category/${categoryQuery}/?${params.toString()}`);
            } else {
                navigate(`/products/?${params.toString()}`);
            }
        } else {
            navigate("/products/");
        }
    };

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        
        const params = new URLSearchParams();
        if (searchInput.trim()) params.append("q", searchInput.trim());
        if (categoryId) params.append("category", categoryId);
        
        if (categoryId) {
            navigate(`/category/${categoryId}/?${params.toString()}`);
        } else if (searchInput.trim()) {
            navigate(`/products/?${params.toString()}`);
        } else {
            navigate("/products/");
        }
    };

    return (
        <>
        <nav className="bg-white dark:bg-gray-900 shadow-md top-0 z-50">
        <div className="container mx-auto px-4">
            {/* Mobile Top Bar */}
            <div className="flex justify-between items-center md:hidden py-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMobileMenu}
                        className="text-green-800 dark:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Toggle menu"
                    >
                        <FaBars className="text-xl" />
                    </button>
                    <Link to="/" className="font-bold text-xl text-green-800 dark:text-white">
                        Handify
                    </Link>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* User Account */}
                    {user ? (
                        <button 
                            onClick={toggleAccountSidebar}
                            className="text-green-800 dark:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Account menu"
                        >
                            <FaUserCircle className="w-5 h-5 text-green-800 dark:text-white" />
                        </button>
                    ) : (
                        
                        <div className="flex items-center gap-1 text-green-800 dark:text-white">
                            <Link to="/login" className="text-sm text-blue-600 hover:underline">
                              Sign in
                            </Link>
                            <FaUserCircle className="w-5 h-5" />
                        </div>
                       
                    )}

                    {/* Wishlist */}
                    <div className="relative group">
                        <Link 
                            to="/wishlist" 
                            onClick={handleWishlistClick} 
                            className="text-blue-600 hover:underline"
                            aria-label={user ? "Your wishlist" : "Sign in to view wishlist"}
                        >
                            <img src={wishlistIcon} alt="Wishlist" className="w-5 h-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Shopping Cart */}
                    <Link 
                        to="/cart" 
                        className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Shopping cart"
                    >
                        <FaShoppingCart className="w-5 h-5 text-green-800 dark:text-white" />
                        {cartCount > 0 && (
                            <span className="absolute -top-0 -right-0 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="px-2 py-4 md:hidden">
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearchChange}
                            placeholder="Search products..."
                            className="w-full px-4 py-2 pr-10 rounded-full bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-green-600"
                        >
                            <FaSearch />
                        </button>
                    </div>
                </form>
            </div>


            {/* Mobile Menu Sidebar */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={toggleMobileMenu}
                    ></div>
                    
                    {/* Sidebar Content */}
                    <div className="absolute left-0 top-0 h-full w-3/4 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-center">
                                <Link 
                                    to="/" 
                                    className="font-bold text-xl text-green-800 dark:text-white"
                                    onClick={closeAllMenus}
                                >
                                    Handify
                                </Link>
                                <button
                                    onClick={toggleMobileMenu}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-2"
                                    aria-label="Close menu"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                        </div>
                        
                        {/* User Info Section */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            {user ? (
                        
                                <div>
                                   <h1 className="text-gray-800 dark:text-white text-lg font-semibold">Welcome to Handify</h1>
                                </div>
                              
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div>
                                       <h1 className="text-gray-800 dark:text-white text-lg font-semibold">Welcome to Artisan</h1>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            to="/login"
                                            className="px-3 py-1 hover:text-blue-600 hover:underline text-blue-500 rounded-md text-md"
                                            onClick={closeAllMenus}
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="px-3 py-1  hover:text-blue-600 hover:underline text-blue-500 rounded-md text-md"
                                            onClick={closeAllMenus}
                                        >
                                            Register
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Categories Section */}
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Categories</h3>
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        to={`/category/${cat.id}`}
                                        className="block px-3 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                        onClick={closeAllMenus}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <Link 
                                    to="/products" 
                                    className="block px-3 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                    onClick={closeAllMenus}
                                >
                                    All Categories
                                </Link>
                            </div>
                        </div>

                        {/* Additional Links */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <Link
                                to="#"
                                className="block px-3 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                About Us
                            </Link>
                            <Link
                                to="#"
                                className="block px-3 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                Contact
                            </Link>
                            <Link
                                to="#"
                                className="block px-3 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                Help Center
                            </Link>
                        </div>

                    </div>
                </div>
            )}

            {/* Mobile Account Sidebar */}
            {isAccountSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    {/* Overlay */}
                    <div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={toggleAccountSidebar}
                    ></div>
                    
                    {/* Sidebar Content */}
                    <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    My Account
                                </h2>
                                <button
                                    onClick={toggleAccountSidebar}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                    aria-label="Close account menu"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <FaUserCircle className="w-8 h-8 text-green-800 dark:text-white" />
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white">{user.first_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                       <FaUserCircle className="w-8 h-8 text-green-800 dark:text-white" />
                                        <Link
                                            to="/login"
                                            className="px-3 py-1 hover:text-blue-600 text-blue-500 rounded-md text-md"
                                            onClick={closeAllMenus}
                                        >
                                            Sign In
                                        </Link>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                        
                        <nav className="p-2">
                            {/* <Link
                                to="#"
                                className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                Profile
                            </Link> */}
                            <Link
                                to="/orders"
                                className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                Your Orders
                            </Link>
                            <Link
                                to="#"
                                className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                onClick={closeAllMenus}
                            >
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    logoutUser();
                                    closeAllMenus();
                                }}
                                className="w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </div>
            )}

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-col ">
                    {/* Top Row */}
                    <div className="flex justify-between items-center">
                        <Link to="/" className="font-bold text-2xl text-green-800 dark:text-white">
                            Handify
                        </Link>

                        {/* <div>
                            {user? (
                            <>
                                <span className="text-gray-900 text-sm font-semibold">Deliver to {user.first_name}</span>
                                <MdLocationOn className="text-2xl text-blue-600" />
                            </>
                            ):("")}
                        </div> */}

                         {/* Search Form */}
                         <form onSubmit={handleSearchSubmit} className="w-full md:w-2/3 lg:w-1/2 flex">
                            <select
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-1/3 min-w-[150px]"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    placeholder="Search products..."
                                    className="w-full px-4 py-2 pr-10 border-t border-b border-r border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                
                                {searchSuggestions.length > 0 && (
                                    <ul className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {searchSuggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                                                onClick={() => {
                                                    setSearchInput(suggestion);
                                                    setSearchSuggestions([]);
                                                    const params = new URLSearchParams();
                                                    params.append("q", suggestion);
                                                    if (selectedCategory) params.append("category", selectedCategory);
                                                    
                                                    if (selectedCategory) {
                                                        navigate(`/category/${selectedCategory}/?${params.toString()}`);
                                                    } else {
                                                        navigate(`/products/?${params.toString()}`);
                                                    }
                                                }}
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                                <div className="absolute right-0 top-0 h-full flex items-center pr-2 space-x-1">
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="text-gray-500 dark:text-gray-400 hover:text-red-500"
                                            aria-label="Clear search"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="text-gray-500 dark:text-gray-400 hover:text-green-600"
                                        aria-label="Search"
                                    >
                                        <FaSearch />
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {user ? (
                                    <>
                                        <button
                                            onClick={toggleDropdown}
                                            className="flex items-center gap-2 text-green-800 dark:text-white  transition"
                                        >
                                            <FaUserCircle className="w-6 h-6" />
                                            <span>Hello, {user.first_name}</span>
                                        </button>
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                                                {/* <Link
                                                    to="#"
                                                    className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                    onClick={closeAllMenus}
                                                >
                                                    Profile
                                                </Link> */}
                                                <Link
                                                    to="/orders"
                                                    className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                    onClick={closeAllMenus}
                                                >
                                                    Your Orders
                                                </Link>
                                                <Link
                                                    to="#"
                                                    className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                    onClick={closeAllMenus}
                                                >
                                                    Account Settings
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        logoutUser();
                                                        closeAllMenus();
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-gray-800 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-green-800 dark:text-white">
                                        Hello,{" "}
                                        <Link to="/login" className="text-blue-600 hover:underline">
                                            Sign in
                                        </Link>{" "}
                                        or{" "}
                                        <Link to="/register" className="text-blue-600 hover:underline">
                                            Register
                                        </Link>
                                    </div>
                                )}
                                
                            </div>

                            <div className="flex items-center gap-4">
                               {/* Wishlist Icon with Count */}
                                <div className="relative group">
                                <Link 
                                    to="/wishlist" 
                                    onClick={handleWishlistClick} 
                                    className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {/* Wishlist Icon */}
                                    <div className="relative">
                                    <img src={wishlistIcon} alt="Wishlist" className="w-6 h-6" />
                                    {/* Count Badge */}
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform transition-all duration-200 z-10">
                                        {wishlistCount}
                                        </span>
                                    )}
                                    </div>
                                </Link>
                                {/* Tooltip */}
                                <div className="hidden group-hover:block absolute left-1/2 -bottom-8 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-green-800 rounded whitespace-nowrap z-20">
                                    {!user ? "Sign in to view" : "Your wishlist"}
                                </div>
                                </div>

                                <Link 
                                    to="/cart" 
                                    className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <FaShoppingCart className="w-6 h-6 text-green-800 dark:text-white" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        {/* Bottom Action Bar */}
        <div className="bg-green-700 dark:bg-gray-800 shadow-md">
            <div className="container mx-auto px-4">
            <div className="flex justify-start items-center space-x-4 py-2 overflow-x-auto">
                <Link
                to="/seller-account"
                onClick={handleSellCraftClick}
                className="flex items-center px-4 py-2 text-sm font-semibold text-white dark:hover:text-green-500 ease-in-out  duration-200 dark:text-white rounded-lg transition-colors whitespace-nowrap"
                >
                <FaStore className="mr-2" />
                Sell Your Craft
                </Link>
                <Link
                to="/messages"
                className="flex items-center px-4 py-2 text-sm font-semibold text-white  dark:hover:text-green-500 ease-in-out  duration-200 dark:text-white rounded-lg transition-colors whitespace-nowrap"
                >
                <FaCommentAlt className="mr-2" />
                Messages
                </Link>
            </div>
            </div>
        </div>
    </>
    );
};

export default Navbar;