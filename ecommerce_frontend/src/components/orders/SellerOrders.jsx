import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';
import {
  FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle,
  FiUser, FiCalendar, FiFilter, FiSearch, FiRefreshCw
} from 'react-icons/fi';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const response = await API.get('/orders/');
      if (!Array.isArray(response.data)) throw new Error('Invalid data format');
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error loading orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.patch(`/orders/${orderId}/update_status/`, { status: newStatus });
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update order status.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    const map = {
      completed: <FiCheckCircle className="mr-1" />,
      cancelled: <FiXCircle className="mr-1" />,
      shipped: <FiTruck className="mr-1" />,
      processing: <FiRefreshCw className="mr-1" />,
    };
    return map[status.toLowerCase()] || <FiClock className="mr-1" />;
  };

  const getStatusColor = (status) => {
    const map = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      shipped: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
    };
    return map[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <FiXCircle className="text-red-500 mt-1 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error loading orders</h3>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-3 inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <FiRefreshCw className="mr-1" /> Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-2 sm:p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <h1 className="text-lg sm:text-xl font-bold flex items-center">
            <FiPackage className="mr-2" /> Your Orders
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border-b border-gray-200">
          <div className="relative flex-1 min-w-[120px]">
            <FiSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[150px]">
            <FiFilter className="absolute top-3 left-3 text-gray-400" />
            <select
              className="w-full pl-9 pr-9 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm text-left divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-3 w-[80px]">Order #</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[120px]">Customer</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 w-[100px]">Date</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 w-[100px]">Amount</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[120px]">Status</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3 min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {/* Order # */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 truncate max-w-[80px]">
                    #{order.id}
                  </td>
                  
                  {/* Customer */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 truncate max-w-[120px]">
                    <div className="flex items-center">
                      <FiUser className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{order.username || 'Guest'}</span>
                    </div>
                  </td>
                  
                  {/* Date */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-500 truncate max-w-[100px]">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  
                  {/* Amount */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-semibold text-gray-800 truncate max-w-[100px]">
                    TZS {order.total_price.toLocaleString()}
                  </td>
                  
                  {/* Status */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 truncate max-w-[120px]">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} truncate`}>
                        {getStatusIcon(order.status)} <span className="truncate">{order.status}</span>
                      </span>
                      {order.status.toLowerCase() === 'shipped' && order.tracking_number && (
                        <div className="text-xs text-gray-500 truncate">Track: {order.tracking_number}</div>
                      )}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-3 py-2 sm:px-4 sm:py-3 max-w-[120px]">
                    <div className="flex flex-col gap-1">
                      {['pending', 'processing'].includes(order.status.toLowerCase()) && (
                        <button
                          onClick={() => updateStatus(order.id, 'shipped')}
                          className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 truncate"
                        >
                          Ship Order
                        </button>
                      )}
                      {!['cancelled', 'completed'].includes(order.status.toLowerCase()) && (
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 truncate"
                        >
                          Cancel
                        </button>
                      )}
                      <Link
                        to={`/seller/orders/${order.id}`}
                        className="inline-block text-indigo-600 hover:underline text-xs truncate"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-6 sm:p-8 text-center">
            <FiSearch className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;