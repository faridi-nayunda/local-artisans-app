import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Auth pages
import CustomerRegistrationForm from "./components/auth/CustomerRegistrationForm";
import SellerRegistrationForm from "./components/auth/SellerRegistrationForm";
import LoginForm from "./components/auth/LoginForm";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// Profile
import ProfileForm from "./components/profiles/ProfileForm";
import SellerProfile from "./components/profiles/SellerProfile";

// Product-related pages
import ProductDetails from "./components/products/ProductDetails";
import ProductList from "./components/products/ProductList";
import ProductForm from "./components/products/ProductForm";
import SearchResults from "./components/products/product-categories/SearchResults";
import CartPage from "./components/products/cart/CartPage";
import WishlistPage from "./components/products/wishlist/WishlistPage";

// Orders
import OrderHistory from "./components/orders/OrderHistory";
import OrderDetails from "./components/orders/OrderDetails";
import AdminOrders from "./components/orders/AdminOrders";
import SellerOrders from "./components/orders/SellerOrders";

// payment
import Payment from "./components/payments/Payment";

// dashboards
import SellerDashboard from "./components/dashboards/SellerDashboard";
import DashboardOverview from "./components/dashboards/DashboardOverview";
import SellerOrderDetails from "./components/orders/SellerOrderDetails";
import TrackPackage from "./components/orders/TrackPackage";
import MessageInbox from "./components/message/MessageInbox";
import MessageDetail from "./components/message/MessageDetail";
import SellerInbox from "./components/message/SellerInbox";
import VerifyOtp from "./components/auth/VerifyOtp";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; // Import styles at the top

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
            <WishlistProvider>
              {/* ToastContainer */}
              <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} />

              <Routes>
                <Route path="/" element={<ProductList/>} />
                <Route path="/products/:productId" element={<ProductDetails />} />
                <Route path="/register" element={<CustomerRegistrationForm />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                
                <Route path="/productform" element={<ProductForm />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/category/:id" element={<ProductList />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/cart" element={<CartPage/>} />
                
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/orders/track/:orderId" element={<TrackPackage />} />
                <Route path="/orders/:orderId" element={<OrderDetails />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                
                <Route path="/messages" element={<MessageInbox />} />
                <Route path="/messages/:threadId" element={<MessageDetail />} />
                
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<Payment />} />
                <Route path="/profile-form" element={<ProfileForm />} />
                <Route path="/seller-account" element={<SellerRegistrationForm />} />

                
                {/* Seller Dashboard Routes */}
                <Route path="/seller" element={<SellerDashboard />}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="product-form" element={<ProductForm />} />
                  <Route path="inbox" element={<SellerInbox />} />
                   <Route path="product-form/:id" element={<ProductForm />} />
                   <Route path="profile" element={<SellerProfile />} />
                  <Route path="orders/new" element={<SellerOrders />} />
                  <Route path="/seller/orders/:orderId" element={<SellerOrderDetails />} />
                </Route>
              </Routes>
            </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;