import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { jwtDecode } from "jwt-decode";
import AuthContext from '../../context/AuthContext';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false); // Optional loading state
  const { setAuthTokens, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('pendingEmail');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleVerify = async () => {
    try {
      const response = await API.post('/verify-otp/', { email, otp });
      const { access_token, refresh_token } = response.data;

      const decoded = jwtDecode(access_token);
      const tokens = {
        access: access_token,
        refresh: refresh_token
      };

      setAuthTokens(tokens);
      setUser({
        ...decoded,
        role: decoded.role || 'customer',
        is_staff: decoded.is_staff || false
      });
      localStorage.setItem("authTokens", JSON.stringify(tokens));

      setMessage('✅ Email verified successfully!');
      localStorage.removeItem('pendingEmail');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Verification failed. Try again.');
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const response = await API.post('/resend-otp/', { email });
      setMessage(response.data.message || 'A new OTP has been sent.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Verify Your Email</h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">OTP Code</label>
        <input
          type="text"
          maxLength={6}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Verify OTP
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Didn’t receive the code?{' '}
          <button
            onClick={handleResendOtp}
            disabled={resending}
            className="text-indigo-600 hover:underline font-semibold disabled:opacity-50"
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
