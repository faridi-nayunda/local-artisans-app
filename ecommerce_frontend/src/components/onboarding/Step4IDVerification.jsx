// Step4IDVerification.jsx
import React from "react";

const Step4IDVerification = ({ data, onFileChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Identity Verification</h3>
      <input
        type="file"
        name="government_id"
        onChange={onFileChange}
        className="w-full mb-4 p-2 border rounded"
      />
    </div>
  );
};

export default Step4IDVerification;