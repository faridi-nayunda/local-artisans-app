import { useContext, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const ProfileForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { authTokens } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    legal_name: '',
    business_name: '',
    phone_number: '',
    business_address: '',
    store_name: '',
    store_logo: null,
    store_description: '',
    bank_account: '',
    routing_number: '',
    government_id: null,
    ship_from_address: '',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    try {
      const method = isEditing ? 'patch' : 'post';
      const response = await API({
        method,
        url: 'seller-profile/',
        data,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authTokens?.access}`,
        },
      });

      if (response.status === 201) {
        alert('Profile submitted successfully!');
        navigate('/seller');
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      setMessage('Error submitting profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-md space-y-6 max-w-3xl mx-auto">
      {message && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          {message}
        </div>
      )}

      <div className='my-2'>
        <h1 className='text-xl text-green-700 font-semibold'>Complete the following Information to Create your Business Account</h1>
      </div>

      {/* Business Information */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Business Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Legal Name (Private)
              <span className="text-sm text-gray-700 ml-1">(Required for tax verification)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              Must match your government ID or business registration documents. Only visible to platform administrators.
            </p>
            <input
              type="text"
              name="legal_name"
              onChange={handleChange}
              value={formData.legal_name}
              className="w-full border p-2 rounded"
              placeholder="e.g. John Smith or Smith Enterprises LLC"
              required
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Business Name (Visible to customers)
              <span className="text-sm text-gray-700 ml-1">(Required)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              This will appear on invoices and may be shown to customers. Can be your brand name.
            </p>
            <input
              type="text"
              name="business_name"
              onChange={handleChange}
              value={formData.business_name}
              className="w-full border p-2 rounded"
              placeholder="e.g. Premium Gadgets"
              required
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Phone Number
              <span className="text-sm text-gray-700 ml-1">(Required)</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              onChange={handleChange}
              value={formData.phone_number}
              className="w-full border p-2 rounded"
              placeholder="+255-684-005-606"
              required
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Business Address
              <span className="text-sm text-gray-700 ml-1">(Required for verification)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              Must be a physical address (no PO boxes). Used for tax purposes and verification.
            </p>
            <input
              type="text"
              name="business_address"
              onChange={handleChange}
              value={formData.business_address}
              className="w-full border p-2 rounded"
              placeholder="123 Main St, City, Country"
              required
            />
          </div>
        </div>
      </div>

      {/* Store Information */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Store Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Store Name
              <span className="text-sm text-gray-700 ml-1">(Required)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              This will be your public storefront name. Customers will see this when shopping.
            </p>
            <input
              type="text"
              name="store_name"
              onChange={handleChange}
              value={formData.store_name}
              className="w-full border p-2 rounded"
              placeholder="e.g. Tech Haven"
              required
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Store Logo
              <span className="text-sm text-gray-700 ml-1">(Recommended)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              PNG or JPG, 500x500px recommended. Will appear on your store page.
            </p>
            <input
              type="file"
              name="store_logo"
              accept="image/*"
              onChange={handleChange}
              className="w-full border p-2 rounded bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Store Description
              <span className="text-sm text-gray-700 ml-1">(Required)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              Tell customers about your store (120-300 characters recommended).
            </p>
            <textarea
              name="store_description"
              onChange={handleChange}
              value={formData.store_description}
              className="w-full border p-2 rounded"
              rows={4}
              placeholder="We specialize in premium electronics with fast shipping and excellent customer service..."
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Payment Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Bank Account Number
              <span className="text-sm text-gray-700 ml-1">(Required for payouts)</span>
            </label>
            <p className="text-sm text-gray-700 mb-2">
              Must match the account holder's legal name. We use encryption to protect your data.
            </p>
            <input
              type="text"
              name="bank_account"
              onChange={handleChange}
              value={formData.bank_account}
              className="w-full border p-2 rounded"
              placeholder="e.g. 123456789"
              required
            />
          </div>

          <div>
            <label className="block text-md font-bold text-gray-700 mb-1">
              Routing Number
              <span className="text-sm text-gray-700 ml-1">(Required for TZ banks)</span>
            </label>
            <input
              type="text"
              name="routing_number"
              onChange={handleChange}
              value={formData.routing_number}
              className="w-full border p-2 rounded"
              placeholder="e.g. 021000021"
              required
            />
          </div>
        </div>
      </div>

      {/* Identity Verification */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-bold mb-4">Identity Verification</h2>
        <div>
          <label className="block text-md font-bold text-gray-700 mb-1">
            Government-issued ID
            <span className="text-sm text-gray-700 ml-1">(Required for verification)</span>
          </label>
          <p className="text-sm text-gray-700 mb-2">
            Upload a clear photo/scan of your passport, driver's license, or national ID. PDF, JPG, or PNG.
          </p>
          <input
            type="file"
            name="government_id"
            accept=".pdf, image/*"
            onChange={handleChange}
            className="w-full border p-2 rounded bg-gray-50"
            required
          />
        </div>
      </div>

      {/* Ship From Address */}
      <div className="pb-6">
        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
        <div>
          <label className="block text-md font-bold text-gray-700 mb-1">
            Ship From Address
            <span className="text-sm text-gray-700 ml-1">(Optional)</span>
          </label>
          <p className="text-sm text-gray-700 mb-2">
            If different from your business address. This will be shown on shipping labels.
          </p>
          <input
            type="text"
            name="ship_from_address"
            onChange={handleChange}
            value={formData.ship_from_address}
            className="w-full border p-2 rounded"
            placeholder="Same as business address if left blank"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Processing...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;