// src/components/SellerDashboard.jsx
import React, { useState, useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiShoppingBag, FiPercent, 
  FiBarChart2, FiSettings, FiChevronDown, 
  FiChevronRight, FiMenu, FiX, FiBell, FiUser
} from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';

const SellerDashboard = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Initialize with sample data
  const { logoutUser, user } = useContext(AuthContext);

  

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const navItems = [
    {
      title: 'Dashboard',
      icon: <FiHome className="text-lg" />,
      path: '/seller',
      isAccordion: false
    },
    {
      title: 'Inventory',
      icon: <FiPackage className="text-lg" />,
      isAccordion: true,
      subItems: [
        { title: 'Add Products', path: '/seller/product-form' },
        // { title: 'Categories', path: '/seller/categories' },
        // { title: 'Collections', path: '/seller/collections' },
        { title: 'Listed Products', path: '/seller/profile' }
      ]
    },
    {
      title: 'Orders',
      icon: <FiShoppingBag className="text-lg" />,
      isAccordion: true,
      subItems: [
        { title: 'New Orders', path: '/seller/orders/new' },
        // { title: 'Order History', path: '/seller/orders' },
        // { title: 'Returns & Refunds', path: '/seller/orders/returns' },
        // { title: 'Shipping Settings', path: '/seller/shipping' }
      ]
    },
    // {
    //   title: 'Marketing',
    //   icon: <FiPercent className="text-lg" />,
    //   isAccordion: true,
    //   subItems: [
    //     { title: 'Promotions', path: '/seller/promotions' },
    //     { title: 'Discounts', path: '/seller/discounts' },
    //     { title: 'Marketing Tools', path: '/seller/marketing' }
    //   ]
    // },
    // {
    //   title: 'Reports',
    //   icon: <FiBarChart2 className="text-lg" />,
    //   isAccordion: true,
    //   subItems: [
    //     { title: 'Sales', path: '/seller/reports/sales' },
    //     { title: 'Customers', path: '/seller/reports/customers' },
    //     { title: 'Performance', path: '/seller/reports/performance' }
    //   ]
    // },
    {
      title: 'Settings',
      icon: <FiSettings className="text-lg" />,
      path: '#',
      isAccordion: false
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-30 w-64 bg-indigo-700 text-white transform transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-600">
          <h1 className="text-xl font-bold">Handify</h1>
          <button 
            className="md:hidden p-1 rounded-md hover:bg-indigo-600"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-indigo-600">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <FiUser className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Welcome back</p>
              <p className="text-sm text-indigo-200">{user.first_name || user.username}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 128px)' }}>
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.isAccordion ? (
                  <div>
                    <button
                      onClick={() => toggleAccordion(index)}
                      className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${activeAccordion === index ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {activeAccordion === index ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {activeAccordion === index && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.path}
                              className="block px-3 py-2 text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                              onClick={() => setSidebarOpen(false)}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-600 transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}
              </li>
            ))}

          <button
            onClick={() => {
            logoutUser();
            }}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Sign Out
          </button>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button 
                className="p-2 mr-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <FiMenu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">Seller Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* <div className="relative">
                <button 
                  className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                  onClick={() => setUnreadNotifications(0)}
                >
                  <FiBell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </button>
              </div> */}
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <button onClick={toggleDropdown}>
                    <FiUser className="h-4 w-4 text-indigo-600" />
                  </button>
                </div>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user.first_name || user.username}
                </span>
              </div>
            </div>
          </div>

          {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <Link
                        to="profile"
                        className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        
                    >
                        Profile
                    </Link>
                   
                    {/* <Link
                        to="/settings"
                        className="block px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      
                    >
                        Account Settings
                    </Link> */}
                    <button
                        onClick={() => {
                            logoutUser();
                            
                        }}
                        className="w-full text-left px-4 py-3 text-gray-800 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;