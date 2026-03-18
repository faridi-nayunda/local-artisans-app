// Step1BusinessInfo.jsx
import React from "react";

const Step1BusinessInfo = ({ data, onChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Business Information</h3>
      <input
        type="text"
        name="legal_name"
        placeholder="Legal Name"
        value={data.legal_name}
        onChange={(e) => onChange("legal_name", e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        name="business_name"
        placeholder="Business Name"
        value={data.business_name}
        onChange={(e) => onChange("business_name", e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        name="phone_number"
        placeholder="Phone Number"
        value={data.phone_number}
        onChange={(e) => onChange("phone_number", e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <textarea
        name="business_address"
        placeholder="Business Address"
        value={data.business_address}
        onChange={(e) => onChange("business_address", e.target.value)}
        className="w-full p-2 border rounded"
      ></textarea>
    </div>
  );
};

export default Step1BusinessInfo;