import React, { useState } from 'react';
import API from '../../utils/api';
import { jwtDecode } from "jwt-decode";


const OtpVerification = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);

  const verifyOtp = async () => {
    try {
      const response = await API.post('/verify-otp/', { email, otp });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Something went wrong');
    }
  };

  const resendOtp = async () => {
    setResendDisabled(true);
    try {
      const response = await API.post('/resend-otp/', { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setTimeout(() => setResendDisabled(false), 60000); // 60s delay
    }
  };

  return (
    <div className="otp-container">
      <h2>Email Verification</h2>
      <input
        type="email"
        placeholder="Enter your registered email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br />
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
      /><br />
      <button onClick={verifyOtp}>Verify OTP</button>
      <button onClick={resendOtp} disabled={resendDisabled}>
        {resendDisabled ? 'Resend in 60s' : 'Resend OTP'}
      </button>
      <p>{message}</p>
    </div>
  );
};

export default OtpVerification;
