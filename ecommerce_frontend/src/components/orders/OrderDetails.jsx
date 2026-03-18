import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import API from "../../utils/api";
import { 
  FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle,
  FiMapPin, FiPhone, FiMail, FiCreditCard, FiPrinter, FiFileText,
  FiUser, FiMessageSquare
} from "react-icons/fi";
import MessageModal from "../message/MessageModal";
import ConfirmationModal from "../ConfirmationModal";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const { authTokens, logoutUser, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // function to handle order cancellation
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

  // function to handle product click
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatMoney = (amount) => `TZS ${amount?.toLocaleString() || '0'}`;

  const getDeliveryInfo = (order) => {
    if (!order) return null;
    const created = new Date(order.created_at);
    const orderDate = new Date(created);

    switch (order.status.toLowerCase()) {
      case 'completed':
        return {
          icon: <FiCheckCircle className="text-green-500 mr-2" />, 
          primary: `Delivered on ${orderDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}`,
          secondary: null,
          color: 'text-green-600'
        };
      case 'shipped': {
        const deliveryDate = new Date(created);
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        return {
          icon: <FiTruck className="text-blue-500 mr-2" />, 
          primary: `Expected delivery: ${deliveryDate.toDateString()}`,
          secondary: `Shipped with ${order.shipment?.carrier || 'standard shipping'}`,
          color: 'text-blue-600'
        };
      }
      case 'processing': {
        const start = new Date(created);
        const end = new Date(created);
        start.setDate(start.getDate() + 3);
        end.setDate(end.getDate() + 5);
        return {
          icon: <FiClock className="text-yellow-500 mr-2" />, 
          primary: `Arriving ${start.toDateString()} - ${end.toDateString()}`,
          secondary: 'Preparing for shipment',
          color: 'text-yellow-600'
        };
      }
      case 'pending':
        return {
          icon: <FiPackage className="text-gray-500 mr-2" />, 
          primary: 'Order received',
          secondary: 'We will notify you when available',
          color: 'text-gray-600'
        };

        case 'cancelled':
        return {
          icon: <FiPackage className="text-gray-500 mr-2" />, 
          primary: 'Not applicable (order cancelled)',
          secondary: '',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <FiClock className="text-gray-500 mr-2" />, 
          primary: 'Order processing',
          secondary: '',
          color: 'text-gray-600'
        };
    }
  };

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
        if (err.response?.status === 401) logoutUser();
        setError("There was an error fetching your order.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, authTokens, logoutUser]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full"></div></div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!order) return <div className="p-6 text-gray-600">Order not found.</div>;

  const deliveryInfo = getDeliveryInfo(order);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
        </div>

        {/* Delivery Info */}
        {deliveryInfo && (
          <div className="p-6 bg-blue-50 border-b">
            <div className="flex items-start">
              {deliveryInfo.icon}
              <div>
                <p className={`text-lg font-semibold ${deliveryInfo.color}`}>{deliveryInfo.primary}</p>
                <p className="text-sm text-gray-600">{deliveryInfo.secondary}</p>
                {order.tracking_number && (
                  <a 
                    href={`https://tracking.com/?track=${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:underline"
                  >
                    <FiTruck className="mr-1" />
                    Track Package #{order.tracking_number}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seller Information */}
        {order.seller_account && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center mb-3">
              <FiUser className="mr-2" />
              Seller Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Business Name</h4>
                <p>{order.seller_account?.profile?.business_name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Contact</h4>
                {order.seller_account?.user?.email && (
                  <div className="mt-4">
                    <button
                      onClick={() => setIsMessageModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Contact Seller
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isMessageModalOpen && order?.seller_account?.user && (
        <MessageModal
          isOpen={isMessageModalOpen}
          seller={order.seller_account.user}
          onClose={() => setIsMessageModalOpen(false)}
          orderId={order.id}
        />
      )}

        {/* Order Items */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">Items in Your Order</h2>
          
            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                 <img 
                  src={item.image || 'https://via.placeholder.com/150'} 
                  className="w-24 h-24 object-cover rounded border" 
                  alt={item.product_name} 
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-gray-800 font-medium">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                </div>

                {/* Item Actions */}
                  <div className="flex flex-col gap-y-2 mt-4">
                    {/* Track Package */}
                    {order.status !== "cancelled" && (
                      <Link
                        to={`/orders/track/${order.id}`}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiTruck className="mr-2" />
                        Track Package
                      </Link>
                    )}

                    {/* Buy it Again */}
                    <button 
                      // onClick={() => handleProductClick(item.id)}
                      onClick={() => navigate('/')}
                      className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FiPackage className="mr-2" />
                      Buy it again
                    </button>

                    {/* Delivered Only Actions */}
                    {order.status === 'delivered' && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          Return window closes on {new Date(order.delivered_at).setDate(new Date(order.delivered_at).getDate() + 30).toDateString()}
                        </p>
                        <div className="flex flex-col gap-y-2">
                          {/* Return Items */}
                          <button className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400">
                            <FiXCircle className="mr-2" />
                            Return Items
                          </button>

                          {/* Request Replacement */}
                          <button className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400">
                            <FiRefreshCw className="mr-2" />
                            Request Replacement
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            ))}
        </div>

        {/* Shipping Information */}
        <div className="p-6 border-b grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold flex items-center mb-2">
              <FiMapPin className="mr-2" /> 
              Shipping Address
            </h3>
            <p>{order.shipment?.shipping_full_name || 'Not provided'}</p>
            <p>{order.shipment?.shipping_address_line1}</p>
            <p>{order.shipment?.shipping_city}, {order.shipment?.shipping_state}</p>
            <p>{order.shipment?.shipping_country}, {order.shipment?.shipping_postal_code}</p>
          </div>
          <div>
            <h3 className="font-semibold flex items-center mb-2">
              <FiPhone className="mr-2" /> 
              Contact Info
            </h3>
            <p>{order.shipment?.shipping_phone || 'N/A'}</p>
            <p>{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="p-6 border-b">
          <h3 className="font-semibold flex items-center mb-2">
            <FiCreditCard className="mr-2" /> 
            Payment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Method:</p>
              <p>{order.payment?.payment_method || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <p>{order.payment?.payment_status || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span>{formatMoney(order.shipping_cost)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600">-{formatMoney(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">{formatMoney(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
          <div className="space-x-4">
            <Link 
              to={`/orders/${order.id}/#`} 
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <FiFileText className="mr-1" /> 
              View Invoice
            </Link>
            <button className="inline-flex items-center text-sm text-blue-600 hover:underline">
              <FiPrinter className="mr-1" />
              Print Receipt
            </button>
          </div>
          
          {/* cancel button */}
          <div className="space-x-4">
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
            <Link 
              to="/orders" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Back 
            </Link>
          </div>
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

export default OrderDetails;