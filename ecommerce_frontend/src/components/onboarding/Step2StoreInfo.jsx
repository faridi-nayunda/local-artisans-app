// Step2StoreInfo.jsx
import React from "react";

const Step2StoreInfo = ({ data, onChange, onFileChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Store Information</h3>
      <input
        type="text"
        name="store_name"
        placeholder="Store Name"
        value={data.store_name}
        onChange={(e) => onChange("store_name", e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="file"
        name="store_logo"
        onChange={onFileChange}
        className="w-full mb-4 p-2 border rounded"
      />
      <textarea
        name="store_description"
        placeholder="Store Description"
        value={data.store_description}
        onChange={(e) => onChange("store_description", e.target.value)}
        className="w-full p-2 border rounded"
      ></textarea>
    </div>
  );
};

export default Step2StoreInfo;