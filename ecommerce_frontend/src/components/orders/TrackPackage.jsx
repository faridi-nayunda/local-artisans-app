import React, { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiTruck, FiPackage, FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight, FiShoppingBag
} from "react-icons/fi";

import AuthContext from "../../context/AuthContext";
import API from "../../utils/api";
import MessageModal from "../message/MessageModal";



const TrackPackage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens, logoutUser } = useContext(AuthContext);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);


  const DELIVERY_STAGES = [
    { id: "pending", label: "Order Placed" },
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "Shipped" },
    { id: "out_for_delivery", label: "Out for Delivery" },
    { id: "delivered", label: "Delivered" }
  ];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await API.get(`orders/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${authTokens?.access}`,
          },
        });
        const orderData = res.data;
        const transformed = {
          ...orderData,
          displayStatus: orderData.status.toLowerCase(),
          originalStatus: orderData.status,
          shipmentDetails: typeof orderData.shipment === "object" ? orderData.shipment : null
        };
        setOrder(transformed);
      } catch (err) {
        if (err.response?.status === 401) {
          logoutUser();
        }
        setError("Could not fetch order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusDetails = (status) => {
    switch (status) {
      case "pending":
        return { icon: <FiShoppingBag />, color: "bg-blue-100 text-blue-800", progress: 10 };
      case "processing":
        return { icon: <FiClock />, color: "bg-yellow-100 text-yellow-800", progress: 35 };
      case "shipped":
        return { icon: <FiTruck />, color: "bg-orange-100 text-orange-800", progress: 60 };
      case "out_for_delivery":
        return { icon: <FiTruck />, color: "bg-purple-100 text-purple-800", progress: 85 };
      case "delivered":
        return { icon: <FiCheckCircle />, color: "bg-green-100 text-green-800", progress: 100 };
      case "cancelled":
        return { icon: <FiAlertCircle />, color: "bg-red-100 text-red-800", progress: 0 };
      default:
        return { icon: <FiPackage />, color: "bg-gray-100 text-gray-800", progress: 0 };
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case "pending":
        return "Your order has been placed and is awaiting confirmation.";
      case "processing":
        return "Your order is being prepared for shipment.";
      case "shipped":
        return "Your package has been shipped.";
      case "out_for_delivery":
        return "Your package is with the delivery driver.";
      case "delivered":
        return "Your package was delivered.";
      case "cancelled":
        return "This order was cancelled.";
      default:
        return "Status unknown.";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-TZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentProgressIndex = () =>
    DELIVERY_STAGES.findIndex((s) => s.id === order.displayStatus);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error || !order) return <div className="text-red-500 p-6">{error || "No order found."}</div>;

  const statusDetails = getStatusDetails(order.displayStatus);
  const progressIndex = currentProgressIndex();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Track Your Package</h1>
        <p className="text-gray-500">Order #{order.id}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className={`${statusDetails.color} h-2`}
            style={{ width: `${statusDetails.progress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 mt-1">{getStatusDescription(order.displayStatus)}</div>
      </div>

      {/* Stepper */}
      <div className="space-y-4">
        {DELIVERY_STAGES.map((stage, index) => {
          const done = index < progressIndex;
          const current = index === progressIndex;
          const detail = getStatusDetails(stage.id);
          return (
            <div
              key={stage.id}
              className={`flex items-start space-x-3 p-3 rounded-md border ${
                current
                  ? "border-blue-500 bg-blue-50"
                  : done
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${detail.color}`}>
                {detail.icon}
              </div>
              <div>
                <p className={`font-semibold ${done || current ? "text-gray-900" : "text-gray-500"}`}>
                  {stage.label}
                </p>
                <p className="text-sm text-gray-500">
                  {current
                    ? getStatusDescription(stage.id)
                    : done
                    ? "Completed"
                    : "Upcoming"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-medium text-gray-800">Order Info</h3>
          <p className="text-sm text-gray-600">Placed: {formatDate(order.created_at)}</p>
          <p className="text-sm text-gray-600">Status: {order.originalStatus}</p>
          {order.tracking_number && (
            <p className="text-sm text-gray-600 mt-1">Tracking #: {order.tracking_number}</p>
          )}
        </div>

                {/* Shipping Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-medium text-gray-800 mb-3">Shipping Info</h3>

          {order.shipment ? (
            <>
              <p className="text-sm text-gray-700">
                <strong>Name:</strong> {order.shipment.shipping_full_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Phone:</strong> {order.shipment.shipping_phone || "N/A"}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Address:</strong> {order.shipment.shipping_address_line1}, {order.shipment.shipping_city}, {order.shipment.shipping_country}
              </p>
              {/* <p className="text-sm text-gray-700">
                <strong>Postal Code:</strong> {order.shipment.shipping_postal_code || "N/A"}
              </p> */}
            </>
          ) : (
            <p className="text-sm text-gray-600">Shipping details not available.</p>
          )}

          {/* Contact Seller */}
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

      <div className="mt-6">
        <Link
          to="/orders"
          className="inline-block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Back to Orders
        </Link>
      </div>
      {isMessageModalOpen && order?.seller_account?.user && (
        <MessageModal
          isOpen={isMessageModalOpen}
          seller={order.seller_account.user}
          onClose={() => setIsMessageModalOpen(false)}
          orderId={order.id}
        />
      )}

    </div>
  );
};

export default TrackPackage;
