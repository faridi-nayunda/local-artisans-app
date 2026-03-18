import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../../context/CartContext';
import AuthContext from '../../context/AuthContext';
import API from '../../utils/api';

const Payment = () => {
  const { cart, checkout } = useContext(CartContext);
  const { authTokens, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pesapal'); // default

  // Payment form state
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New address form state
  const [addressData, setAddressData] = useState({
    fullName: user?.username || '',
    phone: user?.phone_number || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Tanzania',
    isDefault: false
  });

  // UI state
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [saveAddress, setSaveAddress] = useState(true);

  // Calculate order totals
  const shippingPrice = calculateShipping(cart, addressData.country);
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const orderTotal = subtotal + shippingPrice;

  // Calculate shipping based on country and cart items
  function calculateShipping(cartItems, country) {
    let basePrice = 0.00; // Default for Tanzania
    if (country === 'Kenya') basePrice = 12.99;
    if (country === 'Uganda') basePrice = 14.99;
    if (country === 'Rwanda') basePrice = 15.99;
    if (country === 'Burundi') basePrice = 16.99;
    
    const heavyItems = cartItems.filter(item => item.weight > 5).length;
    return basePrice + (heavyItems * 2.50);
  }

  // Format address for display
  const formatAddress = (address) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Load saved addresses and detect location on component mount
  useEffect(() => {
    // In a real app, load from your backend API
    const savedAddresses = [
      {
        id: 1,
        fullName: user?.username || 'Faridi Suleimani',
        phone: user?.phone_number || '+255 657 125 950',
        addressLine1: 'Mzumbe',
        addressLine2: '',
        city: 'Morogoro',
        state: 'Morogoro',
        postalCode: '1234455777000',
        country: 'Tanzania',
        isDefault: true
      }
    ];
    
    setAddresses(savedAddresses);
    setSelectedAddressId(savedAddresses[0]?.id || null);
    
    // Auto-detect location
    detectLocation();
  }, []);

  // Detect user's location and fetch address
  const detectLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.error) {
            setLocationError("Could not retrieve address from location");
          } else {
            const newAddress = {
              fullName: user?.username || '',
              phone: user?.phone_number || '',
              addressLine1: data.address?.road || '',
              addressLine2: '',
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: data.address?.state || '',
              postalCode: data.address?.postcode || '',
              country: data.address?.country || 'Tanzania',
              isDefault: false
            };
            
            setAddressData(newAddress);
            
            // Add to addresses if not already there
            const formattedNew = formatAddress(newAddress);
            if (!addresses.some(addr => formatAddress(addr) === formattedNew)) {
              const updatedAddresses = [...addresses, { ...newAddress, id: Date.now() }];
              setAddresses(updatedAddresses);
              setSelectedAddressId(updatedAddresses[updatedAddresses.length - 1].id);
            }
          }
        } catch (error) {
          setLocationError("Error fetching address details");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location. You can enter it manually.");
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  // Handle adding/updating address
  const handleSaveAddress = () => {
    if (!validateAddress()) return;
    
    let updatedAddresses = [];
    if (isEditing) {
      // Update existing address
      updatedAddresses = addresses.map(addr => 
        addr.id === selectedAddressId ? { ...addressData, id: selectedAddressId } : addr
      );
    } else {
      // Add new address
      const newAddress = { ...addressData, id: Date.now() };
      updatedAddresses = [...addresses, newAddress];
      setSelectedAddressId(newAddress.id);
    }
    
    setAddresses(updatedAddresses);
    setShowAddressForm(false);
    setIsEditing(false);
  };

  // Handle address selection
  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
    setShowAddressForm(false);
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    setAddressData(address);
    setIsEditing(true);
    setShowAddressForm(true);
  };

  // Handle add new address
  const handleAddNewAddress = () => {
    setAddressData({
      fullName: user?.username || '',
      phone: user?.phone_number ||'',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Tanzania',
      isDefault: false
    });
    setIsEditing(false);
    setShowAddressForm(true);
  };

  // Validate address fields
  const validateAddress = () => {
    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'postalCode'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!addressData[field]) {
        missingFields.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
      }
    }
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
    if (!phoneRegex.test(addressData.phone)) {
      alert('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  // Format payment card inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    if (id === 'cardNumber') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formatted = '';
      for (let i = 0; i < v.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += v[i];
      }
      setFormData(prev => ({ ...prev, [id]: formatted }));
      return;
    }
    
    if (id === 'expiryDate') {
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formatted = '';
      for (let i = 0; i < v.length; i++) {
        if (i === 2) formatted += '/';
        if (i >= 6) break;
        formatted += v[i];
      }
      setFormData(prev => ({ ...prev, [id]: formatted }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Validate payment form
  const validatePayment = () => {
    if (!formData.cardholderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
      alert('Please fill all card fields');
      return false;
    }
    
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Please enter a valid 16-digit card number');
      return false;
    }
    
    // Validate expiry date (MM/YYYY format)
    const [month, year] = formData.expiryDate.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 4) {
      alert('Please enter a valid expiry date in MM/YYYY format');
      return false;
    }
    
    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      alert('Please enter a valid CVV (3-4 digits)');
      return false;
    }
    
    return true;
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
  if (!authTokens) {
    navigate('/login', { state: { from: '/checkout/payment' } });
    return;
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  if (!selectedAddress) {
    alert("Please select a shipping address.");
    return;
  }

  if (selectedPaymentMethod === 'new_card' && !validatePayment()) return;

  try {
    setLoading(true);

    // Create shipment
    const shipmentRes = await API.post('/shipments/', {
      shipping_full_name: selectedAddress.fullName,
      shipping_phone: selectedAddress.phone,
      shipping_address_line1: selectedAddress.addressLine1,
      shipping_address_line2: selectedAddress.addressLine2,
      shipping_city: selectedAddress.city,
      shipping_state: selectedAddress.state,
      shipping_postal_code: selectedAddress.postalCode,
      shipping_country: selectedAddress.country
    }, {
      headers: { Authorization: `Bearer ${authTokens.access}` }
    });
    const shipmentId = shipmentRes.data.shipment_id;

    // Create payment
    const paymentData = selectedPaymentMethod === 'pesapal'
      ? { payment_method: 'pesapal' }
      : {
          payment_method: 'card',
          card_number: formData.cardNumber.replace(/\s/g, ''),
          transaction_id: '',
        };

    const paymentRes = await API.post('/payments/', paymentData, {
      headers: { Authorization: `Bearer ${authTokens.access}` }
    });
    const paymentId = paymentRes.data.payment_id;

    // Call checkout() from context
    await checkout({ shipment_id: shipmentId, payment_id: paymentId });

    // Navigate to confirmation page
    // navigate('/order-success');

  } catch (err) {
    console.error('Checkout error:', err.response?.data || err.message);
    alert(err.response?.data?.error || 'Checkout failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Shipping and Payment */}
        <div className="space-y-8">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              
              {locationLoading && !showAddressForm ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Detecting your location...</span>
                </div>
              ) : showAddressForm ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isEditing ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={addressData.fullName}
                        onChange={(e) => setAddressData({...addressData, fullName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={addressData.phone}
                        onChange={(e) => setAddressData({...addressData, phone: e.target.value})}
                        placeholder="+255 XXX XXX XXX"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={addressData.addressLine1}
                        onChange={(e) => setAddressData({...addressData, addressLine1: e.target.value})}
                        placeholder="House number, street name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                        Apartment, Suite, etc. (Optional)
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={addressData.addressLine2}
                        onChange={(e) => setAddressData({...addressData, addressLine2: e.target.value})}
                        placeholder="Apartment, suite, unit, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={addressData.city}
                          onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          State/Region <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="state"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={addressData.state}
                          onChange={(e) => setAddressData({...addressData, state: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                          Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={addressData.postalCode}
                          onChange={(e) => setAddressData({...addressData, postalCode: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="country"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={addressData.country}
                          onChange={(e) => setAddressData({...addressData, country: e.target.value})}
                        >
                          <option value="Tanzania">Tanzania</option>
                          {/* <option value="Kenya">Kenya</option>
                          <option value="Uganda">Uganda</option>
                          <option value="Rwanda">Rwanda</option>
                          <option value="Burundi">Burundi</option> */}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={addressData.isDefault}
                        onChange={(e) => setAddressData({...addressData, isDefault: e.target.checked})}
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                        Set as my default shipping address
                      </label>
                    </div>
                    
                    <div className="flex space-x-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isEditing ? 'Update Address' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedAddressId && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            Delivering to {addresses.find(a => a.id === selectedAddressId)?.fullName || user?.username}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatAddress(addresses.find(a => a.id === selectedAddressId))}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditAddress(addresses.find(a => a.id === selectedAddressId))}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {locationError && (
                    <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
                      {locationError}
                    </div>
                  )}
                  
                  <button
                    onClick={handleAddNewAddress}
                    className="w-full mt-4 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add New Address
                  </button>
                  
                  {addresses.length > 1 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Other addresses</h4>
                      <div className="space-y-3">
                        {addresses.filter(a => a.id !== selectedAddressId).map(address => (
                          <div key={address.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                            <div className="flex justify-between">
                              <div onClick={() => handleSelectAddress(address.id)} className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
                                <p className="text-xs text-gray-500">{formatAddress(address)}</p>
                              </div>
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-2"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Methods Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="text-center mb-4 pt-6">
              <h1 className="text-xl font-bold text-gray-900">Payment Method</h1>
              <p className="mt-1 text-sm text-gray-600">Choose how you would like to pay</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Method Radio Buttons */}
              <div>
                <label className="flex items-center space-x-4">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pesapal"
                    checked={selectedPaymentMethod === 'pesapal'}
                    onChange={() => setSelectedPaymentMethod('pesapal')}
                  />
                  <span>Pay with Pesapal</span>
                </label>
                <label className="flex items-center space-x-4 mt-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="new_card"
                    checked={selectedPaymentMethod === 'new_card'}
                    onChange={() => setSelectedPaymentMethod('new_card')}
                  />
                  <span>Pay with New Card</span>
                </label>
              </div>

              {/* Show card form only if new_card selected */}
              {selectedPaymentMethod === 'new_card' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        Expiration Date (MM/YYYY)
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        maxLength={7}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="password"
                        id="cvv"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Your payment and address information is processed securely. We do not store your credit card details.</p>
          </div>
        </div>

        {/* Right column - Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-6">ORDER SUMMARY</h2>
          
          <div className="space-y-4">
            {cart.map(item => {
              const price = Number(item.price);
              return (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">TZS {(price * item.quantity).toFixed(2)}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-sm font-medium text-gray-900">TZS {subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-gray-600">Shipping</p>
              <p className="text-sm font-medium text-gray-900">TZS {shippingPrice.toFixed(2)}</p>
            </div>
            {addressData.country !== 'Tanzania' && (
              <div className="text-xs text-gray-500">
                International shipping to {addressData.country}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="flex justify-between mb-6">
            <p className="text-base font-medium text-gray-900">Order Total</p>
            <p className="text-base font-bold text-gray-900">TZS {orderTotal.toFixed(2)}</p>
          </div>

          <div className="flex items-center mb-6">
            <input
              id="save-address"
              name="save-address"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
            />
            <label htmlFor="save-address" className="ml-2 block text-sm text-gray-900">
              Save shipping address for future orders
            </label>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={loading || !selectedAddressId}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading || !selectedAddressId ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Confirm Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;