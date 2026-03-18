import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartContext from "../../../context/CartContext";
import AuthContext from "../../../context/AuthContext";

const CartPage = () => {
  // Destructure loading from CartContext
  const { cart, removeFromCart, updateQuantity, loading } = useContext(CartContext);
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();

  // Ensure prices are treated as numbers
  const totalAmount = cart.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (authTokens) {
      // checkout();
      navigate("/checkout");
    } else {
      navigate("/login", { state: { from: "/cart" } });
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
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
              products
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate('/cart')} className="hover:text-blue-600">
              cart
            </button>
          </li>
        </ol>
      </nav>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 ">Your cart is empty</h3>
            <p className="mt-2 text-gray-700">
              Start adding some amazing products to your cart!
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ease-in duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {cart.length} {cart.length === 1 ? "Item" : "Items"} in Cart
              </h3>
            </div>

            <ul className="divide-y divide-gray-200">
              {cart.map((item) => {
                const price = Number(item.price);
                return (
                  <li key={item.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                        <img
                          className="w-50 h-50 rounded-md object-cover"
                          src={item.image}
                          alt={item.product_name}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div className="flex-1">
                            <h4 className="text-md font-medium text-gray-900">
                              {item.product_name}
                            </h4>
                            {/* <p className="mt-1 text-sm text-gray-500">
                              {item.category || "Generic Product"}
                            </p> */}

                            <p className="mt-5 text-base font-medium text-gray-700">
                              {item.product_description}
                            </p>
                            
                          </div>

                          <div className="mt-4 sm:mt-0 sm:ml-4">
                            <p className="text-lg font-semibold text-gray-900">
                              TZS {price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between sm:justify-start">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || loading}
                              className={`p-1 rounded-md ${item.quantity <= 1 || loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            <span className="mx-2 text-gray-700 min-w-[20px] text-center">
                              {loading ? '...' : item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={loading}
                              className={`p-1 rounded-md ${loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-4 text-sm font-medium text-red-600 hover:text-red-500 sm:ml-8"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <p>Subtotal</p>
                <p>TZS {totalAmount.toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCheckout}
                  className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Proceed to Checkout
                </button>
              </div>
              <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                <p>
                  or{" "}
                  <Link
                    to="/"
                    className="text-blue-600 font-medium hover:text-blue-500"
                  >
                    Continue Shopping
                    <span aria-hidden="true"> &rarr;</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;