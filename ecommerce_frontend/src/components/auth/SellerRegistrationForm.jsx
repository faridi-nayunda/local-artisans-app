import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const SellerRegistrationForm = () => {
  const { createSellerAccount, checkSellerAccount, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessEmail: user?.email || '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => {
    const checkExistingAccount = async () => {
      if (formData.businessEmail) {
        const exists = await checkSellerAccount(formData.businessEmail);
        setAccountExists(exists);
      }
    };

    const debounceTimer = setTimeout(checkExistingAccount, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.businessEmail, checkSellerAccount]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (accountExists) {
      navigate('/seller/login');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createSellerAccount(formData.businessEmail, formData.password);
      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {accountExists ? 'Seller Account Found' : 'Register as a Seller'}
        </h2>

        {accountExists ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 border border-blue-100">
              A seller account already exists with the email:{" "}
              <strong>{formData.businessEmail}</strong>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
            >
              Go to Seller Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="businessEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Business Email
              </label>
              <input
                type="email"
                id="businessEmail"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleChange}
                required
                placeholder="e.g. artisan@example.com"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Your Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Your current password"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                For security, confirm your current password to proceed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 font-semibold rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Seller Account'}
            </button>
          </>
        )}

        <div className="mt-6 text-sm text-center text-gray-600">
          {accountExists ? (
            <>
              Need to register with a new email?{' '}
              <button
                type="button"
                onClick={() => setAccountExists(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Log in here
              </Link>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          By {accountExists ? 'logging in' : 'registering'}, you agree to our{' '}
          <a
            href="/seller-terms"
            className="text-blue-600 hover:underline font-medium"
          >
            Seller Terms & Conditions
          </a>.
        </div>
      </form>
    </div>
  );
};

export default SellerRegistrationForm;
