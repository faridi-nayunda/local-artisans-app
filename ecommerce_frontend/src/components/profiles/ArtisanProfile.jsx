import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';

const ArtisanProfile = () => {
  const { authTokens } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sectionEditing, setSectionEditing] = useState({
    business: false,
    store: false,
    payment: false,
    identity: false,
    shipping: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await API.get('/seller-profile/', {
          headers: {
            Authorization: `Bearer ${authTokens?.access}`,
          },
        });
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const toggleSectionEdit = (section) => {
    setSectionEditing(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSectionSubmit = async (e, section) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData();
    
    const sectionFields = {
      business: ['legal_name', 'business_name', 'business_address', 'phone_number'],
      store: ['store_name', 'store_logo', 'store_description'],
      payment: ['bank_account', 'routing_number'],
      identity: ['government_id'],
      shipping: ['ship_from_address']
    };

    sectionFields[section].forEach(field => {
      if (formData[field]) data.append(field, formData[field]);
    });

    try {
      const res = await API.patch('/seller-profile/', data, {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      setSectionEditing(prev => ({ ...prev, [section]: false }));
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center space-x-4">
              {profile.store_logo && (
                <img 
                  src={profile.store_logo} 
                  alt="Store Logo" 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md" 
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{profile.store_name || 'Your Store'}</h1>
                <p className="text-blue-100">{profile.business_name}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm font-semibold">Seller Status</p>
              <p className="text-lg font-bold">
                {profile.government_id ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Seller Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Store Created</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Products</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders Completed</span>
                  <span className="font-medium">--</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">Add New Product</a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">View Orders</a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">Sales Analytics</a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">Customer Messages</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Profile Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                <button 
                  onClick={() => toggleSectionEdit('business')} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {sectionEditing.business ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {sectionEditing.business ? (
                <form onSubmit={(e) => handleSectionSubmit(e, 'business')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Legal Name (Private)
                      </label>
                      <input 
                        type="text" 
                        name="legal_name" 
                        onChange={handleChange} 
                        value={formData.legal_name || ''} 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name (Public)
                      </label>
                      <input 
                        type="text" 
                        name="business_name" 
                        onChange={handleChange} 
                        value={formData.business_name || ''} 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      name="phone_number" 
                      onChange={handleChange} 
                      value={formData.phone_number || ''} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address
                    </label>
                    <input 
                      type="text" 
                      name="business_address" 
                      onChange={handleChange} 
                      value={formData.business_address || ''} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => toggleSectionEdit('business')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Legal Name</span>
                    <span className="text-sm text-gray-900">{profile.legal_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Business Name</span>
                    <span className="text-sm text-gray-900">{profile.business_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Phone Number</span>
                    <span className="text-sm text-gray-900">{profile.phone_number}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-500">Business Address</span>
                    <span className="text-sm text-gray-900 text-right">{profile.business_address}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Store Information Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>
                <button 
                  onClick={() => toggleSectionEdit('store')} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {sectionEditing.store ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {sectionEditing.store ? (
                <form onSubmit={(e) => handleSectionSubmit(e, 'store')} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name
                    </label>
                    <input 
                      type="text" 
                      name="store_name" 
                      onChange={handleChange} 
                      value={formData.store_name || ''} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Logo
                    </label>
                    <div className="mt-1 flex items-center">
                      <input 
                        type="file" 
                        name="store_logo" 
                        accept="image/*" 
                        onChange={handleChange} 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {profile.store_logo && (
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-3">Current:</span>
                        <img src={profile.store_logo} alt="Store Logo" className="h-12 w-12 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Description
                    </label>
                    <textarea 
                      name="store_description" 
                      onChange={handleChange} 
                      value={formData.store_description || ''} 
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => toggleSectionEdit('store')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Store Name</span>
                    <span className="text-sm text-gray-900">{profile.store_name}</span>
                  </div>
                  <div className="flex items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500 mr-4">Store Logo</span>
                    {profile.store_logo ? (
                      <img src={profile.store_logo} alt="Store Logo" className="h-12 w-12 rounded-full" />
                    ) : (
                      <span className="text-sm text-gray-400">No logo uploaded</span>
                    )}
                  </div>
                  <div className="py-2">
                    <span className="text-sm font-medium text-gray-500 block mb-1">Store Description</span>
                    <p className="text-sm text-gray-900">{profile.store_description || 'No description provided'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Information Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                <button 
                  onClick={() => toggleSectionEdit('payment')} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {sectionEditing.payment ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {sectionEditing.payment ? (
                <form onSubmit={(e) => handleSectionSubmit(e, 'payment')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Account Number
                      </label>
                      <input 
                        type="text" 
                        name="bank_account" 
                        onChange={handleChange} 
                        value={formData.bank_account || ''} 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Routing Number
                      </label>
                      <input 
                        type="text" 
                        name="routing_number" 
                        onChange={handleChange} 
                        value={formData.routing_number || ''} 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Your payment information is securely encrypted and never stored in plain text.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => toggleSectionEdit('payment')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Bank Account</span>
                    <span className="text-sm text-gray-900">
                      {profile.bank_account ? `••••••••${profile.bank_account.slice(-4)}` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-500">Routing Number</span>
                    <span className="text-sm text-gray-900">
                      {profile.routing_number ? '••••••••' : 'Not set'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Verification Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
                <button 
                  onClick={() => toggleSectionEdit('identity')} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {sectionEditing.identity ? 'Cancel' : profile.government_id ? 'Update' : 'Add'}
                </button>
              </div>

              {sectionEditing.identity ? (
                <form onSubmit={(e) => handleSectionSubmit(e, 'identity')} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Government-issued ID (PDF, JPG, PNG)
                    </label>
                    <div className="mt-1 flex items-center">
                      <input 
                        type="file" 
                        name="government_id" 
                        accept=".pdf, image/*" 
                        onChange={handleChange} 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={!profile.government_id}
                      />
                    </div>
                    {profile.government_id && (
                      <p className="mt-2 text-sm text-gray-500">Uploading a new file will replace your existing ID.</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => toggleSectionEdit('identity')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isLoading ? 'Uploading...' : profile.government_id ? 'Update ID' : 'Upload ID'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-500">Verification Status</span>
                    <span className={`text-sm font-medium ${
                      profile.government_id ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {profile.government_id ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  {profile.government_id && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Your identity has been verified. Thank you for completing this important step.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Address Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                <button 
                  onClick={() => toggleSectionEdit('shipping')} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {sectionEditing.shipping ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {sectionEditing.shipping ? (
                <form onSubmit={(e) => handleSectionSubmit(e, 'shipping')} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ship From Address (if different from business address)
                    </label>
                    <input 
                      type="text" 
                      name="ship_from_address" 
                      onChange={handleChange} 
                      value={formData.ship_from_address || ''} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => toggleSectionEdit('shipping')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-500">Primary Shipping Address</span>
                    <span className="text-sm text-gray-900 text-right">
                      {profile.ship_from_address || profile.business_address}
                    </span>
                  </div>
                  {!profile.ship_from_address && (
                    <p className="text-xs text-gray-500 mt-1">Using business address as default shipping address</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanProfile;