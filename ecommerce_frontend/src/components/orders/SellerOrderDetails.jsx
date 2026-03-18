import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import API from "../../utils/api";
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

const SellerOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens, logoutUser, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!authTokens) {
          setError("You need to log in first.");
          setLoading(false);
          return;
        }

        const response = await API.get(`orders/${orderId}/`);
        setOrder(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          logoutUser();
        } else if (err.response?.status === 404) {
          setError("Order not found.");
        } else {
          setError("There was an error fetching your order.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, authTokens, logoutUser]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.patch(`/orders/${orderId}/update_status/`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <FiCheckCircle className="text-green-500 mr-2" />;
      case 'shipped': return <FiTruck className="text-blue-500 mr-2" />;
      case 'cancelled': return <FiXCircle className="text-red-500 mr-2" />;
      default: return <FiClock className="text-yellow-500 mr-2" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        {error.includes("log in") && (
          <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Log In
          </Link>
        )}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <FiPackage className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Order not found</h3>
        <div className="mt-6">
          <Link to="/orders" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">View order details</h1>
            <p className="text-gray-500 mt-1">Order ID: #{order.id}</p>
          </div>
          <div className="flex items-center">
            {getStatusIcon(order.status)}
            <span className={`ml-1 font-semibold capitalize ${
              order.status === 'delivered' ? 'text-green-600' :
              order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
            }`}>{order.status}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
          <div className="space-y-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row">
                <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                  <img src={item.image || "https://via.placeholder.com/150"} alt={item.product_name} className="w-24 h-24 rounded-md object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{item.product_name}</h3>
                  <p className="text-gray-600 mt-1">{item.product_description}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-semibold">TZS {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
          <p className="text-lg font-semibold text-green-700 mb-2">
            {order.status === 'shipped' ? 'Shipped' :
             order.status === 'completed' ? 'Delivered' :
             order.status === 'cancelled' ? 'Cancelled' :
             'Not yet shipped'}
          </p>
          <div className="text-sm text-gray-700">
            {order.shipment ? (
              <>
                <p>{order.shipment.shipping_full_name}</p>
                <p>{order.shipment.shipping_address_line1}</p>
                {order.shipment.shipping_address_line2 && <p>{order.shipment.shipping_address_line2}</p>}
                <p>{order.shipment.shipping_city}, {order.shipment.shipping_state}</p>
                <p>{order.shipment.shipping_country}, {order.shipment.shipping_postal_code}</p>
              </>
            ) : (
              <p className="italic text-gray-500">No shipping details available.</p>
            )}
          </div>
        </div>

        {/* Buyer Contact */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Buyer Contact</h2>
          <p>Name: {order.user.first_name || 'N/A'}</p>
          <p>Email: {order.user?.email  || 'Hidden for privacy'}</p>
        </div>

        {/* Payment Info */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
          <div className="flex justify-between text-sm text-gray-700">
            <span>Method:</span>
            <span>{order.payment?.payment_method || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 mt-1">
            <span>Status:</span>
            <span>{order.payment?.payment_status || 'N/A'}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>TZS {order.subtotal?.toLocaleString() || order.total_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>TZS {order.shipping_cost?.toLocaleString() || '0'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-green-600">-TZS {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>TZS {order.total_price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex justify-end space-x-4 bg-gray-50">
          {['pending', 'processing'].includes(order.status) && (
            <button
              onClick={() => updateStatus(order.id, 'shipped')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
            >
              Mark as Shipped
            </button>
          )}
          {/* <Link to="/orders" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
            Back to Orders
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default SellerOrderDetails;
