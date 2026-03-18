import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBox,
  FiClock,
  FiUser,
  FiShoppingCart,
  FiTag,
  FiMessageSquare,
} from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';

const DashboardOverview = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    recentOrders: [],
    recentActivity: [],
    error: null,
  });

  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await API.get('/orders/');
      const recentOrders = Array.isArray(response.data)
        ? response.data.slice(0, 5) // limit to latest 5
        : [];

      setDashboardData({
        loading: false,
        recentOrders,
        recentActivity: [], // optional, or fetch separately
        error: null,
      });
    } catch (err) {
      setDashboardData({
        loading: false,
        recentOrders: [],
        recentActivity: [],
        error: 'Failed to load recent orders.',
      });
    }
  };

  fetchData();
}, []);


  const formatDate = (date) =>
    date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    

  const getStatusBadge = (status) => {
  const statusMap = {
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
      {status?.toUpperCase()}
    </span>
  );
};


  const getActivityIcon = (type) => {
    const icons = {
      order: <FiShoppingCart className="h-4 w-4" />,
      review: <FiUser className="h-4 w-4" />,
      promotion: <FiTag className="h-4 w-4" />,
    };
    const styles = {
      order: 'bg-green-100 text-green-600',
      review: 'bg-blue-100 text-blue-600',
      promotion: 'bg-purple-100 text-purple-600',
    };
    return (
      <div className={`p-2 rounded-full mr-4 ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
        {icons[type] || <FiMessageSquare />}
      </div>
    );
  };

  const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};


  const DashboardCard = ({ title, icon, iconBg, items, link, linkLabel }) => (
    <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm text-gray-500">{title}</h3>
          {items.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-800 font-medium mt-1">
              {item.label}: <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
        <div className={`p-3 rounded-full ${iconBg}`}>
          {icon}
        </div>
      </div>
      <Link
        to={link}
        className="block text-sm text-indigo-600 mt-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );


  if (dashboardData.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-red-600 text-lg mb-4">{dashboardData.error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
 
// Orders breakdown
const totalOrders = dashboardData.recentOrders.length;
const pendingOrders = dashboardData.recentOrders.filter(o => o.status === 'pending').length;
const shippedOrders = dashboardData.recentOrders.filter(o => o.status === 'shipped').length;
const cancelledOrders = dashboardData.recentOrders.filter(o => o.status === 'cancelled').length;

// Revenue
const totalRevenue = dashboardData.recentOrders
  .filter(o => o.status === 'completed')
  .reduce((sum, order) => sum + (order.total_price || 0), 0);

// For now, mock values for inventory & messages (replace with real data later)
const inventoryCount = 18;
const outOfStock = 3;

const unreadMessages = 0;
const newReviews = 0;

  return (
    <div className="bg-gray-100 min-h-screen px-4 md:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.first_name || user.username}</h1>
        <p className="text-gray-600 mt-1">Here’s your business at a glance today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Orders"
          icon={<FiShoppingCart className="h-5 w-5" />}
          iconBg="bg-green-100 text-green-600"
          items={[
            { label: 'Total Orders', value: totalOrders },
            { label: 'Pending', value: pendingOrders },
            { label: 'Shipped', value: shippedOrders },
            { label: 'Cancelled', value: cancelledOrders },
          ]}
          link="orders/new"
          linkLabel="Manage Orders"
        />

        <DashboardCard
          title="Inventory"
          icon={<FiBox className="h-5 w-5" />}
          iconBg="bg-indigo-100 text-indigo-600"
          items={[
            { label: 'Total Products', value: inventoryCount },
            { label: 'Out of Stock', value: outOfStock },
          ]}
          link="/seller/profile"
          linkLabel="Manage Inventory"
        />

        {/* <DashboardCard
          title="Revenue"
          icon={<FiTag className="h-5 w-5" />}
          iconBg="bg-blue-100 text-blue-600"
          items={[
            { label: 'Total', value: `TZS ${totalRevenue.toLocaleString()}` },
            { label: 'This Month', value: `TZS 700,000` }, // Replace with real logic if available
          ]}
          link="/seller/reports/sales"
          linkLabel="Sales Report"
        /> */}

        <DashboardCard
          title="Messages & Reviews"
          icon={<FiMessageSquare className="h-5 w-5" />}
          iconBg="bg-purple-100 text-purple-600"
          items={[
            { label: 'Unread Messages', value: unreadMessages },
            { label: 'New Reviews', value: newReviews },
          ]}
          link="/seller/inbox"
          linkLabel="View Messages"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <Link to="orders/new" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Order #</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {dashboardData.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">#{order.id}</td>
                  <td className="px-4 py-3">{order.username || 'Guest'}</td>
                  <td className="px-4 py-3">{formatDate(new Date(order.created_at))}</td>
                  <td className="px-4 py-3">TZS {order.total_price?.toLocaleString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/seller/orders/${order.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {dashboardData.recentActivity.map((activity, idx) => (
            <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-md shadow-sm">
              {getActivityIcon(activity.type)}
              <div>
                <p className="font-medium text-gray-800">{activity.message}</p>
                <p className="text-sm text-gray-600">{activity.details}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
