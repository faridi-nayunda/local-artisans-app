import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import API from "../../utils/api";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiShoppingBag,
  FiArrowRight,
  FiCalendar,
  FiUser,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiFilter
} from "react-icons/fi";
import ConfirmationModal from "../ConfirmationModal";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelOrder = async (orderId) => {
  setSelectedOrderId(orderId);
  setIsCancelModalOpen(true);
};

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await API.patch(`/orders/${selectedOrderId}/update_status/`, {
        status: "cancelled",
      });

      if (response.status === 200) {
        fetchOrders(); // Refresh order list
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      // You might want to show a toast notification here instead of alert
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
      setSelectedOrderId(null);
    }
  };



  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      if (!authTokens) {
        setError("You need to log in first.");
        setLoading(false);
        return;
      }

      const response = await API.get("orders/");
      const sortedOrders = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        logoutUser();
      } else {
        setError("There was an error fetching your orders.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [authTokens, logoutUser]);

  useEffect(() => {
    const filtered = orders.filter(order => {
      // Search filter
      const matchesSearch = 
        order.id.toString().includes(searchTerm.toLowerCase()) ||
        (order.items?.some(item => 
          item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        statusFilter === "all" || 
        order.status.toLowerCase() === statusFilter.toLowerCase();
      
      // Date filter
      const matchesDate = () => {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        switch(dateFilter) {
          case "last30":
            return orderDate >= thirtyDaysAgo;
          case "last6months":
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            return orderDate >= sixMonthsAgo;
          case "2023":
            return orderDate.getFullYear() === 2023;
          case "2024":
            return orderDate.getFullYear() === 2024;
          default:
            return true;
        }
      };

      return matchesSearch && matchesStatus && matchesDate();
    });

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, dateFilter, orders]);

  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    const options = { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiShoppingBag className="mr-1" />;
      case "processing":
        return <FiRefreshCw className="mr-1 animate-spin" />;
      case "shipped":
        return <FiTruck className="mr-1" />;
      case "delivered":
        return <FiCheckCircle className="mr-1" />;
      case "cancelled":
        return <FiXCircle className="mr-1" />;
      default:
        return <FiClock className="mr-1" />;
    }
  };

  const getEstimatedDelivery = (order) => {
  const { status, created_at } = order;
  const orderDate = new Date(created_at);

  // 1. Delivered Orders
  if (status === "delivered") {
    return {
      primary: `Delivered on ${orderDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`,
      secondary: null
    };
  }

  // 2. Cancelled Orders
  if (status === "cancelled") {
    return {
      primary: "Not applicable (order cancelled)",
      secondary: null
    }; 
  }

  // 3. Shipped Orders
  if (status === "shipped") {
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 3);
    return {
      primary: `Expected delivery: ${deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })}`,
      secondary: null
    };
  }

  // 4. Out for Delivery
  if (status === "out_for_delivery") {
    return {
      primary: "Arriving today by 8 PM",
      secondary: null
    };
  }

  // 5. Processing Orders
  if (status === "processing") {
    const startDate = new Date(orderDate);
    startDate.setDate(orderDate.getDate() + 3);
    const endDate = new Date(orderDate);
    endDate.setDate(orderDate.getDate() + 5);
    
    return {
      primary: `Arriving ${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })}`,
      secondary: "Preparing for shipment"
    };
  }

  // 6. Pending/Placed Orders (Amazon-style messaging)
  if (status === "pending") {
    return {
      primary: "Not yet shipped",
      secondary: "We will notify you when available"
    };
  }

  return null;
};

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiXCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
              <div className="mt-4">
                <button
                  onClick={fetchOrders}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiRefreshCw className="mr-1" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <FiPackage className="h-12 w-12" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No orders found
          </h3>
          <p className="mt-2 text-gray-500">
            You haven't placed any orders yet.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Your Order History
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track and manage all your purchases
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders by ID, product, or status..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Placed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Dates</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              disabled={refreshing}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                refreshing ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          {filteredOrders.length === 0 && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const hasItems = order.items && order.items.length > 0;

              const firstItem = hasItems
                ? {
                    product_name:
                      order.items[0].product_name ||
                      order.items[0].product?.name ||
                      "Product not available",
                    product_description:
                      order.items[0].product_description ||
                      order.items[0].product?.product_description ||
                      "Description not available",
                    quantity: order.items[0].quantity || 0,
                    image:
                      order.items[0].image ||
                      order.items[0].product?.images?.[0]?.image ||
                      "https://via.placeholder.com/150",
                  }
                : {
                    product_name: `Order #${order.id}`,
                    quantity: 1,
                    image: "https://via.placeholder.com/150",
                    isPlaceholder: true,
                  };

              const itemCount = order.items?.reduce(
                (total, item) => total + (item.quantity || 1),
                0
              ) || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Order Header */}
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <FiPackage className="mr-2 text-blue-600" />
                          ORDER #{order.id}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 flex items-center">
                          <FiCalendar className="mr-1.5" />
                          Placed on {formatDateTime(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <p className="text-sm text-gray-500 flex items-center">
                          <FiUser className="mr-1.5" />
                          Ship to {user?.first_name || "Customer"}
                        </p>
                        {/* <span
                          className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.toUpperCase()}
                        </span> */}
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="px-4 py-5 sm:p-6">
                    <div className="mb-4">
                      {getEstimatedDelivery(order) && (
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900 text-lg font-semibold">
                            <FiPackage className="mr-2" />
                            {getEstimatedDelivery(order).primary}
                          </div>
                          {getEstimatedDelivery(order).secondary && (
                            <div className="mt-1 text-gray-500 text-xs ml-6">
                              <span className="text-green-700 text-md font-semibold">{getEstimatedDelivery(order).secondary}</span>
                            </div>
                          )}
                        </div>
                      )}  
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          className="w-32 h-32 object-contain rounded-lg bg-gray-100 border border-gray-200"
                          src={firstItem.image}
                          alt={firstItem.product_name}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {firstItem.product_name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            TZS {order.total_price?.toLocaleString() || "0"}
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {firstItem.product_description}
                        </p>

                        {order.items?.length > 1 && (
                          <p className="mt-2 text-sm text-gray-500">
                            + {order.items.length - 1} more product
                            {order.items.length - 1 !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                          <FiArrowRight className="ml-1.5" />
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-4">
                      {/* Cancel Order button  */}
                      {order.status !== "shipped" && order.status !== 'cancelled' && order.status !== 'out_for_delivery' && order.status !== 'delivered' && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          disabled={isCancelling && selectedOrderId === order.id}
                        >
                          {isCancelling && selectedOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                        {order.payment?.payment_method &&
                          order.status === "placed" && (
                            <button
                              type="button"
                              className="text-sm font-medium text-gray-600 hover:text-gray-500"
                            >
                              Pre-pay Now
                            </button>
                          )}
                        {/* <Link
                          to={`/orders/${order.id}`}
                          className="text-sm font-medium text-gray-600 hover:text-gray-500 flex items-center"
                        >
                          <FiFileText className="mr-1.5" />
                          Invoice
                        </Link> */}

                        {order.status !== "cancelled" && (
                          <Link
                            to={`/orders/track/${order.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FiTruck className="mr-1.5" />
                            Track Package
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No orders match your search
              </h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
       {/* Confirmation Modal */}
      <ConfirmationModal
      isOpen={isCancelModalOpen}
      onClose={() => {
        setIsCancelModalOpen(false);
        setSelectedOrderId(null);
      }}
      onConfirm={handleConfirmCancel}
      title="Cancel Order"
      message="Are you sure you want to cancel this order? This action cannot be undone."
      confirmText={isCancelling ? "Cancelling..." : "Confirm"}
      cancelText="Go Back"
      isConfirming={isCancelling}
    />
    </div>
  );
};

export default OrderHistory;