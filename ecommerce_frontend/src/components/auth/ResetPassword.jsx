import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const validatePasswordStrength = (password) => {
    let strength = 0;
    let messages = [];
    
    // Length check
    if (password.length < 8) {
      messages.push("Password must be at least 8 characters long");
    } else {
      strength += 1;
    }
    
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      messages.push("Include at least one uppercase letter");
    } else {
      strength += 1;
    }
    
    // Lowercase check
    if (!/[a-z]/.test(password)) {
      messages.push("Include at least one lowercase letter");
    } else {
      strength += 1;
    }
    
    // Number check
    if (!/[0-9]/.test(password)) {
      messages.push("Include at least one number");
    } else {
      strength += 1;
    }
    
    // Special character check
    if (!/[^A-Za-z0-9]/.test(password)) {
      messages.push("Include at least one special character");
    } else {
      strength += 1;
    }
    
    setPasswordStrength(strength);
    setPasswordError(messages.length > 0 ? messages.join(". ") : "");
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePasswordStrength(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (passwordError) {
      setError("Please fix password requirements before submitting");
      return;
    }

    try {
      const response = await API.post('/password-reset-confirm/', {
        token,
        password
      });

      // Clear form on success
      setPassword('');
      setConfirmPassword('');
      setMessage('Password reset successfully! You can now login with your new password.');
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      'Error resetting password';
      setError(errorMsg.includes('expired') ? 
          'This reset link has expired. Please request a new one.' : 
          errorMsg);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Set New Password</h2>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{message}</div>}

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={handlePasswordChange}
          className="w-full px-4 py-2 mb-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        {/* Password strength meter */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full ${getPasswordStrengthColor()}`} 
            style={{ width: `${(passwordStrength/5)*100}%` }}
          ></div>
        </div>
        
        {passwordError && (
          <p className="text-red-500 text-sm mb-4">{passwordError}</p>
        )}
        
        {/* <div className="text-xs text-gray-500 mb-4">
          Password must contain at least:
          <ul className="list-disc pl-5 mt-1">
            <li>8 characters</li>
            <li>1 uppercase letter</li>
            <li>1 lowercase letter</li>
            <li>1 number</li>
            <li>1 special character</li>
          </ul>
        </div> */}

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          disabled={!!passwordError}
          className={`w-full ${passwordError ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 rounded-md transition duration-200`}
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;